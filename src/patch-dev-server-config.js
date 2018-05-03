const send = require('send');
const path = require('path');
const fs = require('fs');

const { NAMESPACE = '' } = process.env;

const match = `${NAMESPACE ? `/${NAMESPACE}` : ''}/static/*`;

module.exports = originalConfigFn => (proxy, allowedHost) => {
  const originalConf = originalConfigFn(proxy, allowedHost);
  const { contentBase } = originalConf;

  return Object.assign({}, originalConf, {
    before: (app, self) => {
      app.get(match, ({ params, ...req }, res, next) => {
        const pathname = path.join(contentBase, 'static', params[0]);
        fs.access(pathname, fs.constants.R_OK, err => {
          return err ? next() : send(req, pathname).pipe(res);
        });
      });

      if (originalConf.before) {
        return originalConf.before(app, self);
      }
    }
  });
};
