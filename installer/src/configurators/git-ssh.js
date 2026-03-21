'use strict';

const { Confirm } = require('enquirer');
const execa = require('execa');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Detect Git SSH configuration
 * @returns {Promise<{configured: boolean, command: string|null}>}
 */
async function detectGitSSH() {
  try {
    const { stdout } = await execa('git', ['config', '--get', 'core.sshCommand'], { reject: false });

    if (stdout && stdout.trim()) {
      return {
        configured: true,
        command: stdout.trim()
      };
    } else {
      return {
        configured: false,
        command: null
      };
    }
  } catch (error) {
    return {
      configured: false,
      command: null
    };
  }
}

/**
 * Configure Git SSH through interactive prompts and guidance
 * @returns {Promise<{status: string, details: string}>}
 */
async function configureGitSSH() {
  const current = await detectGitSSH();

  // If already configured
  if (current.configured) {
    console.log(chalk.green(t('gitSSH.configured')));
    console.log(chalk.gray(`  ${current.command}`));
    return { status: 'configured', details: current.command };
  }

  // Show guidance
  console.log(chalk.yellow(t('gitSSH.notConfigured')));
  console.log(chalk.gray(t('gitSSH.recommended')));
  console.log('');
  console.log(chalk.bold(t('gitSSH.guidance')));
  console.log(chalk.gray(t('gitSSH.step1')));
  console.log(chalk.gray(t('gitSSH.step2')));
  console.log(chalk.gray(t('gitSSH.step3')));
  console.log(chalk.gray(t('gitSSH.step4')));
  console.log(chalk.cyan(t('gitSSH.command')));
  console.log('');
  console.log(chalk.gray(t('gitSSH.docs')));
  console.log('');

  // Ask if user wants to skip
  const skipPrompt = new Confirm({
    name: 'skip',
    message: t('gitSSH.promptSkip'),
    initial: true
  });

  const shouldSkip = await skipPrompt.run();

  if (shouldSkip) {
    console.log(chalk.yellow(t('gitSSH.skipped')));
    return { status: 'skipped', details: 'user skipped' };
  }

  // User will configure manually
  return { status: 'configured', details: 'guidance shown' };
}

module.exports = {
  detectGitSSH,
  configureGitSSH
};
