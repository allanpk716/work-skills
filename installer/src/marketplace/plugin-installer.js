'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const execa = require('execa');

/**
 * GitHub repository URL for work-skills
 */
const REPO_URL = 'https://github.com/allanpk716/work-skills.git';

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

/**
 * Install a single plugin
 * @param {Object} plugin - Plugin object {name, version, source}
 * @param {Object} options - Options {tempDir, onProgress}
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
async function installPlugin(plugin, options = {}) {
  let tempDir = null;

  try {
    // Create temporary directory for cloning
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'work-skills-'));

    // Notify progress
    if (options.onProgress) {
      options.onProgress(plugin, 'cloning');
    }

    // Clone repository with depth 1 (shallow clone)
    await execa('git', ['clone', '--depth', '1', REPO_URL, tempDir]);

    if (options.onProgress) {
      options.onProgress(plugin, 'copying');
    }

    // Source and target paths
    const sourcePath = path.join(tempDir, plugin.source.replace('./', ''));
    const targetPath = path.join(getSkillsDir(), plugin.name);

    // Ensure target directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Copy plugin directory to skills directory
    fs.cpSync(sourcePath, targetPath, { recursive: true });

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (options.onProgress) {
      options.onProgress(plugin, 'installed');
    }

    return {
      success: true,
      path: targetPath
    };
  } catch (error) {
    // Clean up on error
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Install multiple plugins
 * @param {Array} plugins - Array of plugin objects {name, version, source}
 * @param {Object} options - Options {onProgress}
 * @returns {Promise<{installed: Array, skipped: Array, failed: Array}>}
 */
async function installPlugins(plugins, options = {}) {
  const result = {
    installed: [],
    skipped: [],
    failed: []
  };

  for (const plugin of plugins) {
    // Check if already installed
    if (isPluginInstalled(plugin.name)) {
      result.skipped.push({
        name: plugin.name,
        version: plugin.version
      });
      continue;
    }

    // Install plugin
    const installResult = await installPlugin(plugin, options);

    if (installResult.success) {
      result.installed.push({
        name: plugin.name,
        version: plugin.version,
        path: installResult.path
      });
    } else {
      result.failed.push({
        name: plugin.name,
        version: plugin.version,
        error: installResult.error
      });
    }
  }

  return result;
}

module.exports = {
  REPO_URL,
  getSkillsDir,
  isPluginInstalled,
  installPlugin,
  installPlugins
};
