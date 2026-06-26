'use strict';

const { checkPlatform } = require('./platform.js');
const { parseArgs } = require('./cli.js');
const { showWelcome } = require('./welcome.js');
const { runAllDetectors } = require('./detectors/index.js');
const { runInstaller } = require('./installers/index.js');
const { runAllConfigurators } = require('./configurators/index.js');
const { runHooksInstallation } = require('./hooks/index.js');
const { runVerification } = require('./verification/index.js');
const { runUninstall } = require('./uninstall/index.js');

/**
 * Main entry point for the installer
 */
async function main() {
  // Step 1: Check platform (exits if not Windows)
  checkPlatform();

  // Step 2: Parse command line arguments
  const options = parseArgs();

  // Handle --uninstall flag (uninstallOnly takes priority over verifyOnly)
  if (options.uninstallOnly) {
    const result = await runUninstall();
    process.exit(0);
  }

  // Handle --verify flag (skip to verification only)
  if (options.verifyOnly) {
    const result = await runVerification();
    process.exit(result.success ? 0 : 1);
  }

  // Step 3: Show welcome banner
  showWelcome({ useColors: options.useColors });

  // Step 4: Run environment detection
  const { results, allPassed } = await runAllDetectors();

  // Step 5: Offer to install missing dependencies
  if (!allPassed) {
    const pipResults = results.filter(r => r.name && r.name !== 'Python');

    if (pipResults.some(r => !r.installed)) {
      await runInstaller(results);
    }
  }

  // Step 6: Interactive configuration (Phase 17)
  await runAllConfigurators();

  // Step 7: Register global hooks for notification plugins
  await runHooksInstallation();

  // Step 8: Installation verification (Phase 19)
  const chalk = require('chalk');
  console.log(chalk.cyan('\n=== Installation Complete ===\n'));
  console.log(chalk.gray('Running verification to check your setup...\n'));
  await runVerification();
}

module.exports = {
  main
};
