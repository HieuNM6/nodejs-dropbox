#!/usr/bin/env babel-node

require('./helper')
const fs = require('fs').promise

const fileName = process.argv[2];

async function cat() {
  let error = false;
  const stat = await fs.stat(fileName)
                          .catch((_) => {
                            console.log('File not found');
                            error = true;
                          });
  if (!error) {
    if (stat.isDirectory()) {
      console.log(`${fileName} is a directory`);
    } else {
      console.log((await fs.readFile(fileName)).toString());
    }
  }
}

function main() {
  if (fileName) {
    cat();
  } else {
    console.log('Missing file name');
  }
}

main();
