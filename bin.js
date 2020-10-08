#!/usr/bin/env node
const {parse, join, resolve, dirname} = require('path')
const ssbClient = require('ssb-zero-conf-client')
const ssbKeys = require('ssb-keys')
const debug = require('debug')('tre-export:bin')
const mkdirp = require('mkdirp')
const doExport = require('.')

const conf = require('rc')('tre')
const path = conf.config
const argv = require('minimist')(process.argv.slice(2))
debug('parsed command line arguments: %O', argv)
debug('read .trerc from %s: %O', path, conf)

if (!path) {
  console.error('.trerc not found')
  process.exit(1)
}
const keys = ssbKeys.loadSync(join(path, '../.tre/secret'))

if (argv._.length<1) {
  console.error('USAGE: tre-export DESTDIR [--field FILENAME_OR_DOTPATH] --type CONTENTTYPE --branch BRANCH [--forceExt EXT] [--lowerCase] [--kebabCase] [--dryRun]')
  process.exit(1)
}

const destDir = resolve(argv._[0])
console.error('destination directory:', destDir)
mkdirp.sync(destDir)

ssbClient(conf.caps.shs, keys, (err, ssb) => {
  function bail(err) {
    if (err) {
      console.error(err.message)
      if (ssb) ssb.close(()=>process.exit(1))
      else process.exit(1)
    }
  }
  bail(err)

  doExport(ssb, destDir, argv, err => {
    bail(err)
    ssb.close()
  })
})
