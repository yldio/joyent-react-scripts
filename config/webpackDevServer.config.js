const patch = require('../src/patch-dev-server-config');

let config;
try {
  config = require('react-scripts/config/webpackDevServer.config.original');
} catch(err) {
  config = require('react-scripts/config/webpackDevServer.config');
}

module.exports = patch(config);
