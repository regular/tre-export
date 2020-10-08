module.exports = bin =>
  `${bin} DESTDIR|- ` +
  '--type CONTENTTYPE ' +
  '--branch BRANCH ' +
  '[--field X.Y.Z] ' +
  '[--removeMsgRefs] ' +
  '[--dryRun] ' +
  '[--forceExt EXT] ' +
  '[--lowerCase] ' +
  '[--kebabCase] ' +
  '[--help]'
