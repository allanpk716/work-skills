#!/usr/bin/env node

'use strict';

const { main } = require('../src/index.js');

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
