'use strict';

const fs = require('fs');
const path = require('path');

describe('Bin Entry Point', () => {
  const binPath = path.join(__dirname, '../bin/setup.js');
  let fileContent;

  beforeAll(() => {
    fileContent = fs.readFileSync(binPath, 'utf8');
  });

  test('File starts with "#!/usr/bin/env node"', () => {
    const firstLine = fileContent.split('\n')[0];
    expect(firstLine).toBe('#!/usr/bin/env node');
  });

  test('File requires ../src/index.js', () => {
    expect(fileContent).toMatch(/require\s*\(\s*['"]\.\.\/src\/index\.js['"]\s*\)/);
  });

  test('File is executable entry point', () => {
    expect(fileContent).toMatch(/main\s*\(\s*\)/);
  });
});
