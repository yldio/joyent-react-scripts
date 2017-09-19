#!/usr/bin/env node

const main = require('apr-main');
const postinstall = require('./src/postinstall');

main(() =>
  (async () => {
    await postinstall();

    require('react-scripts/bin/react-scripts');
  })()
);
