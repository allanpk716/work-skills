'use strict';

const chalk = require('chalk');
const { t } = require('../i18n/index.js');
const { installHooks, isHooksInstalled } = require('./hooks-installer.js');

/**
 * Run hooks installation step in the npx installer pipeline.
 * Registers claude-notify hooks globally in ~/.claude/settings.json.
 * @returns {Promise<{success: boolean, copied: string[]}>}
 */
async function runHooksInstallation() {
  console.log(chalk.bold.blue('\n=== Notification Hooks Setup ===\n'));

  // Check if already installed (skip silently if so)
  if (isHooksInstalled()) {
    console.log(chalk.green('  ✓ Notification hooks already registered globally'));
    return { success: true, copied: [] };
  }

  console.log(chalk.gray('  Registering notification hooks globally...'));

  const result = installHooks({
    onProgress: (stage) => {
      const messages = {
        locating: '  Locating notification scripts...',
        copying: '  Copying scripts to ~/.claude/hooks/...',
        registering: '  Registering hooks in settings.json...',
        cleaning: '  Cleaning up marketplace cache...'
      };
      if (messages[stage]) {
        console.log(chalk.gray(messages[stage]));
      }
    }
  });

  if (result.success) {
    console.log(chalk.green('  ✓ Notification hooks registered successfully'));
    result.copied.forEach(script => {
      console.log(chalk.gray(`    - ${script}`));
    });
  } else {
    console.log(chalk.yellow('  ⊘ Notification hooks skipped: ' + (result.error || 'unknown error')));
  }

  return result;
}

module.exports = {
  runHooksInstallation
};
