module.exports = `
DESCRIPTION

  Queries ssb messages either by content.type or by content.branch. These messages are then written to one file each, or output to STDOUT as double-newline-delimited JSON. Single fields can be extracted from the message content, and/or references to other messages can be stripped. (for example when exporting mesages with the purpose of importing them on a different ssb network where these references would not be valid). Names for output files are derived from message content (see below). There are a few options to modify default file name generation.

  DESTDIR              directory to write files to. Will be created if needed. Or - for STDOUT
  --type CONTENTTYPE   find messages by type
  --branch BRANCH      find messages by branch
  --field X.Y.Z        dot-delimited object path specifying which proptery to extract from message content
  --removeMsgRefs      remove all message references ("%...") from message content before writing output
  --dryRun             do not write any files but show names of files that would be written

OUTPUT FILE NAMES

  By default, names of output files will be determined by looking at the message contnet with following priority:

  - content.filename
  - content.name
  - content.file.name
  - content.revisionRoot (first eight characters)
  - message key (first eight characters)

OUTPUT FILE NAME MODIFIERS

  --forceExt EXT    force filename extension
  --lowerCase       make file names lower case
  --kebabCase       replace spaces in file names with hyphens (minus)

EXAMPLE

  tre-export assets/cs --type stylesheet --kebabCase --lowerCase --forceExt css
`
