'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Get Claude Code config.json path
 * @returns {string} Full path to config.json
 */
function getConfigPath() {
  return path.join(os.homedir(), '.claude', 'config.json');
}

/**
 * Read Claude Code configuration
 * @returns {Object} Parsed config object (empty object if file missing or invalid)
 */
function readClaudeConfig() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    // Parse error or read error - return empty config
    return {};
  }
}

/**
 * Write Claude Code configuration
 * @param {Object} config - Configuration object to write
 */
function writeClaudeConfig(config) {
  const configPath = getConfigPath();

  // Ensure directory exists
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  // Write formatted JSON
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Register work-skills as a marketplace source in Claude Code config
 * @returns {{success: boolean, path: string, error?: string}}
 */
function registerMarketplaceSource() {
  try {
    const config = readClaudeConfig();

    // Ensure marketplaceSources object exists
    config.marketplaceSources = config.marketplaceSources || {};

    // Add work-skills entry
    config.marketplaceSources['work-skills'] = {
      type: 'github',
      url: 'https://github.com/allanpk716/work-skills',
      branch: 'main'
    };

    writeClaudeConfig(config);

    return {
      success: true,
      path: getConfigPath()
    };
  } catch (error) {
    return {
      success: false,
      path: getConfigPath(),
      error: error.message
    };
  }
}

module.exports = {
  getConfigPath,
  readClaudeConfig,
  writeClaudeConfig,
  registerMarketplaceSource
};
