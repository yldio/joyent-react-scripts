const patch = require('../src/patch-webpack-config');

let config;
try {
  config = require('react-scripts/config/webpack.config.dev.original');
} catch(err) {
  config = require('react-scripts/config/webpack.config.dev');
}

module.exports = patch(config);
