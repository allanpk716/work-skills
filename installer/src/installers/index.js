'use strict';

const { Confirm } = require('enquirer');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');
const { installPipPackage, getErrorGuidance } = require('./pip-installer.js');

/**
 * Prompt user and install missing packages
 * @param {Array} packages - Array of detection results
 * @param {string} pythonCmd - Python command to use (default: 'python')
 * @returns {Promise<{installed: Array, failed: Array, skipped: Array}>}
 */
async function promptAndInstall(packages, pythonCmd = 'python') {
  const toInstall = packages.filter(p => !p.installed);

  if (toInstall.length === 0) {
    return { installed: [], failed: [], skipped: [] };
  }

  console.log(chalk.yellow('\n' + t('install.missingFound', { count: toInstall.length })));
  toInstall.forEach(pkg => console.log(`  - ${pkg.name}`));

  const installed = [];
  const failed = [];
  const skipped = [];

  for (const pkg of toInstall) {
    const prompt = new Confirm({
      name: 'install',
      message: t('install.promptInstall', { package: pkg.name }),
      initial: true
    });

    const shouldInstall = await prompt.run();

    if (shouldInstall) {
      console.log(chalk.gray(t('install.installing', { package: pkg.name })));
      const result = await installPipPackage(pkg.name, pythonCmd);

      if (result.success) {
        console.log(chalk.green('[OK] ' + result.message));
        installed.push(pkg.name);
      } else {
        console.log(chalk.red('[FAIL] ' + result.message));
        console.log(chalk.gray('    -> ' + t(getErrorGuidance(result.error))));
        failed.push(pkg.name);
      }
    } else {
      skipped.push(pkg.name);
    }
  }

  return { installed, failed, skipped };
}

/**
 * Run installer flow
 * @param {Array} detectionResults - Results from environment detection
 * @param {string} pythonCmd - Python command to use (default: 'python')
 * @returns {Promise<{installed: Array, failed: Array, skipped: Array}>}
 */
async function runInstaller(detectionResults, pythonCmd = 'python') {
  // Find Python detection result to get pythonCmd
  const pythonResult = detectionResults.find(r => r.name === 'Python');
  const cmd = pythonResult?.path || pythonCmd;

  // Filter to get only pip packages (exclude system tools)
  const pipPackages = detectionResults.filter(r =>
    r.name &&
    r.name !== 'Python' &&
    r.name !== 'Git' &&
    !r.name.includes('TortoiseGit') &&
    !r.name.includes('PuTTY') &&
    !r.name.includes('SSH')
  );

  const results = await promptAndInstall(pipPackages, cmd);

  // Print summary
  console.log('\n' + t('install.summary'));
  console.log(chalk.green('  ' + t('install.installed') + ': ' + results.installed.length));
  console.log(chalk.red('  ' + t('install.failed') + ': ' + results.failed.length));
  console.log(chalk.gray('  ' + t('install.skipped') + ': ' + results.skipped.length));

  return results;
}

module.exports = {
  runInstaller,
  promptAndInstall
};
