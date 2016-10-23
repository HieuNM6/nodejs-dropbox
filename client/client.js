const nssocket = require('nssocket')
const mkdir = require('mkdirp')
const path = require('path')
const request = require('request')
const fs = require('fs')

const rm = require('../rm')

async function dataHandler(data) {
  if (data.action === 'write') {
    if (data.type === 'file') {
      mkdir(path.join(process.cwd(), 'client', data.requestPath))
      request.get('http://localhost:8000/' + data.requestParams, (err, res, body) => {
        if (err) {
          console.log(err.message);
        } else {
          console.log(body);
          fs.writeFile('./client/' + data.requestParams, body)
        }
      })
    } else if (data.type === 'directory') {
      mkdir(path.join(process.cwd(), 'client', data.requestParams))
    }
  } else if (data.action === 'update') {
    request.get('http://localhost:8000/' + data.requestParams, (err, res, body) => {
      if (err) {
        console.log(err.message);
      } else {
        console.log(body);
        fs.writeFile('./client/' + data.requestParams, body)
      }
    })
  } else if (data.action === 'delete') {
    await rm('./client/' + data.requestParams).catch((err) => console.log(err.message))
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

main()
