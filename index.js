#!/usr/bin/env node

const main = require('apr-main');
const execa = require('execa');
const resolveFrom = require('resolve-from');

const postinstall = require('./src/postinstall');
const bin = resolveFrom(__dirname, 'react-scripts/bin/react-scripts');
const args = process.argv.slice(2);

main(() =>
  (async () => {
    await postinstall();

    const { stdout } = execa(bin, args, {
      stdio: ['ignore', 'pipe', process.stderr],
      env: process.env
    });

    stdout.pipe(process.stdout);
  })()
);
