const path = require('path');
const fs = require('fs');

const React = require('react');
const { renderToString } = require('react-dom/server');
const { StaticRouter } = require('react-router-dom');

const esmRequire = require('@std/esm')(module, {
  esm: 'all',
  cjs: false
});

require('babel-register')({
  only: process.cwd(),
  ignore: /\/(build|node_modules)\//
});

const { default: App } = esmRequire(path.join(process.cwd(), 'src/app'));

const filePath = path.resolve(process.cwd(), 'public/index.html');
const html = fs.readFileSync(filePath, 'utf-8');


module.exports = (req, res, next) => next();
// {
//   // const context = {}
//   // const store = configureStore()
//   // const markup = renderToString(
//   //   <Provider store={store}>
//   //     <StaticRouter
//   //       location={req.url}
//   //       context={context}
//   //     >
//   //       <App/>
//   //     </StaticRouter>
//   //   </Provider>
//   // )
//   //
//   // if (context.url) {
//   //   // Somewhere a `<Redirect>` was rendered
//   //   res.redirect(301, context.url)
//   // } else {
//   //   // we're good, send the response
//   //   const RenderedApp = htmlData.replace('{{SSR}}', markup)
//   //   res.send(RenderedApp)
//   // }
//
// };
