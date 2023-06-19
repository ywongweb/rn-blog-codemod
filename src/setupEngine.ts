#!/usr/bin/env node

import * as fs from 'fs-extra'
import * as path from 'path'
import {filePaths} from './utils/filePaths'
import * as cp from 'child_process'
import escapeStringRegexp from 'escape-string-regexp'
import {logger} from './utils/logger'
import dotenv from 'dotenv'
import { replaceThenCopy } from './utils/replaceThenCopy'

// todo: use env files
const REGEX_PROJECT_NAME = [/\{MOD_APP_NAME}/g]
const REGEX_GH_USERNAME = [/\{MOD_GITHUB_USERNAME}/g]

let appName = ''
let ghUsername = ''

const readEnv = () => {
  const env = dotenv.config({path: path.resolve(process.cwd(), '.engine.env')})
  if (env.error) {
    logger.errorn(`unable to read ${path.resolve(process.cwd(), '.engine.env')} file`)
    process.exit(1)
  }
  if (env.parsed) {
    if (!env.parsed.APP_NAME) {
      logger.errorn(`APP_NAME not found in ${path.resolve(process.cwd(), '.engine.env')} file`)
      process.exit(1)
    }
    if (!env.parsed.GITHUB_USERNAME) {
      logger.errorn(`GITHUB_USERNAME not found in ${path.resolve(process.cwd(), '.engine.env')} file`)
      process.exit(1)
    }
    appName = env.parsed.APP_NAME
    ghUsername = env.parsed.GITHUB_USERNAME
  }
}

const makeDir = () => {
  logger.infon('Create 3 level directories')
  const dir = `${filePaths.destLevels}/tools/engine-cli/etc`
  if (!fs.pathExistsSync(dir)) {
    fs.mkdirpSync(dir)
  }
}

const packageJson = () => {
  logger.infon('Updating package.json')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/package.json`)
  const dest = path.resolve(
    process.cwd(),
    `${filePaths.destLevels}/package.json`,
  )
  const toReplace = REGEX_PROJECT_NAME
  const newEntry = [`@${ghUsername}/${appName}`]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const appJson = () => {
  logger.infon('Updating app.json')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/app.json`)
  const dest = path.resolve(process.cwd(), `${filePaths.destLevels}/app.json`)
  const toReplace = REGEX_PROJECT_NAME
  const newEntry = [appName]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const npmrc = () => {
  logger.infon('Updating .npmrc')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/.npmrc`)
  const dest = path.resolve(process.cwd(), `${filePaths.destLevels}/.npmrc`)
  const toReplace = REGEX_GH_USERNAME
  const newEntry = [ghUsername]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const copyNpmFiles = () => {
  logger.infon('Copying .npmignore')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/.npmignore`)
  const dest = path.resolve(process.cwd(), `${filePaths.destLevels}/.npmignore`)
  fs.copyFileSync(source, dest)
}

const moveFiles = () => {
  logger.infon('Moving files 3 levels down')
  fs.moveSync('android', filePaths.destAndroid)
  fs.moveSync('ios', filePaths.destIos)
  fs.unlink('App.tsx')
  fs.unlink('package.json')
  fs.unlink('app.json')
}

// next, we should expect the user to have a private repo setup. use prompt to get the repo name

const appTsx = () => {
  logger.infon('create level 3 App.tsx')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/App.tsx`)
  const dest = path.resolve(process.cwd(), `${filePaths.destLevels}/App.tsx`)
  fs.copyFileSync(source, dest)
}

const indexJs = () => {
  logger.infon('create nested index.js')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/index.js`)
  const dest = path.resolve(filePaths.destLevels, 'index.js')
  fs.copyFileSync(source, dest)
}

const rootIndexJs = () => {
  logger.infon('update root index.js')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/rootIndex.js`)
  const dest = 'index.js'
  fs.copyFileSync(source, dest)
}

const gitIgnore = () => {
  logger.infon('updating gitignore')
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/.gitignore`)
  const dest = path.resolve(process.cwd(), `.gitignore`)
  fs.copyFileSync(source, dest)
}

const prettier = () => {
  logger.infon('updating prettier')
  const source = '.prettierrc.js'
  const dest = '.prettierrc.js'
  const toReplace = [/trailingComma: 'all',/]
  const newEntry = ["trailingComma: 'all',\n\tsemi: false,"]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const podfile = () => {
  logger.infon('updating podfile')
  const source = `${filePaths.destLevels}/ios/Podfile`
  const dest = source
  const toReplace = [
    new RegExp(
      escapeStringRegexp(
        '../node_modules/react-native/scripts/react_native_pods',
      ),
    ),
    new RegExp(
      escapeStringRegexp(
        '../node_modules/@react-native-community/cli-platform-ios/native_modules',
      ),
    ),
  ]
  const newEntry = [
    '../../../../node_modules/react-native/scripts/react_native_pods',
    '../../../../node_modules/@react-native-community/cli-platform-ios/native_modules',
  ]

  replaceThenCopy({source, dest, toReplace, newEntry})
}

const symlinkPackageJson = () => {
  logger.infon('symlinking package.json')
  fs.symlinkSync(`${filePaths.destLevels}/package.json`, 'package.json')
}

const iosProjectFile = () => {
  logger.infon('updating ios project file')
  const source = `${filePaths.destIos}/${appName}.xcodeproj/project.pbxproj`
  const dest = source
  const toReplace = [
    new RegExp(
      escapeStringRegexp(
        'set -e\\n\\nWITH_ENVIRONMENT=\\"../node_modules/react-native/scripts/xcode/with-environment.sh\\"\\nREACT_NATIVE_XCODE=\\"../node_modules/react-native/scripts/react-native-xcode.sh\\"\\n\\n/bin/sh -c \\"$WITH_ENVIRONMENT $REACT_NATIVE_XCODE\\"\\n',
      ),
    ),
  ]
  const newEntry = [
    `set -e\\n\\nWITH_ENVIRONMENT=\\"../../../../node_modules/react-native/scripts/xcode/with-environment.sh\\"\\nREACT_NATIVE_XCODE=\\"../../../../node_modules/react-native/scripts/react-native-xcode.sh\\"\\n\\n/bin/sh -c \\"$WITH_ENVIRONMENT $REACT_NATIVE_XCODE\\"\\n`,
  ]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const iosAppDelegate = () => {
  logger.infon('updating ios AppDelegate')
  const source = `${filePaths.destIos}/${appName}/AppDelegate.mm`
  const dest = source
  const toReplace = [
    new RegExp(escapeStringRegexp('jsBundleURLForBundleRoot:@"index"'), 'g'),
  ]
  const newEntry = ['jsBundleURLForBundleRoot:@"engineAutogenerated/index"']
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const bin = () => {
  logger.infon('copying bin folder')
  const source = path.resolve(__dirname, `${filePaths.engineAssetsLevels}/bin`)
  const dest = path.resolve(filePaths.destLevels, 'bin')
  fs.copySync(source, dest)
}

const scripts = () => {
  logger.infon('copying scripts folder')
  const source = path.resolve(__dirname, `${filePaths.engineAssetsLevels}/scripts`)
  const dest = path.resolve(filePaths.destLevels, 'scripts')
  fs.copySync(source, dest)
}

const tools = () => {
  logger.infon('copying tools folder')
  const source = path.resolve(__dirname, `${filePaths.engineAssetsLevels}/tools`)
  const dest = path.resolve(filePaths.destLevels, 'tools')
  fs.copySync(source, dest)
}

const replaceProjectNameInTools = () => {
  logger.infon('replacing project name in tools')
  const filePathsArr = [
    path.resolve(
      filePaths.destLevels,
      'tools/nativeBuilds/modules/AndroidBuilder.js',
    ),
    path.resolve(
      filePaths.destLevels,
      'tools/engineCli/src/runners/AndroidRunner.js',
    ),
    path.resolve(
      filePaths.destLevels,
      'tools/engineCli/src/runners/AsyncPackagerRunner.js',
    ),
    path.resolve(
      filePaths.destLevels,
      'tools/engineCli/src/GenerateConfiguration.js',
    ),
    path.resolve(
      filePaths.destLevels,
      'tools/engineCli/src/runners/IosRunner.js',
    ),
    path.resolve(
      filePaths.destLevels,
      'tools/engineCli/src/runners/RNCLIConfigValidator.js',
    ),
    path.resolve(
      filePaths.destLevels,
      'tools/nativeBuilds/modules/IOSBuilder.js',
    ),
  ]
  filePathsArr.map(filePath => {
    const source = filePath
    const dest = source
    const toReplace = REGEX_PROJECT_NAME
    const newEntry = [appName]
    replaceThenCopy({source, dest, toReplace, newEntry})
  })
}

const replaceGhUserNameInTools = () => {
  logger.infon('replacing github username in tools')
  const ghFilePaths = [
    path.resolve(
      filePaths.destLevels,
      'tools/engineCli/src/GenerateConfiguration.js',
    ),
    path.resolve(
      filePaths.destLevels,
      'tools/engineCli/src/runners/RNCLIConfigValidator.js',
    ),
  ]
  ghFilePaths.map(filePath => {
    const source = filePath
    const dest = source
    const toReplace = REGEX_GH_USERNAME
    const newEntry = [ghUsername]
    replaceThenCopy({source, dest, toReplace, newEntry})
  })
}

const updateDeps = () => {
  logger.infon('updating dependencies, might take a few minutes...')
  cp.execSync('yarn')
  logger.infon('dependencies update complete')
  logger.infon('updating pods, might take a few minutes...')
  cp.execSync('pod install', {cwd: filePaths.destIos})
  logger.infon('pod update complete')
}

const createRootSrc = () => {
  logger.infon('creating root src folder')
  // App.tsx
  const sourceAppTsx = path.resolve(
    __dirname,
    `${filePaths.engineAssets}/src/App.tsx`,
  )
  const destAppTsx = path.resolve('', 'src/App.tsx')
  fs.copySync(sourceAppTsx, destAppTsx)

  // moduleList.json
  const sourceModuleList = path.resolve(
    __dirname,
    `${filePaths.engineAssets}/src/moduleList.json`,
  )
  const destModuleList = path.resolve(process.cwd(), `src/moduleList.json`)

  const toReplace = [/\{MOD_APP_NAME}/]
  const newEntry = [`@${ghUsername}/${appName}`]
  replaceThenCopy({
    source: sourceModuleList,
    dest: destModuleList,
    toReplace,
    newEntry,
  })
}

readEnv()
makeDir()
packageJson()
appJson()
npmrc()
copyNpmFiles()
moveFiles()
appTsx()
indexJs()
rootIndexJs()
gitIgnore()
prettier()
podfile()
symlinkPackageJson()
iosProjectFile()
iosAppDelegate()
updateDeps()
scripts()
bin()
tools()
createRootSrc()
replaceProjectNameInTools()
replaceGhUserNameInTools()

