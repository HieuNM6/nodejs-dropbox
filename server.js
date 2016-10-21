#!/usr/bin/env babel-node

require('./helper')

const path = require('path')
const fs = require('fs').promise
const Hapi = require('hapi')
const asyncHandlerPlugin = require('hapi-async-handler')

const cat = require('./cat')
const rm = require('./rm')
const mkdir = require('./mkdir')
const touch = require('./touch')

function getLocalFilePathFromRequest(request) {
  return path.join(__dirname, 'files', request.params.file)
}

function getDiffFromLocal(filePath) {
  const array1 = filePath.split('/')
  const array2 = __dirname.split('/')
  array2.push('files')
  const diff = array1.filter(x => array2.indexOf(x) < 0)
  return diff
}

function isFile(arg) {
  return arg.indexOf('.') > 0
}

async function readHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Reading ${filePath}`)
  const data = await cat(filePath).catch((err) => err.message)
  reply(data)
}

async function createHandler(request, reply) {
  /* eslint no-unused-expressions: 0 */
  const filePath = getLocalFilePathFromRequest(request)
  const diff = getDiffFromLocal(filePath)
  const lastOfDiff = diff[diff.length - 1]
  console.log(getDiffFromLocal(filePath));
  console.log(`Creating ${filePath}`)
  if (isFile(lastOfDiff)) {
    reply(touch(filePath).catch(err => err.code))
  } else {
    reply(mkdir(path.join('files', request.params.file)).catch(err => err.code))
  }
}

async function updateHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Updating ${filePath}`)
  await fs.writeFile(filePath, request.payload)
  reply()
}

async function deleteHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Deleting ${filePath}`)
  await rm(filePath)
  reply()
}

async function main() {
  const port = 8000
  const server = new Hapi.Server({
    debug: {
      request: ['error']
    }
  })
  server.register(asyncHandlerPlugin)
  server.connection({ port })

  server.route([
    // READ
    {
      method: 'GET',
      path: '/{file*}',
      handler: {
        async: readHandler
      }
    },
    // CREATE
    {
      method: 'PUT',
      path: '/{file*}',
      handler: {
        async: createHandler
      }
    },
    // UPDATE
    {
      method: 'POST',
      path: '/{file*}',
      handler: {
        async: updateHandler
      }
    },
    // DELETE
    {
      method: 'DELETE',
      path: '/{file*}',
      handler: {
        async: deleteHandler
      }
    }
  ])

  await server.start()
  console.log(`LISTENING @ http://127.0.0.1:${port}`)
}

main()
