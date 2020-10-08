const {parse, join, resolve, dirname} = require('path')
const fs = require('fs')
const debug = require('debug')('tre-export')
const pull = require('pull-stream')
const toPull = require('stream-to-pull-stream')
const traverse = require('traverse')
const {isMsgId} = require('ssb-ref')

module.exports = function doExport(ssb, destDir, opts, cb) {
  const {dryRun, branch, type} = opts

  let makeSink = opts.makeSink

  if (!makeSink) {
    if (opts.dryRun) {
      console.error("Won't write files because of --dryRun option")
      makeSink = function(filepath, cb) {
        console.error(`WOuld write file ${filepath}`)
        return cb(null)
      }
    } else {
      makeSink = function(filepath, cb) {
        return toPull.sink(fs.createWriteStream(filepath), cb) 
      }
    }
  }

  if (!opts.branch && !opts.type) return cb(new Error('Need to specify BRANCH or TYPE'))
  // TODO: support combined branch and type query
  if (opts.branch && opts.type) return cb(new Error('Need to specify BRANCH or TYPE'))
  const source = opts.branch ? 
    ssb.revisions.messagesByBranch(opts.branch) :
    ssb.revisions.messagesByType(opts.type)

  pull(
    source,
    pull.map( kkv => {
      const revRoot = kkv.key.slice(-1)[0]
      const revision = kkv.value.key
      const content = kkv.value.value.content
      let filename = opts.makeFilename ? opts.makeFilename(content) : null
      if (!filename) {
        filename =
          content.filename ||
          content.name ||
          content.file && content.file.name ||
          revRoot.slice(1, 8)
        const fn = parse(filename)
        if (opts.forceExt) {
          debug('forcing file extension: %s', opts.forceExt)
          fn.ext = opts.forceExt
          filename = `${fn.name}.${fn.ext}`
        }
        if (opts.lowerCase) {
          debug('forcing filename to lowerCase')
          filename = filename.toLowerCase()
        }
        if (opts.kebabCase) {
          debug('forcing filename to kebabCase')
          filename = filename.replace(/[^\w.]/g, '-')
        }
      }
      console.error(`Exporting ${revRoot.slice(0,6)}:${revision.slice(0,6)} as ${filename}`)
      return {filename, content}
    }),
    pull.map(({filename, content}) => {
      if (opts.removeMsgRefs) {
        content = traverse(content).map(function(x) {
          if (isMsgId(x)) {
            this.remove()
          }
        })
      }
      if (opts.field) {
        const path = opts.field.split('.')
        content = traverse(content).get(path)
        if (!content) console.error(filename, 'has no field', opts.field)
      }
      if (!content) {
        console.error(filename, 'has no content - skipping')
        return null
      }
      return {filename, content}
    }),
    pull.filter(),
    pull.map(({filename, content}) => {
      if (typeof content == 'object') {
        content = JSON.stringify(content, null, 2)
      }
      return {filename, content}
    }),
    pull.asyncMap(({filename, content}, cb) => {
      const filepath = join(destDir, filename)
      pull(
        pull.values([content]),
        makeSink(filepath, err => {
          if (err) return cb(err)
          cb(null, filepath)
        })
      )
    }),
    pull.drain(filepath => {
      console.error(`Written ${filepath}`)
    }, cb)
  )
}

