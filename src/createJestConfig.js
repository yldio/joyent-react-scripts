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
        [`^@${scope}(/.*)$`]: `<rootDir>/src/${scope}$1`
      }),
    {
      '^@root(/.*)$': `<rootDir>/src/$1`
    }
  );

  try {
    const __aliases__ = require(path.join(SRC_ROOT, 'mocks/__aliases__.js'));
    Object.keys(__aliases__).forEach(k => {
      aliases[k] = __aliases__[k];
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return Object.assign(config, {
    moduleNameMapper: Object.assign(config.moduleNameMapper, aliases),
    transform: Object.assign(
      {
        '^.+.(graphql|gql)$': require.resolve('jest-transform-graphql')
      },
      config.transform
    )
  });
};
