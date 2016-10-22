#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise;

const path = require('path');

function blockPath(filePath) {
  const BLOCKS = ['node_modules'];
  for (const block of BLOCKS) {
    if (filePath.includes(block)) {
      return true;
    }
  }
  return false;
}

async function ls(dirname, paths) {
  const fileNames = await fs.readdir(dirname)

  if (fileNames) {
    for (const fileName of fileNames) {
      const filePath = path.join(dirname, fileName);
      const stat = await fs.stat(filePath);
      if (!stat.isDirectory() || blockPath(filePath)) {
        paths.push(filePath);
      } else {
        paths.push(filePath + '/');
        await ls(filePath, paths);
      }
    }
  }
  return paths;
}

async function main(arg) {
  return await ls(arg, [])
}

module.exports = main
