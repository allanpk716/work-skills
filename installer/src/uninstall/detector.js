'use strict';

const { isPluginInstalled, getSkillsDir } = require('./paths.js');
const { isHooksInstalled, isHooksRegistered, isCommandsInstalled, getHooksDir, getCommandsDir } = require('../hooks/hooks-installer.js');
const { detectPushoverFull } = require('../configurators/pushover.js');

const PLUGIN_NAMES = ['claude-notify'];

/**
 * Detect all installed claude-notify components.
 * Aggregates detection across 5 categories: plugins, hook scripts,
 * hook registration, slash commands, environment variables.
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

  // Category 5: Environment Variables (async - registry lookup)
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
    envVars.token.installed ||
    envVars.user.installed;

  return {
    plugins,
    hooksScripts,
    hooksRegistered,
    commandsInstalled,
    envVars,
    hasAnyInstalled
  };
}

module.exports = { detectAllInstalled };
