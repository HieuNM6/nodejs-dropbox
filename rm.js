#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise
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
  let error = false;
  const fileNames = await fs.readdir(dirname)
                              .catch((err) => {
                                console.log('Dir not found');
                                error = true;
                              });
  if (!error) {
    for (const fileName of fileNames) {
      const filePath = path.join(dirname, fileName);
      const stat = await fs.stat(filePath);
      if (!stat.isDirectory() || blockPath(filePath)) {
        paths.push(filePath);
      } else {
        paths.push(filePath);
        await ls(filePath, paths);
      }
    }
  }
  return paths;
}

async function rm(name) {
  let stat = await fs.stat(name)
    .catch((err) => console.log('File or Directory not found'));
  if (stat) {
    if (stat.isDirectory()) {
      const files = await ls(name, [])
      for (const file of files) {
        stat = await fs.stat(file).catch((err) => undefined)
        if (stat) {
          if (stat.isDirectory()) {
            await rm(file);
          } else if (stat.isFile()) {
            await fs.unlink(file);
          }
        }
      }
      await fs.rmdir(name);
    } else {
      await fs.unlink(name);
    }
  }
}
function main() {
  if (process.argv[2]) {
    rm(process.argv[2])
  } else {
    console.log('Missing file or folder argument')
  }
}

main()

