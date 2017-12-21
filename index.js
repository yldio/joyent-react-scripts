#!/usr/bin/env node

const main = require('apr-main');
const execa = require('execa');
const resolveFrom = require('resolve-from');

const postinstall = require('./src/postinstall');
const bin = resolveFrom(__dirname, 'react-scripts/bin/react-scripts');
const args = process.argv.slice(2);

const scriptIndex = args.findIndex(
  x => x === 'build' || x === 'eject' || x === 'start' || x === 'test'
);

const script = scriptIndex === -1 ? args[0] : args[scriptIndex];

main(() =>
  (async () => {
    await postinstall();

    if (script === 'test') {
      return execa(bin, args, {
        stdio: 'inherit',
        env: process.env
      });
    }

    const { stdout } = execa(bin, args, {
      stdio: ['ignore', 'pipe', process.stderr],
      env: process.env
    });

    stdout.pipe(process.stdout);
  })()
);
