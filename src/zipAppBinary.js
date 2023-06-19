const path = require('path')
const fs = require('fs')
const cp = require('child_process')
let files = []

const getAllFilePathsInDirectory = directory => {
  fs.readdirSync(directory).forEach(File => {
    const absolute = path.join(directory, File)
    if (fs.statSync(absolute).isDirectory()) {
      const isIosDotApp =
        absolute.slice(absolute.lastIndexOf('.') + 1) === 'app'
      if (isIosDotApp) {
        return files.push(absolute)
      } else {
        getAllFilePathsInDirectory(absolute)
      }
    } else {
      if (['.apk', '.ipa'].includes(path.extname(absolute))) {
        return files.push(absolute)
      }
    }
  })
}

getAllFilePathsInDirectory('./appBuilds')

files.forEach(file => {
  const cwd = file.substring(0, file.lastIndexOf('/'))
  const fileName = file.slice(file.lastIndexOf('/') + 1)
  cp.execSync(`zip -r ${fileName}.zip ${fileName}`, {
    cwd: path.resolve(__dirname, cwd),
  })
})
