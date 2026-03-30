'use strict';

const { Confirm } = require('enquirer');
const { detectAllInstalled } = require('./detector.js');
const { formatDetectionTable } = require('./formatter.js');
const { removeAllComponents } = require('./remover.js');
const { formatRemovalReport } = require('./reporter.js');
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

/**
 * Prompt the user to confirm uninstall action.
 * Default is No (initial: false) for safety.
 * @returns {Promise<boolean>}
 */
async function confirmUninstall() {
  const prompt = new Confirm({
    name: 'confirmUninstall',
    message: t('uninstall.remove.confirmPrompt'),
    initial: false
  });
  return await prompt.run();
}

/**
 * Run the full uninstall flow:
 *   1. Detect all installed components
 *   2. Display detection table
 *   3. Handle nothing-installed case
 *   4. Print summary line
 *   5. Ask user for confirmation (default No)
 *   6. Remove all components (if confirmed)
 *   7. Display removal report
 * @returns {Promise<Object>} { success, aborted?, nothingToRemove?, results? }
 */
async function runUninstall() {
  // Step 1: Detect (reuse existing)
  const results = await detectAllInstalled();

  // Step 2: Display detection table
  const output = formatDetectionTable(results);
  console.log(output);

  // Step 3: Handle nothing-installed
  if (!results.hasAnyInstalled) {
    console.log(t('uninstall.nothingFound'));
    return { success: true, nothingToRemove: true };
  }

  // Step 4: Print summary line
  const installedCount = countInstalled(results);
  const totalCount = countTotal(results);
  console.log(t('uninstall.summary', { found: installedCount, total: totalCount }));

  // Step 5: Confirm (default No)
  const confirmed = await confirmUninstall();
  if (!confirmed) {
    console.log(t('uninstall.remove.aborted'));
    return { success: true, aborted: true };
  }

  // Step 6: Remove
  console.log(t('uninstall.remove.progress'));
  const removalResults = await removeAllComponents(results);

  // Step 7: Report
  console.log(formatRemovalReport(removalResults));
  console.log(t('uninstall.remove.complete'));

  return { success: true, results: removalResults };
}

module.exports = { runUninstallDetection, runUninstall };
