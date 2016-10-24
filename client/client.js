const nssocket = require('nssocket')
const mkdir = require('mkdirp')
const path = require('path')
const request = require('request')
const fs = require('fs')
const unzip = require('unzip')
const chokidar = require('chokidar')

const rm = require('../rm')

async function dataHandler(data) {
  if (data.action === 'write') {
    if (data.type === 'file') {
      mkdir(path.join(process.cwd(), data.requestPath))
      request.get('http://localhost:8000/' + data.requestParams, (err, res, body) => {
        if (err) {
          console.log(err.message);
        } else {
          console.log(`Add file ${data.requestParams}`);
          fs.writeFile('./' + data.requestParams, body)
        }
      })
    } else if (data.type === 'directory') {
      console.log(`Add folder ${data.requestParams}`);
      mkdir(path.join(process.cwd(), data.requestParams))
    }
  } else if (data.action === 'update') {
    request.get('http://localhost:8000/' + data.requestParams, (err, res, body) => {
      if (err) {
        console.log(err.message);
      } else {
        console.log(`Update file ${data.requestParams}`);
        fs.writeFile('./' + data.requestParams, body)
      }
    })
  } else if (data.action === 'delete') {
    console.log(`Delete file ${data.requestParams}`);
    await rm('./' + data.requestParams).catch((err) => console.log(err.message))
  } else {
    console.log('Missing action');
  }
}

async function main() {
  const server = nssocket.createServer((socket) => {
    socket.data(['action', 'serverPath', 'requestPath', 'requestParams', 'type', 'updated'], (data) => {
      dataHandler(data)
    })
  })
  console.log('client listen at port 8001');
  server.listen(8001)
}

async function getInitialFile() {
  request({
    headers: {
      Accept: 'application/x-gtar'
    },
    uri: 'http://localhost:8000',
    method: 'GET'
  /*eslint-disable */
  }).pipe(unzip.Extract({ path: './' }));
  /*eslint-enable */
}

async function watchFile() {
  chokidar.watch('.', { ignored: /[\/\\]\./, ignoreInitial: true })
  .on('addDir', (detail) => {
    request.put('http://localhost:8000/' + detail, {})
  })
  .on('add', (detail) => {
    fs.readFile(detail, (err, data) => {
      if (err) {
        console.log(err.message)
      } else {
        request({
          headers: {
            'Content-Type': 'text/plain'
          },
          uri: 'http://localhost:8000/' + detail,
          method: 'PUT',
          body: data
        })
      }
    })
  })
  .on('unlinkDir', (detail) => {
    request.delete('http://localhost:8000/' + detail)
  })
  .on('unlink', (detail) => {
    request.delete('http://localhost:8000/' + detail)
  })
}

watchFile()
getInitialFile()
main()
