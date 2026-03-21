'use strict';

const { checkPlatform } = require('./platform.js');
const { parseArgs } = require('./cli.js');
const { showWelcome } = require('./welcome.js');
const { runAllDetectors } = require('./detectors/index.js');
const { runInstaller } = require('./installers/index.js');
const { runAllConfigurators } = require('./configurators/index.js');

/**
 * Main entry point for the installer
 */
async function main() {
  // Step 1: Check platform (exits if not Windows)
  checkPlatform();

  // Step 2: Parse command line arguments
  const options = parseArgs();

  // Step 3: Show welcome banner
  showWelcome({ useColors: options.useColors });

  // Step 4: Run environment detection
  const { results, allPassed } = await runAllDetectors();

  // Step 5: Offer to install missing dependencies
  if (!allPassed) {
    const pipResults = results.filter(r =>
      r.name && r.name !== 'Python' && r.name !== 'Git' &&
      !r.name.includes('TortoiseGit') && !r.name.includes('PuTTY') && !r.name.includes('SSH')
    );

    if (pipResults.some(r => !r.installed)) {
      await runInstaller(results);
    }
  }

  // Step 6: Interactive configuration (Phase 17)
  await runAllConfigurators();

  // Step 7: More features will be added in later phases
  // - Marketplace integration (Phase 18)
  // - Installation verification (Phase 19)
}

module.exports = {
  main
};
