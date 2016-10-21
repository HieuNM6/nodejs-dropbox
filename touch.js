#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise


async function touch() {
  const fd = await fs.open(process.argv[2], 'a')
    .catch((err) => {
      console.log(err);
    });
  const stat = await fs.stat(process.argv[2])
  await fs.futimes(fd, stat.atime, new Date())
    .catch((err) => {
      console.log(err);
    });
  fs.close(fd);
}


process.argv[2] ? touch() : console.log('Missing file name');
