'use strict';

const { Input, Confirm } = require('enquirer');
const execa = require('execa');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Detect existing Pushover environment variables
 * @returns {{token: string|null, user: string|null}}
 */
function detectPushoverEnv() {
  return {
    token: process.env.PUSHOVER_TOKEN || null,
    user: process.env.PUSHOVER_USER || null
  };
}

/**
 * Set environment variable using setx command
 * @param {string} name - Variable name
 * @param {string} value - Variable value
 * @returns {Promise<{success: boolean, error?: string, errorDetails?: string}>}
 */
async function setEnvVariable(name, value) {
  try {
    await execa('setx', [name, value]);
    return { success: true };
  } catch (error) {
    const stderr = error.stderr || error.message || '';
    let errorType = 'unknown';

    // Detect error type from stderr
    if (stderr.includes('Access is denied')) {
      errorType = 'permission';
    }

    return {
      success: false,
      error: errorType,
      errorDetails: stderr
    };
  }
}

/**
 * Validate Pushover credentials against API
 * @param {string} token - Pushover application token
 * @param {string} user - Pushover user key
 * @returns {Promise<{valid: boolean, devices?: Array, error?: string}>}
 */
async function validatePushoverCredentials(token, user) {
  try {
    const { stdout } = await execa('curl', [
      '-s',
      '-X',
      'POST',
      `https://api.pushover.net/1/users/validate.json`,
      '-d',
      `token=${token}`,
      '-d',
      `user=${user}`
    ]);

    const response = JSON.parse(stdout);

    if (response.status === 1) {
      return {
        valid: true,
        devices: response.devices || []
      };
    } else {
      return {
        valid: false,
        error: response.errors?.join(', ') || 'Invalid credentials'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Validation failed'
    };
  }
}

/**
 * Configure Pushover through interactive prompts
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<{status: string, details: string}>}
 */
async function configurePushover(maxRetries = 3) {
  const currentEnv = detectPushoverEnv();

  // Check if already configured
  if (currentEnv.token && currentEnv.user) {
    console.log(chalk.green(t('pushover.alreadyConfigured')));
    console.log(chalk.gray(`  Token: ${currentEnv.token.substring(0, 8)}...`));
    console.log(chalk.gray(`  User: ${currentEnv.user.substring(0, 8)}...`));

    const reconfigurePrompt = new Confirm({
      name: 'reconfigure',
      message: t('pushover.promptReconfigure'),
      initial: false
    });

    const shouldReconfigure = await reconfigurePrompt.run();
    if (!shouldReconfigure) {
      return { status: 'configured', details: 'already set' };
    }
  }

  // Ask if user wants to configure Pushover
  const configurePrompt = new Confirm({
    name: 'configure',
    message: t('pushover.promptConfigure'),
    initial: true
  });

  const shouldConfigure = await configurePrompt.run();

  if (!shouldConfigure) {
    console.log(chalk.yellow(t('pushover.skipped')));
    return { status: 'skipped', details: 'user skipped' };
  }

  // Retry loop
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Prompt for token
    const tokenPrompt = new Input({
      name: 'token',
      message: t('pushover.promptToken')
    });
    const token = await tokenPrompt.run();

    // Prompt for user
    const userPrompt = new Input({
      name: 'user',
      message: t('pushover.promptUser')
    });
    const user = await userPrompt.run();

    // Validate credentials
    console.log(chalk.gray(t('pushover.validating')));
    const validation = await validatePushoverCredentials(token, user);

    if (!validation.valid) {
      console.log(chalk.red(t('pushover.validationFailed')));
      console.log(chalk.gray(`  -> ${validation.error}`));

      if (attempt < maxRetries) {
        console.log(chalk.yellow(t('pushover.retryPrompt', { attempt, max: maxRetries })));
        continue;
      } else {
        return { status: 'failed', details: validation.error };
      }
    }

    // Save credentials
    console.log(chalk.gray(t('pushover.saving')));

    const tokenResult = await setEnvVariable('PUSHOVER_TOKEN', token);
    if (!tokenResult.success) {
      console.log(chalk.red(t('pushover.saveFailed')));
      console.log(chalk.gray(t('guidance.pushoverManual')));
      return { status: 'failed', details: 'setx failed for token' };
    }

    const userResult = await setEnvVariable('PUSHOVER_USER', user);
    if (!userResult.success) {
      console.log(chalk.red(t('pushover.saveFailed')));
      console.log(chalk.gray(t('guidance.pushoverManual')));
      return { status: 'failed', details: 'setx failed for user' };
    }

    // Success
    console.log(chalk.green(t('pushover.configured')));
    console.log(chalk.yellow(t('pushover.restartReminder')));
    return { status: 'configured', details: 'validated and saved' };
  }

  // Should not reach here, but just in case
  return { status: 'failed', details: 'max retries exceeded' };
}

module.exports = {
  detectPushoverEnv,
  setEnvVariable,
  validatePushoverCredentials,
  configurePushover
};
