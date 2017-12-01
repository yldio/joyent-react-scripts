const request = require('request');
const url = require('url');

module.exports = originalConfigFn => (proxy, allowedHost) => {
  const originalConf = originalConfigFn(proxy, allowedHost);

  return Object.assign({}, originalConf, {
    before: (app, self) => {
      app.get('/font/*', ({ params, headers, ...req }, res, next) => {
        request(url.format({
          protocol: 'https:',
          slashes: true,
          host: 'fonts.gstatic.com',
          pathname: params['0']
        })).pipe(res);
      });

      app.get('/fonts/css', ({ query, connection }, res, next) => {
        const { family } = query;
        const { address, port } = connection.server.address();

        request(url.format({
          protocol: 'https:',
          slashes: true,
          host: 'fonts.googleapis.com',
          pathname: '/css',
          query: {
            family
          }
        }), (err, { body, headers }) => {
          if (err) {
            return next(err);
          }

          res.setHeader('content-type', headers['content-type']);
          res.setHeader('expires', headers['expires']);
          res.setHeader('date', headers['date']);
          res.setHeader('cache-control', headers['cache-control']);

          const newBody = body.replace(
            /https\:\/\/fonts\.gstatic\.com/g,
            `http://${address}:${port}/font`
          );

          res.end(newBody);
        });
      });

      if (originalConf.before) {
        return originalConf.before(app, self);
      }
    }
  });
};
