const originalConfig = require('./webpackDevServer.config.original');
const ssrMidleware = require('./ssr-middleware');

module.exports = (proxy, allowedHost) => {
  const conf = originalConfig(proxy, allowedHost);

  return Object.assign({}, conf, {
    setup: app => {
      conf.setup(app);
      app.use(ssrMidleware);
    }
  });
};

