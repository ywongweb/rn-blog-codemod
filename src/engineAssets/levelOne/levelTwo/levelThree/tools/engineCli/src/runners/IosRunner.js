const childProcess = require('child_process')
const _ = require('lodash')
const {promisify} = require('util')
const {Logger} = require('../utils/Logger')
const fs = require('fs')
const retry = require('../utils/retry')

function parseIOSDevicesList(text) {
  const devices = []
  let isSimulator = false
  if (text.indexOf('== Simulators ==') === -1) {
    return []
  }
  text.split('\n').forEach(line => {
    if (line === '== Simulators ==') {
      isSimulator = true
    }
    const device = line.match(/(.*?) (\(([0-9.]+)\) )?\(([0-9A-F-]+)\)/i)
    if (device) {
      const [, name, , version, udid] = device
      const metadata = {name, udid}
      if (version) {
        metadata.version = version
        metadata.type = isSimulator ? 'simulator' : 'device'
      } else {
        metadata.type = 'catalyst'
      }
      devices.push(metadata)
    }
  })

  return devices
}

const asyncExec = promisify(childProcess.exec)

const BundleIds = {
  devDebugSim: '{MOD_APP_ID_DEV}',
  release: 'TBD',
}

class IosRunner {
  constructor(packagerWatcher, devicesNames, udids) {
    this._packagerWatcher = packagerWatcher
    this._devicesNames = devicesNames
    this._udids = udids
  }

  _getRealDevices() {
    let devicesX = []
    try {
      const out = childProcess.execSync('xcrun xctrace list devices').toString()
      devicesX = parseIOSDevicesList(out).filter(it => it.type === 'device')
    } catch (e) {
      console.log(e)
      console.warn(
        'Support for Xcode 11 and older is deprecated. Please upgrade to Xcode 12.',
      )
    }
    return devicesX
  }

  async run(engineDir, buildType, disableUninstall, target) {
    const devices = this._getDevices()
    const isRealDeviceRun = !!this._devicesNames
    let udids

    if (this._udids) {
      udids = this._parseUdids(this._udids)
    } else if (isRealDeviceRun) {
      const realDevices = this._getRealDevices()
      udids = this._findDevicesByNames(realDevices)
      if (udids.length === 0) {
        throw new Error(
          `Couldn't find devices matching the names '${this._devicesNames}'`,
        )
      }
    } else {
      // real device are always booted
      if (!isRealDeviceRun) {
        udids = this._getBootedDevicesIds(devices)
      }
    }

    const bundleId = BundleIds[buildType]
    await Promise.all(
      _.map(udids, async udid => {
        if (!isRealDeviceRun) {
          await this._bootDeviceIfNeeded(devices, udid)
        }
        if (!disableUninstall && !isRealDeviceRun) {
          await this._uninstallApp(udid, bundleId)
        }

        await retry({retries: 2, interval: 500}, async () => {
          if (isRealDeviceRun) {
            await this._installAppDevice({
              debugMode: false,
              buildType,
              engineDir,
            })
          } else {
            await this._installAppSim(udid, engineDir, buildType, target)
          }
        })

        await this._packagerWatcher.waitUntilUp()
        if (!isRealDeviceRun) {
          // we only need to handle sim runs as ios-deploy will launch the app
          await this._launchApp(udid, bundleId)
        }
      }),
    )
  }

  _installAppDevice({debugMode, buildType, engineDir}) {
    console.log(
      `ios-deploy: installing ${buildType} on device, this might take a minute...`,
    )
    childProcess.execSync(
      `ios-deploy --debug --bundle ${engineDir}/appBuilds/iphoneos/${buildType}/{MOD_APP_NAME}.app ${
        debugMode ? '' : '--justlaunch'
      }`,
    )
    console.log('ios-deploy: app installed')
  }

  _findDevicesByNames(allDevices) {
    const matchingDevices = allDevices.filter(it => {
      return this._devicesNames.indexOf(it.name) !== -1
    })
    return _.map(matchingDevices, 'udid')
  }

  _parseUdids(udids) {
    return udids.split(',')
  }

  _getBootedDevicesIds(allDevices) {
    const bootedDevices = _.filter(allDevices, {state: 'Booted'})
    return _.map(bootedDevices, 'udid')
  }

  _getDevices() {
    const devicesJson = JSON.parse(
      childProcess.execSync(`xcrun simctl list -j devices`),
    )
    return _.flatten(_.values(devicesJson.devices))
  }

  async _bootDeviceIfNeeded(allDevices, udid) {
    const device = _.filter(allDevices, {udid})[0]
    if (device.state === 'Booted') {
      return
    }

    Logger.info(`Booting iOS device ${udid}`)
    await asyncExec(`xcrun simctl boot ${udid}`)
  }

  async _uninstallApp(deviceUdid, bundleId) {
    Logger.info(`Uninstalling from iOS device ${deviceUdid}`)
    await asyncExec(`xcrun simctl uninstall ${deviceUdid} ${bundleId}`)
  }

  _buildApp(buildType, target) {
    const {NativeBuilds} = require('../../../nativeBuilds/index')
    NativeBuilds.buildIOS(target, buildType)
  }
  _buildAppIfNotExist(engineDir, buildType, target) {
    const appPath = `${engineDir}/appBuilds/${target.name}/${buildType}/{MOD_APP_NAME}.${target.ext}`
    if (!fs.existsSync(appPath)) {
      Logger.info(
        `Binary of ${Logger.colorQuote(buildType)} for ${Logger.colorQuote(
          target.name,
        )}  is not available at ${Logger.colorQuote(
          appPath,
        )}, Building it.....`,
      )
      this._buildApp(buildType, target)
    }
    return appPath
  }
  async _installAppSim(deviceUdid, engineDir, buildType, target) {
    const appPath = this._buildAppIfNotExist(engineDir, buildType, target)
    Logger.info(`Installing on iOS device ${deviceUdid}`)
    await asyncExec(`xcrun simctl install ${deviceUdid} ${appPath}`)
  }

  async _launchApp(deviceUdid, bundleId) {
    Logger.info(
      `Launching app ${bundleId} on device ${deviceUdid}.` +
        ` You can watch the device logs by running:\n` +
        `xcrun simctl spawn ${deviceUdid} log stream --level debug --style compact --predicate 'process=="{MOD_APP_NAME}" && subsystem=="com.facebook.react.log"'`,
    )
    await asyncExec(`xcrun simctl launch ${deviceUdid} ${bundleId}`)
  }
}

module.exports = {IosRunner}
