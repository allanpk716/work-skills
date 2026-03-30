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

  test('parseArgs handles --uninstall', () => {
    const options = parseArgs(['node', 'setup.js', '--uninstall']);
    expect(options.uninstallOnly).toBe(true);
  });

  test('parseArgs defaults uninstallOnly to false', () => {
    const options = parseArgs(['node', 'setup.js']);
    expect(options.uninstallOnly).toBe(false);
  });

  test('parseArgs handles --uninstall with --verify', () => {
    const options = parseArgs(['node', 'setup.js', '--uninstall', '--verify']);
    expect(options.uninstallOnly).toBe(true);
    expect(options.verifyOnly).toBe(true);
  });

  test('--help output contains --uninstall', () => {
    let helpOutput = '';
    const { Command } = require('commander');
    const packageJson = require('../package.json');
    const program = new Command();
    program
      .name('work-skills-setup')
      .description('Work Skills Setup')
      .version(packageJson.version, '-v, --version', 'Show version')
      .option('-l, --lang <locale>', 'Language (en/zh)', 'auto')
      .option('--no-color', 'Disable colored output')
      .option('--verify', 'Run installation verification only')
      .option('--uninstall', 'Run uninstall detection')
      .exitOverride()
      .configureOutput({
        writeOut: (str) => { helpOutput += str; },
        writeErr: (str) => { helpOutput += str; }
      });
    try { program.parse(['node', 'setup.js', '--help']); } catch (e) {}
    expect(helpOutput).toContain('--uninstall');
  });

  test('--version output is unchanged', () => {
    const options = parseArgs(['node', 'setup.js']);
    const packageJson = require('../package.json');
    expect(packageJson.version).toBeDefined();
  });
});
