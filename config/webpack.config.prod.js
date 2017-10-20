const patch = require('../src/patch-webpack-config');

let config;
try {
  config = require('react-scripts/config/webpack.config.prod.original');
} catch(err) {
  config = require('react-scripts/config/webpack.config.prod');
}

module.exports = patch(config);
