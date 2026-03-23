'use strict';

const chalk = require('chalk');
const { t } = require('../i18n/index.js');
const { runPythonVerification } = require('./runner.js');
const { parseVerificationOutput } = require('./parser.js');
const { formatVerificationTable, calculateSummary, displayCommonSolutions } = require('./formatter.js');

/**
 * Run installation verification and display results
 * @returns {Promise<{success: boolean, passed: number, total: number}>}
 */
async function runVerification() {
  // Display verification title
  console.log(chalk.bold.blue('\n=== ' + t('verification.title') + ' ===\n'));

  // Step 1: Execute Python verification script
  const execResult = await runPythonVerification();

  // Step 2: Handle execution errors
  if (!execResult.success) {
    if (execResult.error === 'python_not_found') {
      console.error(chalk.red(t('verification.error.pythonNotFound')));
      console.error(chalk.gray('Install Python 3.8+ from https://www.python.org/'));
      return { success: false, passed: 0, total: 0 };
    }

    if (execResult.error === 'script_not_found') {
      console.error(chalk.red(t('verification.error.scriptNotFound')));
      return { success: false, passed: 0, total: 0 };
    }

    if (execResult.error === 'timeout') {
      console.error(chalk.red(t('verification.error.timeout')));
      return { success: false, passed: 0, total: 0 };
    }

    // Generic execution failure
    console.error(chalk.red(t('verification.error.executionFailed')));
    if (execResult.stderr) {
      console.error(chalk.gray(execResult.stderr));
    }
    return { success: false, passed: 0, total: 0 };
  }

  // Step 3: Parse output
  const results = parseVerificationOutput(execResult.stdout);

  // Step 4: Format and display table
  const table = formatVerificationTable(results);
  console.log(table);

  // Step 5: Calculate and display summary
  const { passed, total } = calculateSummary(results);
  console.log('\n' + t('verification.summary', { passed, total }));

  // Step 6: Display common solutions if any checks failed
  if (passed < total) {
    displayCommonSolutions();
  }

  // Step 7: Display rerun command
  console.log(chalk.gray('\n' + t('verification.rerunCommand')));

  // Step 8: Return result (success requires at least 5/7 checks to pass)
  const success = passed >= 5;
  return { success, passed, total };
}

module.exports = {
  runVerification
};
