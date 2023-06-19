#!/usr/bin/env node
const {NativeBuilds} = require('../../tools/nativeBuilds/index')
const BuildType = require('../../tools/nativeBuilds/BuildType')
const {
  simulator,
  iphoneRun,
  iphoneArchive,
} = require('../../tools/nativeBuilds/BuildPlatforms.json')
const exec = require('../utils/exec')
const {ArgumentParser} = require('argparse')

function parseArgs() {
  const parser = new ArgumentParser()

  parser.addArgument(['-n', '--native-build-type'], {
    choices: Object.values(BuildType),
    help: 'native build type to build',
    required: true,
  })

  return parser.parseArgs()
}

run(parseArgs()).catch(error => {
  console.log(error)
  process.exit(1)
})

async function run(args) {
  installPods()

  if (
    [BuildType.devDebugSim, BuildType.prodDebugSim].includes(
      args.native_build_type,
    )
  ) {
    NativeBuilds.buildIOS(simulator, args.native_build_type)
  }

  if (
    [BuildType.devDebugDevice, BuildType.prodDebugDevice].includes(
      args.native_build_type,
    )
  ) {
    NativeBuilds.buildIOS(iphoneRun, args.native_build_type)
  }

  if (
    [BuildType.devDebugAdhoc, BuildType.prodAppstore].includes(
      args.native_build_type,
    )
  ) {
    NativeBuilds.buildIOS(iphoneArchive, args.native_build_type)
  }

  // Todo:: implement next line to build also for real devices in addition to simulator build
  //NativeBuilds.buildIOS(iphone, BuildType.dev);

  // Todo:: implement next line to build release for real devices
  //NativeBuilds.buildIOS(iphone, BuildType.release);
}

function installPods() {
  console.log('\n*** Installing Pods ***')
  exec.execSync(`cd ${__dirname}/../../ios && pod install`)
}
