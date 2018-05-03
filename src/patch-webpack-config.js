const React = require('react');
const { renderToString } = require('react-dom/server');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const { Plugin: ShakePlugin } = require('webpack-common-shake');
const Visualizer = require('webpack-visualizer-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');
const isString = require('lodash.isstring');
const fs = require('fs');
const path = require('path');

const {
  NODE_ENV,
  UGLIFYJS,
  PREACT,
  GENERATE_SOURCEMAP,
  NAMESPACE
} = process.env;

const FRONTEND_ROOT = process.cwd();
const FRONTEND = path.join(FRONTEND_ROOT, 'src');
const IS_PRODUCTION = (NODE_ENV || '').toLowerCase() === 'production';
const SHOULD_GENERATE_SOURCEMAP = GENERATE_SOURCEMAP !== 'false';
const USE_PREACT = Boolean(PREACT);
const USE_UGLIFYJS = Boolean(UGLIFYJS);
const DOCUMENT = path.join(FRONTEND, 'html.js');

require('babel-register')({
  only: DOCUMENT,
  sourceRoot: FRONTEND_ROOT,
  moduleRoot: FRONTEND_ROOT,
  babelrc: true
});

const Html = (() => {
  try {
    return require(DOCUMENT);
  } catch (err) {
    return {};
  }
})();

if (Html) {
  const html = renderToString(React.createElement(Html));
  const prefix = `<!-- Do not edit. This is a generated file from ${path.relative(FRONTEND_ROOT, DOCUMENT)}. -->`;
  fs.writeFileSync(path.join(FRONTEND_ROOT, 'public/index.html'), `${prefix}\n${html}`);
}

const BabelLoader = loader => ({
  test: loader.test,
  include: loader.include,
  loader: loader.loader,
  options: {
    babelrc: true,
    compact: true
  }
});

const FileLoader = loader => ({
  exclude: loader.exclude.concat([/\.(graphql|gql)$/]),
  loader: loader.loader,
  options: loader.options
});

const Minify = () =>
  USE_UGLIFYJS
    ? new UglifyJsPlugin({
        compress: {
          warnings: false,
          comparisons: false
        },
        mangle: {
          safari10: true
        },
        output: {
          comments: false,
          // eslint-disable-next-line camelcase
          ascii_only: true
        },
        sourceMap: SHOULD_GENERATE_SOURCEMAP
      })
    : new MinifyPlugin();

module.exports = config => {
  if (NAMESPACE) {
    config.output.filename = `${NAMESPACE}/${config.output.filename}`;
    config.output.chunkFilename = `${NAMESPACE}/${config.output.chunkFilename}`;
  }

  config.resolve.alias.moment$ = 'moment/moment.js';

  config.plugins = config.plugins.concat(
    [
      new DuplicatePackageCheckerPlugin(),
      new LodashModuleReplacementPlugin({ collections: true, flattening: true }),
      IS_PRODUCTION && new ShakePlugin(),
      IS_PRODUCTION && new Visualizer()
    ].filter(Boolean)
  );

  config.plugins = config.plugins.map(plugin => {
    if (plugin instanceof webpack.optimize.UglifyJsPlugin) {
      return Minify();
    }

    // remove when https://github.com/facebookincubator/create-react-app/pull/3419/files is published
    if (plugin instanceof SWPrecacheWebpackPlugin) {
      return new SWPrecacheWebpackPlugin({
        dontCacheBustUrlsMatching: /\.\w{8}\./,
        filename: 'service-worker.js',
        logger(message) {
          if (message.indexOf('Total precache size is') === 0) {
            // This message occurs for every build and is a bit too noisy.
            return;
          }

          if (message.indexOf('Skipping static resource') === 0) {
            // This message obscures real errors so we ignore it.
            // https://github.com/facebookincubator/create-react-app/issues/2612
            return;
          }

          // eslint-disable-next-line no-console
          console.log(message);
        },
        minify: true,
        // Don't precache sourcemaps (they're large) and build asset manifest:
        staticFileGlobsIgnorePatterns: [/\.map$/, /asset-manifest\.json$/]
      });
    }

    return plugin;
  });

  config.module.rules = config.module.rules
    .reduce((loaders, loader, index) => {
      if (Array.isArray(loader.use)) {
        return loaders.concat([
          Object.assign(loader, {
            use: loader.use
              .map(l => {
                if (isString(l) || !isString(l.loader)) {
                  return l;
                }

                if (!l.loader.match(/eslint-loader/)) {
                  return l;
                }

                if (IS_PRODUCTION) {
                  return null;
                }

                return Object.assign(l, {
                  options: Object.assign(l.options, {
                    baseConfig: null,
                    useEslintrc: true
                  })
                });
              })
              .filter(Boolean)
          })
        ]);
      }

      if (Array.isArray(loader.oneOf)) {
        return loaders.concat([
          Object.assign(loader, {
            oneOf: loader.oneOf.map(loader => {
              if (!isString(loader.loader)) {
                return loader;
              }

              if (loader.loader.match(/babel-loader/)) {
                return BabelLoader(loader);
              }

              if (loader.loader.match(/file-loader/)) {
                return FileLoader(loader);
              }

              return loader;
            })
          })
        ]);
      }

      if (!isString(loader.loader)) {
        return loaders.concat([loader]);
      }

      if (loader.loader.match(/babel-loader/)) {
        return loaders.concat(BabelLoader(loader));
      }

      if (loader.loader.match(/file-loader/)) {
        return loaders.concat([FileLoader(loader)]);
      }

      return loaders.concat([loader]);
    }, [])
    .concat([
      {
        test: /\.(graphql|gql)$/,
        include: FRONTEND,
        loader: require.resolve('graphql-tag/loader')
      }
    ]);

  config.resolve.alias = Object.assign(
    {},
    config.resolve.alias,
    USE_PREACT
      ? {
          react: 'preact-compat',
          'react-dom': 'preact-compat',
          'create-react-class': 'preact-compat/lib/create-react-class'
        }
      : {},
    fs
      .readdirSync(FRONTEND)
      .map(name => path.join(FRONTEND, name))
      .filter(fullpath => fs.statSync(fullpath).isDirectory())
      .reduce(
        (aliases, fullpath) =>
          Object.assign(aliases, {
            [`@${path.basename(fullpath)}`]: fullpath
          }),
        {
          '@root': FRONTEND
        }
      )
  );

  return config;
};
