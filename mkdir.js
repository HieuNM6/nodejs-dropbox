#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise

async function mkdir(path) {
  if (path) {
    await fs.mkdir(path)
    return 'Directory has created successful'
  }
  return "Can't create directory"
}

function removeDot(paths) {
  if (paths[0] === '.' || paths[0] === '') {
    return paths.splice(1)
  }
  return paths
}

async function recursiveMkdir(paths) {
  let lastPath = '';
  let result
  for (let i = 0; i < paths.length; i++) {
    if (i === 0) {
      result = await mkdir(paths[i])
      lastPath += paths[i]
    } else {
      result = await mkdir(lastPath + '/' + paths[i])
      lastPath += '/' + paths[i]
    }
  }
  return result
}

function main(arg) {
  if (arg) {
    return recursiveMkdir(removeDot(arg.split('/')));
  }
  return 'Missing directory name';
}

module.exports = main

