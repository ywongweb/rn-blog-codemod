const chalk = require('chalk')

function debug(...consoleLogArgs) {
  console.log(chalk.blue('DEBUG'), ...consoleLogArgs)
}

module.exports = {debug}
