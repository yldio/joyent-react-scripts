const originalConfig = require('./webpackDevServer.config.original');
const patch = require('./patch-dev-server-config');

module.exports = patch(originalConfig);
