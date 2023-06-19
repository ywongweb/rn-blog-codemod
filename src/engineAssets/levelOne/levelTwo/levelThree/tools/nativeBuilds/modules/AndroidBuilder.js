const os = require('os')
const execSync = require('child_process').execSync
const AndroidBuildVariant = require('../AndroidBuildVariants')
const chalk = require('chalk')

class AndroidBuilder {
  constructor() {
    this._repoDir = `${__dirname}/../../../../../..`
    this._engineAndroidDir = `${this._repoDir}/levelOne/levelTwo/levelThree/android`
  }

  build(buildType) {
    const {variant, outputDir, apkSuffix} = AndroidBuildVariant[buildType]
    const _i = os.platform() === 'darwin' ? `-i ''` : `-i`
    execSync(
      `sed ${_i} -e 's@"node_modules/react-native/local-cli/cli.js"@"../../node_modules/react-native/local-cli/cli.js"@' ${__dirname}/../../../../../../node_modules/react-native/react.gradle`,
    )

    const buildCommand = `levelOne/levelTwo/levelThree/android/gradlew \
      -Duser.dir=${__dirname}/../../../../../../levelOne/levelTwo/levelThree/android \
      app:assemble${variant} \
      -DVERSION_CODE=1 \
      -DVERSION_NAME=9.9.9 \
    `

    console.log(chalk.gray(`Building APK using: ${chalk.white(buildCommand)}`))

    execSync(buildCommand, {stdio: 'inherit'})
    const destinationDir = `${this._repoDir}/levelOne/levelTwo/levelThree/appBuilds/android/${buildType}`
    execSync(`rm -rf ${destinationDir} && mkdir -p ${destinationDir}`)
    const app = `${this._engineAndroidDir}/app/build/outputs/apk/${outputDir}/app-${apkSuffix}.apk`
    const destinationApp = `${destinationDir}/{MOD_APP_NAME}.apk`
    execSync(`cp -a ${app} ${destinationApp}`)
  }
}

module.exports = {
  AndroidBuilder,
}
