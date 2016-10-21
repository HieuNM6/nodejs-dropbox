#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise


async function touch(arg) {
  const fd = await fs.open(arg, 'a')
  const stat = await fs.stat(arg)
  await fs.futimes(fd, stat.atime, new Date())
  fs.close(fd);
  return 'Successfull update'
}

async function main(arg) {
  if (arg) {
    return touch(arg)
  }
  return 'Missing file name'
}

module.exports = main

