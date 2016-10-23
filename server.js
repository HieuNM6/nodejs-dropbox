#!/usr/bin/env babel-node

require('./helper')
const Hapi = require('hapi')
const Inert = require('inert')
const chokidar = require('chokidar')
const nssocket = require('nssocket')
const argv = require('yargs')
             .default('dir', 'files')
             .argv;


const asyncHandlerPlugin = require('hapi-async-handler')

const curd = require('./curd')

function sendSocket(data) {
  const outbound = new nssocket.NsSocket(
    {
      reconnect: true,
    }
  );
  outbound.connect(8001, '127.0.0.1', (err) => {
    if (err) {
      console.log('Not have client connected');
    } else {
      outbound.send(['action', 'serverPath', 'requestPath', 'requestParams', 'type', 'updated'], data)
    }
  })
}

async function main() {
  const port = 8000
  const server = new Hapi.Server({
    debug: {
      request: ['error']
    }
  })
  server.register(asyncHandlerPlugin)
  server.register(Inert, () => {})
  server.connection({ port })

  server.route([
    // READ
    {
      method: 'GET',
      path: '/{file*}',
      handler: {
        async: curd.read
      }
    },
    // CREATE
    {
      method: 'PUT',
      path: '/{file*}',
      handler: {
        async: curd.create
      }
    },
    // UPDATE
    {
      method: 'POST',
      path: '/{file*}',
      handler: {
        async: curd.update
      }
    },
    // DELETE
    {
      method: 'DELETE',
      path: '/{file*}',
      handler: {
        async: curd.delete
      }
    }
  ])

  await server.start()
  console.log(`LISTENING @ http://127.0.0.1:${port}`)
}

function removeDir(arg) {
  arg = arg.split('/')
  arg.shift()
  return arg.join('/')
}

function removeLastAndFirst(arg) {
  arg = arg.split('/')
  arg.shift()
  arg.pop()
  return arg.join('/')
}

async function watchFile() {
  chokidar.watch('./' + argv.dir, { ignored: /[\/\\]\./ })
  .on('addDir', (path) => {
    sendSocket({
      action: 'write',
      type: 'directory',
      requestParams: removeDir(path)
    })
  })
  .on('add', (path) => {
    sendSocket(
      {
        action: 'write',
        requestPath: removeLastAndFirst(path),
        requestParams: removeDir(path),
        type: 'file',
      })
  })
  .on('change', (path) => {
    sendSocket(
      {
        action: 'update',
        requestParams: removeDir(path)
      })
  })
  .on('unlinkDir', (path) => {
    sendSocket(
      {
        action: 'delete',
        requestParams: removeDir(path)
      })
  })
  .on('unlink', (path) => {
    sendSocket(
      {
        action: 'delete',
        requestParams: removeDir(path)
      })
  })
}

watchFile()
main()
