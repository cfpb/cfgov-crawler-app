const fs = require('fs');
const path = require('path');

function mkdirRecursive(targetDir, {isRelativeToScript = false} = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
      // console.log(`Directory ${curDir} created!`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }

      // console.log(`Directory ${curDir} already exists!`);
    }

    return curDir;
  }, initDir);
}

// USAGE
//
// Default, make directories relative to current working directory.
// mkDirByPathSync('path/to/dir');
// 
// Make directories relative to the current script.
// mkDirByPathSync('path/to/dir', {isRelativeToScript: true});
// 
// Make directories with an absolute path.
// mkDirByPathSync('/path/to/dir');

module.exports = mkdirRecursive;
