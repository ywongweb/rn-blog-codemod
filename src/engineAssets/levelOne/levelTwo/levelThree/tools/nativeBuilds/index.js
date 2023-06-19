const {IOSBuilder} = require('./modules/IOSBuilder')
const {AndroidBuilder} = require('./modules/AndroidBuilder')
const {Configurator} = require('./modules/Configurator')
const chalk = require('chalk')
class NativeBuilds {
  constructor() {
    this._configured = false
  }

  _configure() {
    if (!this._configured) {
      new Configurator().configure()
      this._configured = true
    }
  }

  buildIOS(platform, buildType) {
    this._configure()
    const iOSBuilder = new IOSBuilder()
    iOSBuilder.build(platform, buildType)
  }

  buildAndroid(buildType) {
    this._configure()
    const androidBuilder = new AndroidBuilder()
    try {
      androidBuilder.build(buildType)
    } catch (e) {
      console.log(chalk.black.bgRed(`buildAndroid() failed`))
      console.log(
        chalk.black.bgBlueBright(`args: ${JSON.stringify({buildType})}`),
      )
      console.error(e)
      throw e
    }
  }
}

module.exports = {
  NativeBuilds: new NativeBuilds(),
}
