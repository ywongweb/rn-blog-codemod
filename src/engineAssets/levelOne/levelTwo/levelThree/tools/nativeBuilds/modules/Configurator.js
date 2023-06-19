const execSync = require('child_process').execSync

class Configurator {
  configure() {
    // this is just a workaround - instead, we need to create the builds without js bundles
    execSync(
      `${__dirname}/../../engineCli/bin/generateConfiguration -r . -j ${__dirname}/../../../../../../src/moduleList.json`,
    )
  }
}

module.exports = {
  Configurator,
}
