#!/usr/bin/env babel-node

require('./helper')
const mkdir = require('mkdirp')

function main(paths) {
  return new Promise((resolve, reject) => {
    mkdir(paths, resolve, reject)
  });
}

module.exports = main

