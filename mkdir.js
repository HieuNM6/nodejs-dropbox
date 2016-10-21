#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise

async function mkdir(path) {
  if (path) {
    await fs.mkdir(path)
      .catch((err) => {
        if (err.code === 'EEXIST') {
          console.log('Directory has existed');
        }
      });
  }
}

function removeDot(paths) {
  if (paths[0] === '.' || paths[0] === '') {
    return paths.splice(1)
  }
  return paths
}

async function recursiveMkdir(paths) {
  let lastPath = '';
  for (let i = 0; i < paths.length; i++) {
    if (i === 0) {
      await mkdir(paths[i])
      lastPath += paths[i]
    } else {
      await mkdir(lastPath + '/' + paths[i])
      lastPath += '/' + paths[i]
    }
  }
}

function main() {
  if (process.argv[2]) {
    recursiveMkdir(removeDot(process.argv[2].split('/')));
  } else {
    console.log('Missing directory name');
  }
}

main();
