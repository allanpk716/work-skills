'use strict';

const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Format removal results as an ASCII table with colored status icons.
 * Uses the same separator pattern as formatter.js for visual consistency.
 * @param {Array<{category: string, name: string, status: 'removed'|'failed'|'skipped', detail: string}>} results
 * @returns {string} Formatted report string
 */
function formatRemovalReport(results) {
  const separator = chalk.gray('|---------------------------|------------|--------------------------------------------------|');

  if (results.length === 0) {
    return separator;
  }

  const lines = [separator];

  for (const result of results) {
    let icon;
    let statusText;

    switch (result.status) {
      case 'removed':
        icon = chalk.green('[v]');
        statusText = chalk.green('Removed');
        break;
      case 'failed':
        icon = chalk.red('[x]');
        statusText = chalk.red('Failed');
        break;
      case 'skipped':
        icon = chalk.gray('[-]');
        statusText = chalk.gray('Skipped');
        break;
      default:
        icon = '?';
        statusText = result.status;
    }

    const namePadded = result.name.padEnd(25).substring(0, 25);
    const statusPadded = (icon + ' ' + statusText).padEnd(10);
    const detailPadded = (result.detail || '').padEnd(48).substring(0, 48);

    lines.push(`| ${namePadded} | ${statusPadded} | ${detailPadded}|`);
  }

  lines.push(separator);

  // Summary line
  const removed = results.filter(r => r.status === 'removed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  lines.push(t('uninstall.remove.summary', { removed, failed, skipped }));

  return lines.join('\n');
}

module.exports = { formatRemovalReport };
