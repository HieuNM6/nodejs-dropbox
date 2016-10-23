const path = require('path')
const fs = require('fs').promise
const zipFolder = require('zip-folder')
const nssocket = require('nssocket')
const argv = require('yargs')
             .default('dir', 'files')
             .argv;

const outbound = new nssocket.NsSocket(
  {
    reconnect: true,
  }
);

const cat = require('./cat')
const rm = require('./rm')
const mkdir = require('./mkdir')
const touch = require('./touch')
const ls = require('./ls')

function sendSocket(data) {
  outbound.connect(8001, '127.0.0.1', (err) => {
    if (err) {
      console.log('Not have client connected');
    } else {
      outbound.send(['action', 'serverPath', 'requestPath', 'requestParams', 'type', 'updated'], data)
    }
  })
}

function getLocalFilePathFromRequest(request) {
  if (request.params.file) {
    return path.join(__dirname, argv.dir, request.params.file)
  }
  return path.join(__dirname, argv.dir)
}

function getDiffFromLocal(filePath) {
  const array1 = filePath.split('/')
  const array2 = __dirname.split('/')
  array2.push(argv.dir)
  const diff = array1.filter(x => array2.indexOf(x) < 0)
  return diff
}

function isFile(arg) {
  return arg.indexOf('.') > 0
}

async function readHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Reading ${filePath}`)
  const stat = await fs.stat(filePath).catch((err) => undefined)
  if (stat) {
    if (stat.isDirectory()) {
      if (request.headers.accept === 'application/x-gtar') {
        const zipPath = 'temp.zip'
        zipFolder(filePath, zipPath, (err) => {
          if (err) {
            reply(err.message).code(500)
          } else {
            reply.file(zipPath)
          }
        })
      } else {
        reply({
          data: await ls(filePath)
        })
      }
    } else {
      const data = await cat(filePath).catch((err) => err.message)
      reply(data)
    }
  }
}

async function createHandler(request, reply) {
  /* eslint no-unused-expressions: 0 */
  const filePath = getLocalFilePathFromRequest(request)
  const folderPaths = getDiffFromLocal(filePath)
  const lastFolderPath = folderPaths.pop()
  console.log(`Creating ${filePath}`)
  if (isFile(lastFolderPath)) {
    await mkdir(path.join(argv.dir, folderPaths.join('/')))
    await touch(filePath).catch(err => err.code)
    await fs.writeFile(filePath, request.payload)
    reply('Successful created file')
    sendSocket(
      {
        action: 'write',
        serverPath: filePath,
        requestPath: folderPaths.join('/'),
        requestParams: request.params.file,
        type: 'file',
        updated: new Date()
      })
  } else {
    await mkdir(path.join(argv.dir, request.params.file)).catch((err) => {
      reply(err.message).code(500)
    });
    sendSocket(
      {
        action: 'write',
        requestParams: request.params.file,
        type: 'directory'
      }
    )
    reply('Successful create folder')
  }
}

async function updateHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Updating ${filePath}`)
  const stat = await fs.stat(filePath).catch((err) => undefined)
  if (stat) {
    if (stat.isDirectory()) {
      reply().code(405)
    } else if (stat.isFile()) {
      await fs.writeFile(filePath, request.payload)
      reply()
      sendSocket(
        {
          action: 'update',
          requestParams: request.params.file
        }
      )
    } else {
      reply().code(405)
    }
  } else {
    reply().code(405)
  }
}

async function deleteHandler(request, reply) {
  const filePath = getLocalFilePathFromRequest(request)

  console.log(`Deleting ${filePath}`)
  await rm(filePath).catch((err) => {
    reply(err.message).code(400)
  })
  reply('Successful to delete')
  sendSocket(
    {
      action: 'delete',
      requestParams: request.params.file
    }
  )
}

module.exports = {
  read: readHandler,
  create: createHandler,
  update: updateHandler,
  delete: deleteHandler
}
