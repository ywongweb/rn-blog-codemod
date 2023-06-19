import { logger } from './logger'
import * as fs from 'fs-extra'

// Read source file, replace contents then copy to destination
export const replaceThenCopy = ({
  source,
  dest,
  toReplace,
  newEntry
  }: {
  source: string
  dest: string
  toReplace: Array<RegExp>
  newEntry: Array<string>
}) => {
  logger.infon(`Updating file. Source: ${source}`)
  logger.infon(`Updating file. Dest: ${dest}`)
  let content = fs.readFileSync(source, 'utf8')
  toReplace.forEach((it, index) => {
    if (it.test(content)) {
      content = content.replace(it, newEntry[index])
    }
  })

  fs.writeFileSync(dest, content)
  logger.infon('Update file success')
}
