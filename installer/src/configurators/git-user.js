'use strict';

const { Input } = require('enquirer');
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
 * Configure Git user information through interactive prompts
 * @returns {Promise<{status: string, name?: string, email?: string}>}
 */
async function configureGitUser() {
  const current = await detectGitUser();

  // If already configured
  if (current.name && current.email) {
    console.log(chalk.green(t('gitUser.alreadyConfigured')));
    console.log(chalk.gray(`  user.name: ${current.name}`));
    console.log(chalk.gray(`  user.email: ${current.email}`));
    return { status: 'configured', name: current.name, email: current.email };
  }

  // Show requirement
  console.log(chalk.yellow(t('gitUser.required')));

  // Prompt for user.name
  const namePrompt = new Input({
    name: 'userName',
    message: t('gitUser.promptName')
  });
  const userName = await namePrompt.run();

  // Prompt for user.email
  const emailPrompt = new Input({
    name: 'userEmail',
    message: t('gitUser.promptEmail')
  });
  const userEmail = await emailPrompt.run();

  // Set Git config
  try {
    await execa('git', ['config', '--global', 'user.name', userName]);
    await execa('git', ['config', '--global', 'user.email', userEmail]);

    console.log(chalk.green(t('gitUser.configured')));
    return { status: 'configured', name: userName, email: userEmail };
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
