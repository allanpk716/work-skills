'use strict';

const chalk = require('chalk');

/**
 * Format verification results as a simple ASCII table
 * @param {Array<{name: string, status: string, symbol: string, details: string}>} results
 * @returns {string} Formatted table string
 */
function formatVerificationTable(results) {
  const separator = chalk.gray('|---------------------------|------------|--------------------------------------------------|');
  const header = chalk.gray('| Check                     | Status     | Details                                          |');

  const lines = [separator, header, separator];

  results.forEach(result => {
    let statusIcon;
    if (result.status === 'PASS') {
      statusIcon = chalk.green('✓ PASS');
    } else if (result.status === 'FAIL') {
      statusIcon = chalk.red('✗ FAIL');
    } else {
      statusIcon = chalk.gray('⊘ SKIP');
    }

    const name = result.name.padEnd(25).substring(0, 25);
    const status = statusIcon.padEnd(10);
    const details = (result.details || '').padEnd(48).substring(0, 48);

    lines.push(`| ${name} | ${status} | ${details}|`);
  });

  lines.push(separator);

  return lines.join('\n');
}

/**
 * Calculate verification summary statistics
 * @param {Array<{status: string}>} results
 * @returns {{passed: number, total: number}}
 */
function calculateSummary(results) {
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;

  return { passed, total };
}

/**
 * Display common solutions for failed checks
 */
function displayCommonSolutions() {
  console.log(chalk.yellow('\nCommon solutions:'));
  console.log('  - Install missing Python libraries: pip install requests');
  console.log('  - Set environment variables: PUSHOVER_TOKEN, PUSHOVER_USER');
  console.log('  - Check PowerShell execution policy');
}

module.exports = {
  formatVerificationTable,
  calculateSummary,
  displayCommonSolutions
};
