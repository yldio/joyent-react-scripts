const path = require('path');

const { readFile, writeFile, exists } = require('mz/fs');
const forEach = require('apr-for-each');

const ROOT = path.dirname(require.resolve('react-scripts/package.json'));

const configMap = {
  'webpack.config.dev': 'config/webpack.config.dev',
  'webpackDevServer.config': 'config/webpackDevServer.config',
  'webpack.config.prod': 'config/webpack.config.prod',
  'patch-dev-server-config': 'config/patch-dev-server-config',
  'patch-webpack-config': 'config/patch-webpack-config',
  createJestConfig: 'scripts/utils/createJestConfig'
};

const backup = async file => {
  const backupPath = path.join(ROOT, `${file}.original.js`);
  const originalPath = path.join(ROOT, `${file}.js`);
  const backupExists = await exists(backupPath);
  const originalExists = await exists(originalPath);

  if (backupExists || !originalExists) {
    return;
  }

  const orignalConfig = await readFile(originalPath, 'utf-8');
  return writeFile(backupPath, orignalConfig);
};

const copy = async file => {
  const srcPath = path.join(__dirname, `${file}.js`);
  const destPath = path.join(ROOT, `${configMap[file]}.js`);

  const src = await readFile(srcPath, 'utf-8');
  return writeFile(destPath, src);
};

module.exports = async () => {
  await forEach(Object.values(configMap), backup);
  await forEach(Object.keys(configMap), copy);
};
