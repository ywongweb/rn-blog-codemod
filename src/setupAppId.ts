#!/usr/bin/env node

import * as fs from 'fs-extra'
import * as path from 'path'
import {filePaths} from './utils/filePaths'
import {logger} from './utils/logger'
import * as cp from 'child_process'
import dotenv from 'dotenv'
import { replaceThenCopy } from './utils/replaceThenCopy'

let appIdDev = ''

const readEnv = () => {
  const env = dotenv.config({path: path.resolve(process.cwd(), '.engine.env')})
  if (env.error) {
    logger.errorn(`unable to read ${path.resolve(process.cwd(), '.engine.env')} file`)
    process.exit(1)
  }
  if (env.parsed) {
    if (!env.parsed.APP_ID_DEV) {
      logger.errorn(`APP_ID_DEV not found in ${path.resolve(process.cwd(), '.engine.env')} file`)
      process.exit(1)
    }
    appIdDev = env.parsed.APP_ID_DEV
  }
}

const iosIdDev = () => {
  logger.infon('Updating iOS app id')
  const source = `${filePaths.destLevels}/tools/engineCli/src/runners/IosRunner.js`
  const dest = source
  const toReplace = [/\{MOD_APP_ID_DEV}/g]
  const newEntry = [appIdDev]
  replaceThenCopy({source, dest, toReplace, newEntry})
}

readEnv()
iosIdDev()
