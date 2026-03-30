'use strict';

const { detectAllInstalled } = require('./detector.js');
const { formatDetectionTable } = require('./formatter.js');
const { t } = require('../i18n/index.js');

/**
 * Count installed items from detection results
 * @param {Object} results - Detection results
 * @returns {number}
 */
function countInstalled(results) {
  let count = 0;
  count += results.plugins.filter(p => p.installed).length;
  if (results.hooksScripts.installed) count++;
  if (results.hooksRegistered.installed) count++;
  if (results.commandsInstalled.installed) count++;
  if (results.marketplaceSource.installed) count++;
  if (results.envVars.token.installed) count++;
  if (results.envVars.user.installed) count++;
  return count;
}

/**
 * Count total detectable items from detection results
 * @param {Object} results - Detection results
 * @returns {number}
 */
function countTotal(results) {
  // 2 plugins + 1 hooksScripts + 1 hooksRegistered + 1 commandsInstalled
  // + 1 marketplaceSource + 2 envVars (token + user) = 8
  return results.plugins.length + 6;
}

/**
 * Run uninstall detection: detect all installed components,
 * format results as a table, print to console, and return results.
 * @returns {Promise<Object>} Detection results
 */
async function runUninstallDetection() {
  // Run all detection checks
  const results = await detectAllInstalled();

  // Format and display the results table
  const output = formatDetectionTable(results);
  console.log(output);

  // Print summary line
  const installedCount = countInstalled(results);
  const totalCount = countTotal(results);
  console.log(t('uninstall.summary', { found: installedCount, total: totalCount }));

  return results;
}

module.exports = { runUninstallDetection };
