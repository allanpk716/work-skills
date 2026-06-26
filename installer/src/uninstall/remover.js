'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const execa = require('execa');

const {
  _readSettings,
  _writeSettings,
  _removeExistingNotifyHooks,
  getHooksDir,
  getCommandsDir
} = require('../hooks/hooks-installer.js');

const {
  readClaudeConfig,
  writeClaudeConfig
} = require('../marketplace/config-manager.js');

const {
  getSkillsDir
} = require('../marketplace/plugin-installer.js');

/**
 * Execute a single removal step with fault tolerance.
 * Never throws - all errors are caught and recorded.
 * @param {string} category - Category name for the result
 * @param {string} name - Step name for the result
 * @param {Function} fn - Async or sync function to execute
 * @param {boolean} shouldRun - Whether this step should execute
 * @returns {Promise<{category: string, name: string, status: string, detail: string}>}
 */
async function removeStep(category, name, fn, shouldRun) {
  if (!shouldRun) {
    return { category, name, status: 'skipped', detail: '' };
  }

  try {
    await fn();
    return { category, name, status: 'removed', detail: '' };
  } catch (error) {
    return { category, name, status: 'failed', detail: error.message };
  }
}

/**
 * Remove all installed work-skills components based on detection results.
 * Executes 7 removal steps in order with per-step fault tolerance:
 *   1. Hook Scripts (notify-stop.py, notify-attention.py)
 *   2. Hook Registration (settings.json entries)
 *   3. Slash Commands (.md files)
 *   4. Plugin Directories (claude-notify)
 *   5. Marketplace Cache (cache + marketplaces directories)
 *   6. Marketplace Source (config.json entry)
 *   7. Environment Variables (PUSHOVER_TOKEN, PUSHOVER_USER via registry)
 *
 * @param {Object} detectionResults - Output from detectAllInstalled()
 * @returns {Promise<Array<{category: string, name: string, status: string, detail: string}>>}
 */
async function removeAllComponents(detectionResults) {
  const results = [];

  // Step 1 - Hook Scripts: delete notify-stop.py and notify-attention.py
  results.push(await removeStep('Hook Scripts', 'Hook scripts', async () => {
    const hooksDir = getHooksDir();
    fs.rmSync(path.join(hooksDir, 'notify-stop.py'), { force: true });
    fs.rmSync(path.join(hooksDir, 'notify-attention.py'), { force: true });
  }, detectionResults.hooksScripts.installed));

  // Step 2 - Hook Registration: remove from settings.json
  results.push(await removeStep('Hook Registration', 'Hook registration', async () => {
    const settings = _readSettings();
    const cleaned = _removeExistingNotifyHooks(settings);
    _writeSettings(cleaned);
  }, detectionResults.hooksRegistered.installed));

  // Step 3 - Slash Commands: delete 4 .md files
  results.push(await removeStep('Slash Commands', 'Slash commands', async () => {
    const commandsDir = getCommandsDir();
    const commandFiles = ['notify-enable.md', 'notify-disable.md', 'notify-status.md', 'check-notify-env.md'];
    for (const file of commandFiles) {
      fs.rmSync(path.join(commandsDir, file), { force: true });
    }
  }, detectionResults.commandsInstalled.installed));

  // Step 4 - Plugin Directories: delete each installed plugin directory
  for (const plugin of detectionResults.plugins) {
    results.push(await removeStep('Plugins', plugin.name, async () => {
      const pluginPath = path.join(getSkillsDir(), plugin.name);
      fs.rmSync(pluginPath, { recursive: true, force: true });
    }, plugin.installed));
  }

  // Step 5 - Marketplace Cache: delete cache/work-skills and marketplaces/work-skills
  results.push(await removeStep('Marketplace Cache', 'Marketplace cache', async () => {
    const cacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'work-skills');
    const marketplacesDir = path.join(os.homedir(), '.claude', 'plugins', 'marketplaces', 'work-skills');

    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
    if (fs.existsSync(marketplacesDir)) {
      fs.rmSync(marketplacesDir, { recursive: true, force: true });
    }
  }, detectionResults.marketplaceSource.installed));

  // Step 6 - Marketplace Source: remove from config.json
  results.push(await removeStep('Marketplace Source', 'Marketplace source', async () => {
    const config = readClaudeConfig();
    if (config.marketplaceSources && config.marketplaceSources['work-skills']) {
      delete config.marketplaceSources['work-skills'];
    }
    writeClaudeConfig(config);
  }, detectionResults.marketplaceSource.installed));

  // Step 7 - Environment Variables: delete via Windows registry
  for (const key of ['token', 'user']) {
    const envVar = detectionResults.envVars[key];
    results.push(await removeStep('Environment Variables', envVar.name, async () => {
      await execa('reg', ['delete', 'HKCU\\Environment', '/v', envVar.name, '/f']);
    }, envVar.installed));
  }

  return results;
}

module.exports = { removeAllComponents };
