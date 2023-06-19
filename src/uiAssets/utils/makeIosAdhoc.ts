import path from 'path'
import * as fs from 'fs-extra'
import * as cp from 'child_process'
import dotenv from 'dotenv'
import { logger } from './logger'

let ghUsername = ''
let appName = ''
let signingIdentity = ''
let provisioningProfile = ''

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
    if (!env.parsed.SIGNING_IDENTITY) {
      logger.errorn(`SIGNING_IDENTITY not found in ${path.resolve(process.cwd(), '.ui.env')} file`)
      process.exit(1)
    }
    if (!env.parsed.PROVISIONING_PROFILE) {
      logger.errorn(`PROVISIONING_PROFILE not found in ${path.resolve(process.cwd(), '.ui.env')} file`)
      process.exit(1)
    }
    appName = env.parsed.APP_NAME
    ghUsername = env.parsed.GITHUB_USERNAME
    signingIdentity = env.parsed.SIGNING_IDENTITY
    provisioningProfile = env.parsed.PROVISIONING_PROFILE
  }
}

const copyIpa = () => {
  const source = path.resolve(process.cwd(), `node_modules/@${ghUsername}/${appName}/appBuilds/iphoneos/devDebugAdhoc/${appName}.ipa`)
  const dest = path.resolve(process.cwd(), `bundle_output/${appName}.ipa`)
  fs.copyFileSync(source, dest)
}

const unzipIpa = () => {
  cp.execSync(`unzip -o bundle_output/${appName}.ipa -d bundle_output/${appName}`)
}

const updateJsBundle = () => {
  const source = path.resolve(process.cwd(), `bundle_output/main.jsbundle`)
  const dest = path.resolve(process.cwd(), `bundle_output/${appName}/Payload/${appName}.app/main.jsbundle`)
  fs.copyFileSync(source, dest)
}

const repackageIpa = () => {
  cp.execSync(`cd bundle_output/${appName} && zip -qr ../${appName}-resign.ipa Payload`)
  cp.execSync(`cd bundle_output && fastlane sigh resign ${appName}-resign.ipa --signing_identity="${signingIdentity}" --provisioning_profile="../${provisioningProfile}"`)
}

readEnv()
copyIpa()
unzipIpa()
updateJsBundle()
repackageIpa()
