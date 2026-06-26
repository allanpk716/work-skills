'use strict';

const chalk = require('chalk');
const { t } = require('../i18n/index.js');
const { detectPython } = require('./python.js');
const { detectPipPackage } = require('./pip-package.js');

/**
 * Print detection result with status indicator
 * @param {Object} result - Detection result object
 */
function printResult(result) {
  const status = result.installed && result.meetsMinimum !== false;
  const symbol = status ? chalk.green('[OK]') : chalk.red('[FAIL]');
  const version = result.version ? ` (${result.version})` : '';

  console.log(`  ${symbol} ${result.name}${version}`);

  if (!status && result.guidance) {
    console.log(chalk.gray(`      -> ${t(result.guidance)}`));
  }
}

/**
 * Run all environment detectors
 * @returns {Promise<{results: Array, allPassed: boolean}>}
 */
async function runAllDetectors() {
  console.log('\n' + t('detection.checking') + '\n');

  const results = await Promise.all([
    detectPython(),
    detectPipPackage('requests')
  ]);

  results.forEach(printResult);

  const failedCount = results.filter(r => !r.installed || r.meetsMinimum === false).length;
  const passedCount = results.length - failedCount;

  console.log('\n' + t('detection.summary', { passed: passedCount, total: results.length }));

  return {
    results,
    allPassed: failedCount === 0
  };
}

module.exports = {
  runAllDetectors,
  printResult
};
