const got = require('got');
const url = require('url');

module.exports = originalConfigFn => (proxy, allowedHost) => {
  const originalConf = originalConfigFn(proxy, allowedHost);

  return Object.assign({}, originalConf, {
    before: (app, self) => {
      app.get('/font/*', ({ params }, res) => {
        got
          .stream(
            url.format({
              protocol: 'https:',
              slashes: true,
              host: 'fonts.gstatic.com',
              pathname: params['0']
            })
          )
          .pipe(res);
      });

      app.get('/fonts/css', ({ query, connection }, res, next) => {
        const { family } = query;
        const { address, port } = connection.server.address();

        got(
          url.format({
            protocol: 'https:',
            slashes: true,
            host: 'fonts.googleapis.com',
            pathname: '/css',
            query: {
              family
            }
          })
        )
          .then(({ body, headers }) => {
            res.setHeader('content-type', headers['content-type']);
            res.setHeader('expires', headers['expires']);
            res.setHeader('date', headers['date']);
            res.setHeader('cache-control', headers['cache-control']);

            const newBody = body.replace(
              /https\:\/\/fonts\.gstatic\.com/g,
              `http://${address}:${port}/font`
            );
            res.end(newBody);
          })
          .catch(err => next(err));
      });

      if (originalConf.before) {
        return originalConf.before(app, self);
      }
    }
  });
};
