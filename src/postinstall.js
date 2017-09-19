const path = require('path');

const { readFile, writeFile, exists } = require('mz/fs');
const forEach = require('apr-for-each');

const ROOT = path.dirname(require.resolve('react-scripts/package.json'));
const CONF_ROOT = path.join(ROOT, 'config');

const configs = ['webpack.config.dev', 'webpack.config.prod'];

const toCopy = [
  'patch-webpack-config',
  'webpack.config.dev',
  'webpack.config.prod'
];

const backup = async file => {
  const backupPath = path.join(CONF_ROOT, `${file}.original.js`);
  const backupExists = await exists(backupPath);

  if (backupExists) {
    return;
  }

  const originalPath = path.join(CONF_ROOT, `${file}.js`);
  const orignalConfig = await readFile(originalPath, 'utf-8');
  return writeFile(backupPath, orignalConfig);
};

const copy = async file => {
  const srcPath = path.join(__dirname, `${file}.js`);
  const destPath = path.join(CONF_ROOT, `${file}.js`);

  const src = await readFile(srcPath, 'utf-8');
  return writeFile(destPath, src);
};

module.exports = async () => {
  await forEach(configs, backup);
  await forEach(toCopy, copy);
};
