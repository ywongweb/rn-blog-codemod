import chalk from 'chalk'

const log = (text: string) => process.stdout.write(text)
const logn = (text: string) => process.stdout.write(text + '\n')
const warn = (text: string) => process.stdout.write(chalk.yellow(text))
const warnn = (text: string) => warn(text + '\n')
const error = (text: string) =>
  process.stdout.write(chalk.red(text))
const errorn = (text: string) => error(text + '\n')
const info = (text: string) =>
  process.stdout.write(chalk.green(text))
const infon = (text: string) => info(text + '\n')
const debug = (text: string) =>
  process.stdout.write(chalk.blue(text))
const debugn = (text: string) => debug(text + '\n')

export const logger = {
  log,
  logn,
  warn,
  warnn,
  info,
  infon,
  debug,
  debugn,
  errorn,
}
