const fs = require('fs');
const path = require('path');

const createJestConfig = require('./createJestConfig.original');

module.exports = (resolve, rootDir, isEjecting) => {
  const SRC_ROOT = path.join(rootDir, 'src');
  const config = createJestConfig(resolve, rootDir, isEjecting);

  const scopes = fs
    .readdirSync(SRC_ROOT)
    .map(name => path.join(SRC_ROOT, name))
    .filter(fullpath => fs.statSync(fullpath).isDirectory())
    .map(fullpath => path.basename(fullpath));

  const aliases = scopes.reduce(
    (aliases, scope) =>
      Object.assign(aliases, {
        [`^@${scope}`]: path.join(SRC_ROOT, scope)
      }),
    {
      '^@root': SRC_ROOT
    }
  );

  return Object.assign(config, {
    moduleNameMapper: Object.assign(config.moduleNameMapper, aliases)
  });
};
