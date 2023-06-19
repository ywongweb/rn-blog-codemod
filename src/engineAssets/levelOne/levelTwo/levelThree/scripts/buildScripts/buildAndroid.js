#!/usr/bin/env node
const {NativeBuilds} = require('../../tools/nativeBuilds/index')
const BuildType = require('../../tools/nativeBuilds/BuildType')
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
  NativeBuilds.buildAndroid(args.native_build_type)

  // Todo:: implement next line to build release for real devices
  // NativeBuilds.buildAndroid(BuildType.release);
}
