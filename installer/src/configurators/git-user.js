'use strict';

const { Input, Confirm } = require('enquirer');
const execa = require('execa');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Detect Git user.name and user.email configuration
 * @returns {Promise<{name: string|null, email: string|null}>}
 */
async function detectGitUser() {
  try {
    const { stdout: name } = await execa('git', ['config', '--global', '--get', 'user.name'], { reject: false });
    const { stdout: email } = await execa('git', ['config', '--global', '--get', 'user.email'], { reject: false });

    return {
      name: name || null,
      email: email || null
    };
  } catch (error) {
    return {
      name: null,
      email: null
    };
  }
}

/**
 * Configure Git user information through interactive prompts.
 * Handles 4 cases: both exist, only name, only email, neither.
 * Uses Confirm prompts per D-03 (default Y = keep existing).
 * @returns {Promise<{status: string, name?: string, email?: string}>}
 */
async function configureGitUser() {
  const current = await detectGitUser();

  let finalName = null;
  let finalEmail = null;

  // --- Case A: Both name AND email exist ---
  if (current.name && current.email) {
    console.log(chalk.green(t('gitUser.alreadyConfigured')));
    console.log(chalk.gray(`  user.name: ${current.name}`));
    console.log(chalk.gray(`  user.email: ${current.email}`));

    const keepPrompt = new Confirm({
      name: 'keepConfig',
      message: t('gitUser.promptKeepConfig'),
      initial: true  // per D-03: default Y = keep
    });
    const shouldKeep = await keepPrompt.run();
    if (shouldKeep) {
      return { status: 'configured', name: current.name, email: current.email };
    }
    // User chose to re-enter: fall through to unified input flow below
  }

  // --- Case B: Only name exists ---
  else if (current.name && !current.email) {
    console.log(chalk.green(t('gitUser.partiallyConfigured')));
    console.log(chalk.gray(`  user.name: ${current.name}`));

    const keepNamePrompt = new Confirm({
      name: 'keepName',
      message: t('gitUser.promptKeepName', { value: current.name }),
      initial: true  // per D-03
    });
    const keepName = await keepNamePrompt.run();

    if (keepName) {
      finalName = current.name;
    }

    // Email is missing, always prompt
    console.log(chalk.yellow(t('gitUser.emailRequired')));
  }

  // --- Case C: Only email exists ---
  else if (!current.name && current.email) {
    console.log(chalk.green(t('gitUser.partiallyConfigured')));
    console.log(chalk.gray(`  user.email: ${current.email}`));

    const keepEmailPrompt = new Confirm({
      name: 'keepEmail',
      message: t('gitUser.promptKeepEmail', { value: current.email }),
      initial: true  // per D-03
    });
    const keepEmail = await keepEmailPrompt.run();

    if (keepEmail) {
      finalEmail = current.email;
    }

    // Name is missing, always prompt
    console.log(chalk.yellow(t('gitUser.nameRequired')));
  }

  // --- Unified input flow ---
  // For Case A fall-through and Case D (neither): prompt both
  // For Case B/C: only prompt what's missing

  if (!finalName) {
    console.log(chalk.yellow(t('gitUser.required')));
    const namePrompt = new Input({
      name: 'userName',
      message: t('gitUser.promptName')
    });
    finalName = await namePrompt.run();
  }

  if (!finalEmail) {
    const emailPrompt = new Input({
      name: 'userEmail',
      message: t('gitUser.promptEmail')
    });
    finalEmail = await emailPrompt.run();
  }

  // --- Unified save ---
  try {
    await execa('git', ['config', '--global', 'user.name', finalName]);
    await execa('git', ['config', '--global', 'user.email', finalEmail]);

    console.log(chalk.green(t('gitUser.configured')));
    return { status: 'configured', name: finalName, email: finalEmail };
  } catch (error) {
    console.log(chalk.red(t('gitUser.failed')));
    console.log(chalk.gray(error.message));
    return { status: 'failed' };
  }
}

module.exports = {
  detectGitUser,
  configureGitUser
};
