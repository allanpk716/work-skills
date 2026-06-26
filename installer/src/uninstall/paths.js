'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Path helpers shared by the uninstall subsystem.
 *
 * These two helpers were migrated from the removed marketplace/plugin-installer.js
 * (Phase 54 trim). Only the helpers actually consumed by uninstall/ are migrated
 * here; the marketplace config helpers (readClaudeConfig/writeClaudeConfig/
 * getConfigPath) had zero consumers after the marketplace removal and are NOT
 * migrated to avoid dead exports.
 */

/**
 * Get Claude Code skills directory path
 * @returns {string} Path to ~/.claude/skills
 */
function getSkillsDir() {
  return path.join(os.homedir(), '.claude', 'skills');
}

/**
 * Check if a plugin is already installed
 * @param {string} pluginName - Name of the plugin
 * @returns {boolean} True if SKILL.md exists in plugin directory
 */
function isPluginInstalled(pluginName) {
  const skillPath = path.join(getSkillsDir(), pluginName, 'SKILL.md');
  return fs.existsSync(skillPath);
}

module.exports = {
  getSkillsDir,
  isPluginInstalled
};
