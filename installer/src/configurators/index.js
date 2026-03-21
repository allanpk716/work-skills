'use strict';

const chalk = require('chalk');
const { t } = require('../i18n/index.js');
const { configurePushover } = require('./pushover.js');
const { configureGitSSH } = require('./git-ssh.js');
const { configureGitUser } = require('./git-user.js');

/**
 * Display configuration summary table
 * @param {Array<{name: string, status: string, details?: string}>} results
 */
function displayConfigSummary(results) {
  console.log('\n' + chalk.bold(t('config.summary')));
  console.log(chalk.gray('─'.repeat(60)));

  results.forEach(result => {
    let statusIcon, statusColor;

    switch (result.status) {
      case 'configured':
        statusIcon = '✓';
        statusColor = chalk.green;
        break;
      case 'skipped':
        statusIcon = '⊘';
        statusColor = chalk.yellow;
        break;
      case 'failed':
        statusIcon = '✗';
        statusColor = chalk.red;
        break;
      default:
        statusIcon = '?';
        statusColor = chalk.gray;
    }

    const statusText = t(`config.status.${result.status}`);
    const details = result.details ? ` (${result.details})` : '';
    console.log(`${statusColor(statusIcon)} ${result.name.padEnd(20)} ${statusColor(statusText)} ${chalk.gray(details)}`);
  });

  console.log(chalk.gray('─'.repeat(60)));
}

/**
 * Run all configurators in sequence
 * @returns {Promise<void>}
 */
async function runAllConfigurators() {
  const results = [];

  // 1. Pushover (optional)
  console.log(chalk.bold('\n' + t('config.section.pushover')));
  const pushoverResult = await configurePushover();
  results.push({ name: 'Pushover', status: pushoverResult.status, details: pushoverResult.details });

  // 2. Git SSH (optional)
  console.log(chalk.bold('\n' + t('config.section.gitSSH')));
  const sshResult = await configureGitSSH();
  results.push({ name: 'Git SSH', status: sshResult.status, details: sshResult.details });

  // 3. Git user.info (required)
  console.log(chalk.bold('\n' + t('config.section.gitUser')));
  const userResult = await configureGitUser();
  results.push(
    { name: 'Git user.name', status: userResult.status, details: userResult.name },
    { name: 'Git user.email', status: userResult.status, details: userResult.email }
  );

  // Display summary
  displayConfigSummary(results);
}

module.exports = {
  runAllConfigurators,
  displayConfigSummary
};
