'use strict';

const chalk = require('chalk');
const { t } = require('../i18n/index.js');
const { installHooks, isHooksInstalled, installCommands, isCommandsInstalled } = require('./hooks-installer.js');

/**
 * Run hooks installation step in the npx installer pipeline.
 * Registers claude-notify hooks globally in ~/.claude/settings.json
 * and installs slash commands to ~/.claude/commands/.
 * @returns {Promise<{success: boolean, copied: string[]}>}
 */
async function runHooksInstallation() {
  console.log(chalk.bold.blue('\n=== Notification Hooks Setup ===\n'));

  if (isHooksInstalled()) {
    console.log(chalk.green('  ✓ Notification hooks already registered globally'));
  } else {
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
  }

  // Install slash commands globally
  if (isCommandsInstalled()) {
    console.log(chalk.green('  ✓ Notification slash commands already installed'));
  } else {
    console.log(chalk.gray('  Installing notification slash commands globally...'));

    const cmdResult = installCommands({
      onProgress: (stage, name) => {
        if (stage === 'writing' && name) {
          console.log(chalk.gray(`    - ${name}.md`));
        }
      }
    });

    if (cmdResult.success) {
      console.log(chalk.green(`  ✓ ${cmdResult.installed.length} slash commands installed to ~/.claude/commands/`));
    } else {
      console.log(chalk.yellow('  ⊘ Slash commands skipped: ' + (cmdResult.error || 'unknown error')));
    }
  }

  return { success: true, copied: [] };
}

module.exports = {
  runHooksInstallation
};
