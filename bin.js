#!/usr/bin/env node
const fs = require('fs')
const {parse, join, resolve, dirname} = require('path')
const pull = require('pull-stream')
const ssbClient = require('ssb-zero-conf-client')
const ssbKeys = require('ssb-keys')
const debug = require('debug')('tre-export:bin')
const mkdirp = require('mkdirp')
const {stdout} = require('pull-stdio')
const doExport = require('.')

const conf = require('rc')('tre')
const path = conf.config
const argv = require('minimist')(process.argv.slice(2))
debug('parsed command line arguments: %O', argv)
debug('read .trerc from %s: %O', path, conf)

if (argv._.length<1 || argv.help) {
  const bin = argv['run-by-tre-cli'] ? 'tre export' : 'tre-export'
  if (argv.help) {
    console.error('USAGE\m  ' + require('./usage')(bin))
    console.error(require('./help'))
    process.exit(0)
  } else {
    console.error('Missing argument\nUsage: ' + require('./usage')(bin))
    process.exit(1)
  }
}


if (!path) {
  console.error('.trerc not found')
  process.exit(1)
}
const keys = ssbKeys.loadSync(join(path, '../.tre/secret'))

let makeSink
const destDir = resolve(argv._[0])
if (argv._[0] == '-' || argv.stdout) {
  makeSink = function(filename, cb) {
    return pull.drain(data=>process.stdout.write(data), cb)
  }
} else {
  console.error('destination directory:', destDir)
  mkdirp.sync(destDir)
}

ssbClient(conf.caps.shs, keys, (err, ssb) => {
  function bail(err) {
    if (err) {
      console.error(err.message)
      if (ssb) ssb.close(()=>process.exit(1))
      else process.exit(1)
    }
  }
  bail(err)

  doExport(ssb, destDir, Object.assign({}, argv, {makeSink}), err => {
    bail(err)
    ssb.close(()=>{
      process.exit(0)
    })
  })
})
