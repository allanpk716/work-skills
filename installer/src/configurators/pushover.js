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
 * Read an environment variable from Windows registry (HKCU\Environment).
 * This detects values persisted via `setx` that may not yet be in process.env.
 * @param {string} varName - Variable name to query
 * @returns {Promise<string|null>}
 */
async function readRegistryEnvVar(varName) {
  try {
    const { stdout } = await execa('reg', ['query', 'HKCU\\Environment', '/v', varName]);
    const lines = stdout.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const valueLine = lines.find(l => l.includes('REG_SZ'));
    if (valueLine) {
      const parts = valueLine.split(/\s{2,}/);
      return parts[2] || null;
    }
    return null;
  } catch (e) {
    // exitCode 1 = variable not found, this is normal
    return null;
  }
}

/**
 * Detect Pushover credentials from both process.env and Windows registry.
 * process.env takes priority (more accurate for current session).
 * @returns {Promise<{token: string|null, user: string|null}>}
 */
async function detectPushoverFull() {
  const envResult = detectPushoverEnv();
  const token = envResult.token || await readRegistryEnvVar('PUSHOVER_TOKEN');
  const user = envResult.user || await readRegistryEnvVar('PUSHOVER_USER');
  return { token, user };
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
 * Configure Pushover through interactive prompts with dual-source detection.
 * Detects credentials in both process.env and Windows registry, then handles
 * four cases: both exist, only token, only user, neither.
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<{status: string, details: string}>}
 */
async function configurePushover(maxRetries = 3) {
  const currentEnv = await detectPushoverFull();

  // --- Case A: Both token AND user exist ---
  if (currentEnv.token && currentEnv.user) {
    console.log(chalk.green(t('pushover.alreadyConfigured')));
    console.log(chalk.gray(`  Token: ${currentEnv.token.substring(0, 8)}...`));
    console.log(chalk.gray(`  User: ${currentEnv.user.substring(0, 8)}...`));

    const keepPrompt = new Confirm({
      name: 'keepConfig',
      message: t('pushover.keepConfig'),
      initial: true
    });

    const shouldKeep = await keepPrompt.run();
    if (shouldKeep) {
      return { status: 'configured', details: 'already set' };
    }
    // User chose to re-enter -- fall through to "Configure Pushover?" prompt
  }

  // --- Case B: Only token exists ---
  if (currentEnv.token && !currentEnv.user) {
    console.log(chalk.green(t('pushover.partiallyConfigured')));
    console.log(chalk.gray(`  Token: ${currentEnv.token.substring(0, 8)}...`));

    let finalToken;
    const keepTokenPrompt = new Confirm({
      name: 'keepToken',
      message: t('pushover.keepToken', { value: currentEnv.token.substring(0, 8) + '...' }),
      initial: true
    });

    const shouldKeepToken = await keepTokenPrompt.run();
    if (shouldKeepToken) {
      finalToken = currentEnv.token;
    } else {
      const tokenPrompt = new Input({
        name: 'token',
        message: t('pushover.enterToken')
      });
      finalToken = await tokenPrompt.run();
    }

    // Prompt for missing user
    const userPrompt = new Input({
      name: 'user',
      message: t('pushover.promptUser')
    });
    const finalUser = await userPrompt.run();

    // Validate and save
    console.log(chalk.gray(t('pushover.validating')));
    const validation = await validatePushoverCredentials(finalToken, finalUser);

    if (!validation.valid) {
      console.log(chalk.red(t('pushover.validationFailed')));
      console.log(chalk.gray(`  -> ${validation.error}`));
      return { status: 'failed', details: validation.error };
    }

    console.log(chalk.gray(t('pushover.saving')));
    const tokenResult = await setEnvVariable('PUSHOVER_TOKEN', finalToken);
    if (!tokenResult.success) {
      console.log(chalk.red(t('pushover.saveFailed')));
      console.log(chalk.gray(t('guidance.pushoverManual')));
      return { status: 'failed', details: 'setx failed for token' };
    }

    const userResult = await setEnvVariable('PUSHOVER_USER', finalUser);
    if (!userResult.success) {
      console.log(chalk.red(t('pushover.saveFailed')));
      console.log(chalk.gray(t('guidance.pushoverManual')));
      return { status: 'failed', details: 'setx failed for user' };
    }

    process.env.PUSHOVER_TOKEN = finalToken;
    process.env.PUSHOVER_USER = finalUser;

    console.log(chalk.green(t('pushover.configured')));
    console.log(chalk.gray(t('pushover.currentSessionSet')));
    console.log(chalk.yellow(t('pushover.restartReminder')));
    return { status: 'configured', details: 'validated and saved' };
  }

  // --- Case C: Only user exists ---
  if (!currentEnv.token && currentEnv.user) {
    console.log(chalk.green(t('pushover.partiallyConfigured')));
    console.log(chalk.gray(`  User: ${currentEnv.user.substring(0, 8)}...`));

    let finalUser;
    const keepUserPrompt = new Confirm({
      name: 'keepUser',
      message: t('pushover.keepUser', { value: currentEnv.user.substring(0, 8) + '...' }),
      initial: true
    });

    const shouldKeepUser = await keepUserPrompt.run();
    if (shouldKeepUser) {
      finalUser = currentEnv.user;
    } else {
      const userPrompt = new Input({
        name: 'user',
        message: t('pushover.enterUser')
      });
      finalUser = await userPrompt.run();
    }

    // Prompt for missing token
    const tokenPrompt = new Input({
      name: 'token',
      message: t('pushover.promptToken')
    });
    const finalToken = await tokenPrompt.run();

    // Validate and save
    console.log(chalk.gray(t('pushover.validating')));
    const validation = await validatePushoverCredentials(finalToken, finalUser);

    if (!validation.valid) {
      console.log(chalk.red(t('pushover.validationFailed')));
      console.log(chalk.gray(`  -> ${validation.error}`));
      return { status: 'failed', details: validation.error };
    }

    console.log(chalk.gray(t('pushover.saving')));
    const tokenResult = await setEnvVariable('PUSHOVER_TOKEN', finalToken);
    if (!tokenResult.success) {
      console.log(chalk.red(t('pushover.saveFailed')));
      console.log(chalk.gray(t('guidance.pushoverManual')));
      return { status: 'failed', details: 'setx failed for token' };
    }

    const userResult = await setEnvVariable('PUSHOVER_USER', finalUser);
    if (!userResult.success) {
      console.log(chalk.red(t('pushover.saveFailed')));
      console.log(chalk.gray(t('guidance.pushoverManual')));
      return { status: 'failed', details: 'setx failed for user' };
    }

    process.env.PUSHOVER_TOKEN = finalToken;
    process.env.PUSHOVER_USER = finalUser;

    console.log(chalk.green(t('pushover.configured')));
    console.log(chalk.gray(t('pushover.currentSessionSet')));
    console.log(chalk.yellow(t('pushover.restartReminder')));
    return { status: 'configured', details: 'validated and saved' };
  }

  // --- Case D: Neither exists -- existing behavior ---
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

    // Set environment variables for current process (immediate effect)
    process.env.PUSHOVER_TOKEN = token;
    process.env.PUSHOVER_USER = user;

    // Success
    console.log(chalk.green(t('pushover.configured')));
    console.log(chalk.gray(t('pushover.currentSessionSet')));
    console.log(chalk.yellow(t('pushover.restartReminder')));
    return { status: 'configured', details: 'validated and saved' };
  }

  // Should not reach here, but just in case
  return { status: 'failed', details: 'max retries exceeded' };
}

module.exports = {
  detectPushoverEnv,
  readRegistryEnvVar,
  detectPushoverFull,
  setEnvVariable,
  validatePushoverCredentials,
  configurePushover
};
