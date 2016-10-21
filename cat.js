#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise

async function cat(arg) {
  const stat = await fs.stat(arg)

  if (stat) {
    if (stat.isDirectory()) {
      return `${arg} is a directory`
    }
    return ((await fs.readFile(arg)).toString())
  }
  return 'error occurred'
}

function main(arg) {
  if (arg) {
    return cat(arg)
  }
  return 'Missing file name'
}

module.exports = main
