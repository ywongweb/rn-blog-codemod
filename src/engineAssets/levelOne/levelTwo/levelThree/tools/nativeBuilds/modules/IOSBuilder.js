const execSync = require('child_process').execSync
const _ = require('lodash')
const { Logger } = require('../../engineCli/src/utils/logger')

const IOSBuildFlavors = {
  devDebugSim: {
    scheme: '{MOD_APP_NAME}',
    config: 'Debug',
    flavorDir: 'Debug',
  },
  devDebugDevice: {
    scheme: '{MOD_APP_NAME}',
    config: 'Debug',
    flavorDir: 'Debug',
  },
  devDebugAdhoc: {
    scheme: '{MOD_APP_NAME}',
    config: 'Release',
    flavorDir: 'Release',
  },
}

class IOSBuilder {
  constructor() {
    this._repoDir = `${__dirname}/../../../../../..`
    this._engineIosDir = `${this._repoDir}/levelOne/levelTwo/levelThree/ios`
    this._workspacePath = `${this._engineIosDir}/{MOD_APP_NAME}.xcworkspace`
    this._xcodebuildTargetDir = `${this._repoDir}/build/Products/Release-iphoneos`
  }

  build(platform, buildType) {
    Logger.info(
      `Building app binary for platform: ${JSON.stringify(
        platform,
      )} of type ${buildType}`,
    )
    const binaryPath = this._buildiOSBinary(platform, buildType, '999.999.999')
    return binaryPath
  }

  _buildiOSBinary(platform, buildType, version) {
    const buildFlavor = IOSBuildFlavors[buildType]
    const archivePath = this._archivePath(buildFlavor.scheme, version)
    const configuration = buildFlavor.config

    const buildCommand = `RCT_NO_LAUNCH_PACKAGER=true xcodebuild \
      -workspace "${this._workspacePath}" \
      -scheme "${buildFlavor.scheme}" \
      -configuration ${configuration} \
      -sdk ${platform.name} \
      -archivePath '${archivePath}' \
      -derivedDataPath ${this._engineIosDir}/DerivedData/{MOD_APP_NAME} \
      -UseModernBuildSystem=YES \
      ${platform.buildCmd} -quiet
    `

    Logger.info('Building iOS:')
    Logger.info(buildCommand)
    execSync(buildCommand, {stdio: 'inherit'})

    let binaryPath
    Logger.info(`Build command:${platform.buildCmd}`)
    if (platform.buildCmd === 'build') {
      // build as .app
      binaryPath = this._copyToAppBuilds(platform, buildType, buildFlavor)
    } else if (platform.buildCmd === 'archive') {
      console.log('archiving........')
      // archive as .ipa
      binaryPath = this._extractIpa(buildType, version)
    }

    return binaryPath
  }

  _copyToAppBuilds(platform, buildType, buildFlavor) {
    const source = `${this._engineIosDir}/DerivedData/{MOD_APP_NAME}/build/Products/${buildFlavor.flavorDir}-${platform.name}/{MOD_APP_NAME}.${platform.ext}`
    const destinationDir = `${this._repoDir}/levelOne/levelTwo/levelThree/appBuilds/${platform.name}/${buildType}`
    execSync(`mkdir -p ${destinationDir}`)
    const destination = `${destinationDir}/{MOD_APP_NAME}.app`
    execSync(`rm -rf ${destination}`)
    const copyCommand = `cp -a '${source}' '${destination}'`
    Logger.info(`Copying: ${copyCommand}`)
    execSync(copyCommand)
    return destination
  }

  _extractIpa(buildType, version) {
    const buildFlavor = IOSBuildFlavors[buildType]
    const configuration = buildFlavor.flavorDir
    const archivePath = this._archivePath(buildFlavor.scheme, version)
    const tempDir = execSync('mktemp -d /tmp/EngineBuild.XX').toString().trim()
    // See doc for how to generate the ExportOptionsPlist file
    const xcodeBuildCommand = `xcodebuild -exportArchive \
    -UseModernBuildSystem=YES \
    -archivePath "${archivePath}" \
    -exportOptionsPlist "${this._engineIosDir}/ExportOptions${configuration}.plist" \
    -exportPath "${tempDir}"`
    Logger.info(`Extracting .ipa: ${xcodeBuildCommand}`)
    execSync(xcodeBuildCommand)

    const finalBinaryDirectory = `"${this._repoDir}/levelOne/levelTwo/levelThree/appBuilds/iphoneos/${buildType}"`
    execSync(`mkdir -p ${finalBinaryDirectory}`)
    execSync(`cp -v -R "${tempDir}/" ${finalBinaryDirectory}/`)
    execSync(`rm -rf ${tempDir}`)
    return `${finalBinaryDirectory}/{MOD_APP_NAME}.ipa`
  }

  setIosVersion(version, shortVersion) {
    process.chdir(`${__dirname}/../../../ios/`) // this is a bad practice - we should not change the engine; but it will probably change in the future anyway, so patching it this way for now
    execSync(`agvtool new-version -all ${version}`)
    execSync(`agvtool new-marketing-version ${shortVersion}`)
    process.chdir(`${__dirname}`)
  }

  _archivePath(scheme, version) {
    return `${this._xcodebuildTargetDir}/${scheme}_${version}.xcarchive`
  }

  static _normalizeSpace(str) {
    if (!_.isString(str)) {
      return undefined
    }
    return _.replace(_.trim(str), /\s+/g, '')
  }
}

module.exports = {
  IOSBuilder,
}
