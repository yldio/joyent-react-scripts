const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const { Plugin: ShakePlugin } = require('webpack-common-shake');
const Visualizer = require('webpack-visualizer-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');
const isString = require('lodash.isstring');
const fs = require('fs');
const path = require('path');

const { NODE_ENV, MINIFY, PREACT, GENERATE_SOURCEMAP } = process.env;

const FRONTEND_ROOT = process.cwd();
const FRONTEND = path.join(FRONTEND_ROOT, 'src');
const IS_PRODUCTION = (NODE_ENV || '').toLowerCase() === 'production';
const SHOULD_GENERATE_SOURCEMAP = GENERATE_SOURCEMAP !== 'false';
const USE_PREACT = Boolean(PREACT);
const USE_MINIFY = Boolean(USE_MINIFY);

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

const UglifyJsPlugin = () =>
  USE_MINIFY
    ? new MinifyPlugin()
    : new UglifyJsPlugin({
        compress: {
          warnings: false,
          comparisons: false
        },
        mangle: {
          safari10: true
        },
        output: {
          comments: false,
          ascii_only: true
        },
        sourceMap: SHOULD_GENERATE_SOURCEMAP
      });

module.exports = config => {
  config.resolve.alias.moment$ = 'moment/moment.js';

  config.plugins = config.plugins.concat(
    [
      new DuplicatePackageCheckerPlugin(),
      new LodashModuleReplacementPlugin({ collections: true }),
      IS_PRODUCTION && new ShakePlugin(),
      IS_PRODUCTION && new Visualizer()
    ].filter(Boolean)
  );

  config.plugins = config.plugins.map(
    plugin =>
      plugin instanceof webpack.optimize.UglifyJsPlugin
        ? UglifyJsPlugin()
        : plugin
  );

  config.module.rules = config.module.rules
    .reduce((loaders, loader, index) => {
      if (Array.isArray(loader.use)) {
        return loaders.concat([
          Object.assign(loader, {
            use: loader.use.map(l => {
              if (isString(l) || !isString(l.loader)) {
                return l;
              }

              if (!l.loader.match(/eslint-loader/)) {
                return l;
              }

              return Object.assign(l, {
                options: Object.assign(l.options, {
                  baseConfig: null,
                  useEslintrc: true
                })
              });
            })
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
        exclude: /node_modules/,
        loader: require.resolve('graphql-tag/loader')
      }
    ]);

  config.resolve.alias = Object.assign(
    {},
    config.resolve.alias,
    !USE_PREACT
      ? {}
      : {
          react: 'preact-compat',
          'react-dom': 'preact-compat',
          'create-react-class': 'preact-compat/lib/create-react-class'
        },
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
