'use strict';

const { Command } = require('commander');
const { setLanguage } = require('./i18n/index.js');

/**
 * Parse command line arguments
 * @param {string[]} argv - Process arguments (usually process.argv)
 * @returns {Object} Parsed options
 */
function parseArgs(argv = process.argv) {
  const packageJson = require('../package.json');

  // Create a new Command instance for each call (avoids singleton issues in tests)
  const program = new Command();

  program
    .name('work-skills-setup')
    .description('Work Skills Setup - Claude Code skills installer for Windows developers')
    .version(packageJson.version, '-v, --version', 'Show version')
    .option('-l, --lang <locale>', 'Language (en/zh)', 'auto')
    .option('--no-color', 'Disable colored output')
    .option('--verify', 'Run installation verification only')
    .option('--uninstall', 'Run uninstall detection')
    .allowExcessArguments(true)
    .exitOverride() // Prevent process.exit in tests
    .parse(argv);

  const options = program.opts();

  // Set language if specified
  if (options.lang && options.lang !== 'auto') {
    setLanguage(options.lang);
  }

  return {
    lang: options.lang,
    useColors: options.color !== false,
    verifyOnly: options.verify === true,
    uninstallOnly: options.uninstall === true
  };
}

module.exports = {
  parseArgs
};
