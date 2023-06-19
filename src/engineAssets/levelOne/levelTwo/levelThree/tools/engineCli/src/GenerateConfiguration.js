#!/usr/bin/env node

const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ArgumentParser = require('argparse').ArgumentParser
const childProcess = require('child_process')
const {RNCLIConfigValidator} = require('./runners/RNCLIConfigValidator')

class GenerateConfiguration {
  parseArguments() {
    const parser = new ArgumentParser()

    parser.addArgument(['-r', '--root-path'], {
      help: 'path to the root (usually the dirname of package.json)',
      required: true,
    })
    parser.addArgument(['-j', '--package-json-path'], {
      help: 'path to the package.json',
      required: true,
    })
    parser.addArgument(['-w', '--watch'], {
      help: 'start watching for package.json changes using watchman, this will cause regeneration of modules.js and config.json files',
      action: 'storeTrue',
    })
    parser.addArgument(['--force-localhost'], {
      help:
        "Don't identify the ip, always use 127.0.0.1; this is a preferred method if you are not using " +
        'iOS physical device - otherwise switching networks require restarting the engine CLI',
      action: 'storeTrue',
    })

    parser.addArgument('ignored', {isPositional: true, nargs: '*'})

    return parser.parseArgs()
  }

  run(args) {
    const packageJsonPath = path.resolve(args.package_json_path)
    const rootPath = path.resolve(args.root_path)

    if (args.watch) {
      console.info('[generateConfiguration] Running watchman..')
      const fileName = packageJsonPath.substring(rootPath.length + 1)
      const executable = `${__dirname}/../bin/generateConfiguration`
      childProcess.execSync(
        `watchman -- trigger-del ${rootPath} {MOD_APP_NAME}`,
      )
      childProcess.execSync(
        `watchman -- trigger ${rootPath} {MOD_APP_NAME} ${fileName} -- ${executable} -r ${rootPath} -j ${packageJsonPath} --package-json-dependencies-only`,
      )
      return
    }

    const isPlaygroundEnv = args.root_path.indexOf('node_modules') !== -1

    const autogeneratedDir = isPlaygroundEnv
      ? rootPath + '/../engineAutogenerated'
      : rootPath + '/engineAutogenerated'
    const config = require(packageJsonPath).engineConfig

    if (!fs.existsSync(autogeneratedDir)) {
      fs.mkdirSync(autogeneratedDir)
    }

    this._generateModulesJs(config, autogeneratedDir)

    this._generateConfigJson(config, autogeneratedDir)
    this._generateIndexJs(autogeneratedDir)

    new RNCLIConfigValidator().run()
  }

  _generateModulesJs(config, autogeneratedDir) {
    const modulePaths = {}
    _.forEach(config.modules, module => (modulePaths[module] = module))
    const moduleFuncs = Object.keys(modulePaths)
      .map(m => `'${m}': () => require('${modulePaths[m]}').default`)
      .join(',\n  ')
    fs.writeFileSync(
      `${autogeneratedDir}/modules.js`,
      `
    // This file is auto-generated by @{MOD_GITHUB_USERNAME}/{MOD_APP_NAME}
    
    export default {
      ${moduleFuncs}
    };
    `,
    )
  }

  _generateConfigJson(config, autogeneratedDir) {
    fs.writeFileSync(
      `${autogeneratedDir}/config.json`,
      JSON.stringify(config, null, 2),
    )
  }

  _generateIndexJs(autogeneratedDir) {
    const engineParent =
      __dirname.indexOf('/node_modules/') === -1
        ? 'levelOne/levelTwo/levelThree'
        : 'node_modules/@{MOD_GITHUB_USERNAME}/{MOD_APP_NAME}'
    fs.writeFileSync(
      `${autogeneratedDir}/index.js`,
      `require('../${engineParent}/index')`,
    )
  }
}

module.exports = {GenerateConfiguration}