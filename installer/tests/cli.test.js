'use strict';

const { parseArgs } = require('../src/cli.js');

describe('CLI Module', () => {
  test('parseArgs returns options object', () => {
    const options = parseArgs(['node', 'setup.js']);
    expect(options).toHaveProperty('lang');
    expect(options).toHaveProperty('useColors');
  });

  test('parseArgs handles --no-color', () => {
    const options = parseArgs(['node', 'setup.js', '--no-color']);
    expect(options.useColors).toBe(false);
  });

  test('parseArgs handles --lang', () => {
    const options = parseArgs(['node', 'setup.js', '--lang', 'zh']);
    expect(options.lang).toBe('zh');
  });

  test('parseArgs handles -l short flag', () => {
    const options = parseArgs(['node', 'setup.js', '-l', 'en']);
    expect(options.lang).toBe('en');
  });

  test('parseArgs defaults lang to auto', () => {
    const options = parseArgs(['node', 'setup.js']);
    expect(options.lang).toBe('auto');
  });
});
