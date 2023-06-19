#!/usr/bin/env node

import * as fs from 'fs-extra'
import * as path from 'path'
import {filePaths} from './utils/filePaths'
import {logger} from './utils/logger'
import * as cp from 'child_process'
import dotenv from 'dotenv'
import { replaceThenCopy } from './utils/replaceThenCopy'

const PROJECT_NAME = require(path.resolve(process.cwd(), 'package.json')).name
const REGEX_APP_VERSION = [/\{MOD_APP_VERSION}/g]
const REGEX_GH_USERNAME = [/\{MOD_GITHUB_USERNAME}/g]
const REGEX_APP_NAME = [/\{MOD_APP_NAME}/g]
let ghUsername = ''
let appName = ''
let appVersion = ''

const readEnv = () => {
  const env = dotenv.config({path: path.resolve(process.cwd(), '.ui.env')})
  if (env.error) {
    logger.errorn(`unable to read ${path.resolve(process.cwd(), '.ui.env')} file`)
    process.exit(1)
  }
  if (env.parsed) {
    if (!env.parsed.APP_NAME) {
      logger.errorn(`APP_NAME not found in ${path.resolve(process.cwd(), '.ui.env')} file`)
      process.exit(1)
    }
    if (!env.parsed.GITHUB_USERNAME) {
      logger.errorn(`GITHUB_USERNAME not found in ${path.resolve(process.cwd(), '.ui.env')} file`)
      process.exit(1)
    }
    if (!env.parsed.APP_VERSION) {
      logger.errorn(`APP_VERSION not found in ${path.resolve(process.cwd(), '.ui.env')} file`)
      process.exit(1)
    }
    appName = env.parsed.APP_NAME
    ghUsername = env.parsed.GITHUB_USERNAME
    appVersion = env.parsed.APP_VERSION
  }
}

const makeDir = () => {
  const dir = `src`
  if (!fs.pathExistsSync(dir)) {
    fs.mkdirpSync(dir)
  }
}

const packageJson = () => {
  const source = path.resolve(__dirname, `${filePaths.uiAssets}/package.json`)
  const dest = path.resolve(
    process.cwd(), `package.json`,
  )
  const toReplace = [...REGEX_APP_NAME, ...REGEX_GH_USERNAME, ...REGEX_APP_VERSION]
  const newEntry = [appName, ghUsername, appVersion]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const npmrc = () => {
  const source = path.resolve(__dirname, `${filePaths.engineAssets}/.npmrc`)
  const dest = path.resolve(process.cwd(), `.npmrc`)
  const toReplace = REGEX_GH_USERNAME
  const newEntry = [ghUsername]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const gitIgnore = () => {
  const source = path.resolve(__dirname, `${filePaths.uiAssets}/.gitignore`)
  const dest = path.resolve(process.cwd(), `.gitignore`)
  fs.copyFileSync(source, dest)
}

const appJsx = () => {
  const source = path.resolve(__dirname, `${filePaths.uiAssets}/src/App.tsx`)
  const dest = path.resolve(process.cwd(), `src/App.tsx`)
  fs.copyFileSync(source, dest)
}

const engineConfig = () => {
  const source = path.resolve(__dirname, `${filePaths.uiAssets}/engineConfig.json`)
  const dest = path.resolve(process.cwd(), `engineConfig.json`)
  const toReplace = [...REGEX_APP_NAME]
  const newEntry = [PROJECT_NAME]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

const utils = () => {
  const source = path.resolve(__dirname, `${filePaths.uiAssets}/utils`)
  const dest = path.resolve(process.cwd(), `utils`)
  fs.copySync(source, dest)
}

//
// const loggerUtil = () => {
//   const source = path.resolve(__dirname, `utils`)
//   const dest = path.resolve(process.cwd(), 'utils')
//   fs.copySync(source, dest)
// }

const updateDeps = () => {
  logger.infon('updating dependencies, this may take a few minutes...')
  cp.execSync('yarn')
}

readEnv()
makeDir()
packageJson()
npmrc()
appJsx()
gitIgnore()
engineConfig()
utils()
// loggerUtil()
updateDeps()
