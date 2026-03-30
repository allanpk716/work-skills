'use strict';

const { isPluginInstalled, getSkillsDir } = require('../marketplace/plugin-installer.js');
const { isHooksInstalled, isHooksRegistered, isCommandsInstalled, getHooksDir, getCommandsDir } = require('../hooks/hooks-installer.js');
const { readClaudeConfig, getConfigPath } = require('../marketplace/config-manager.js');
const { detectPushoverFull } = require('../configurators/pushover.js');

const PLUGIN_NAMES = ['claude-notify', 'windows-git-commit'];

/**
 * Detect all installed work-skills components.
 * Aggregates detection across 7 categories: plugins, hook scripts,
 * hook registration, slash commands, marketplace source, environment variables.
 * @returns {Promise<Object>} Structured detection results
 */
async function detectAllInstalled() {
  // Category 1: Plugins
  const plugins = PLUGIN_NAMES.map(name => ({
    name,
    installed: isPluginInstalled(name),
    path: `${getSkillsDir()}/${name}/SKILL.md`
  }));

  // Category 2: Hook Scripts
  const hooksScripts = {
    installed: isHooksInstalled(),
    path: getHooksDir()
  };

  // Category 3: Hook Registration
  const hooksRegistered = {
    installed: isHooksRegistered(),
    path: '~/.claude/settings.json'
  };

  // Category 4: Slash Commands
  const commandsInstalled = {
    installed: isCommandsInstalled(),
    path: getCommandsDir()
  };

  // Category 5: Marketplace Source
  const config = readClaudeConfig();
  const marketplaceSource = {
    installed: !!(config && config.marketplaceSources && config.marketplaceSources['work-skills']),
    path: getConfigPath()
  };

  // Category 6: Environment Variables (async - registry lookup)
  const pushoverCreds = await detectPushoverFull();
  const envVars = {
    token: { name: 'PUSHOVER_TOKEN', installed: !!pushoverCreds.token },
    user: { name: 'PUSHOVER_USER', installed: !!pushoverCreds.user }
  };

  // Aggregate: hasAnyInstalled
  const hasAnyInstalled =
    plugins.some(p => p.installed) ||
    hooksScripts.installed ||
    hooksRegistered.installed ||
    commandsInstalled.installed ||
    marketplaceSource.installed ||
    envVars.token.installed ||
    envVars.user.installed;

  return {
    plugins,
    hooksScripts,
    hooksRegistered,
    commandsInstalled,
    marketplaceSource,
    envVars,
    hasAnyInstalled
  };
}

module.exports = { detectAllInstalled };
