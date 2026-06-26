'use strict';

const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Format detection results as an ASCII table with colored status icons.
 * Follows the hand-drawn table pattern from verification/formatter.js.
 * @param {Object} results - Detection results from detectAllInstalled()
 * @returns {string} Formatted table string
 */
function formatDetectionTable(results) {
  // If nothing is installed, show simple message
  if (!results.hasAnyInstalled) {
    return t('uninstall.nothingFound');
  }

  const separator = chalk.gray('|---------------------------|------------|--------------------------------------------------|');
  const header = chalk.gray('| Item                      | Status     | Details                                          |');

  const lines = [separator, header, separator];

  // Category: Plugins
  lines.push(formatCategoryHeader(t('uninstall.category.plugins')));
  for (const plugin of results.plugins) {
    lines.push(formatRow(
      t('uninstall.item.pluginDir', { name: plugin.name }),
      plugin.installed,
      plugin.installed ? plugin.path : ''
    ));
  }

  // Category: Hook Scripts
  lines.push(formatCategoryHeader(t('uninstall.category.hooks')));
  lines.push(formatRow(
    t('uninstall.item.hookScript'),
    results.hooksScripts.installed,
    results.hooksScripts.installed ? results.hooksScripts.path : ''
  ));

  // Category: Hook Registration
  lines.push(formatCategoryHeader(t('uninstall.category.hookRegistration')));
  lines.push(formatRow(
    t('uninstall.item.hookReg'),
    results.hooksRegistered.installed,
    results.hooksRegistered.installed ? results.hooksRegistered.path : ''
  ));

  // Category: Slash Commands
  lines.push(formatCategoryHeader(t('uninstall.category.commands')));
  lines.push(formatRow(
    t('uninstall.item.command'),
    results.commandsInstalled.installed,
    results.commandsInstalled.installed ? results.commandsInstalled.path : ''
  ));

  // Category: Environment Variables
  lines.push(formatCategoryHeader(t('uninstall.category.environment')));
  lines.push(formatRow(
    t('uninstall.item.envVar', { name: results.envVars.token.name }),
    results.envVars.token.installed,
    results.envVars.token.installed ? 'set' : ''
  ));
  lines.push(formatRow(
    t('uninstall.item.envVar', { name: results.envVars.user.name }),
    results.envVars.user.installed,
    results.envVars.user.installed ? 'set' : ''
  ));

  lines.push(separator);

  return lines.join('\n');
}

/**
 * Format a category header row
 * @param {string} text
 * @returns {string}
 */
function formatCategoryHeader(text) {
  return chalk.cyan(`| ${text.padEnd(82)} |`);
}

/**
 * Format a single table row with status icon
 * @param {string} name - Item name
 * @param {boolean} installed - Whether item is installed
 * @param {string} details - Path or detail text
 * @returns {string}
 */
function formatRow(name, installed, details) {
  const statusIcon = installed
    ? chalk.green('✓') + ' ' + t('uninstall.status.installed')
    : chalk.gray('⊘') + ' ' + t('uninstall.status.notInstalled');

  const namePadded = name.padEnd(25).substring(0, 25);
  const statusPadded = statusIcon.padEnd(10);
  const detailsPadded = (details || '').padEnd(48).substring(0, 48);

  return `| ${namePadded} | ${statusPadded} | ${detailsPadded}|`;
}

module.exports = { formatDetectionTable };
