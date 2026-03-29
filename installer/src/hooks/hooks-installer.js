'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Claude Code notification hook scripts installer.
 * Copies notification Python scripts to ~/.claude/hooks/ and registers
 * them as global hooks in ~/.claude/settings.json, following the GSD pattern.
 */

// Script file mappings: source name -> target name
const SCRIPT_MAPPINGS = [
  { source: 'notify.py', target: 'notify-stop.py' },
  { source: 'notify-attention.py', target: 'notify-attention.py' }
];

// Hook definitions
const HOOK_DEFINITIONS = {
  Stop: {
    matcher: '*',
    scriptFile: 'notify-stop.py',
    async: true,
    timeout: 10
  },
  Notification: {
    matcher: 'permission_prompt|idle_prompt|elicitation_dialog',
    scriptFile: 'notify-attention.py',
    async: true,
    timeout: 5
  }
};

/**
 * Get the global hooks directory path
 * @returns {string} ~/.claude/hooks/
 */
function getHooksDir() {
  return path.join(os.homedir(), '.claude', 'hooks');
}

/**
 * Get settings.json path
 * @returns {string}
 */
function getSettingsPath() {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

/**
 * Read settings.json
 * @returns {Object}
 */
function readSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Write settings.json with formatting
 * @param {Object} settings
 */
function writeSettings(settings) {
  const settingsPath = getSettingsPath();
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

/**
 * Find the source scripts directory.
 * Checks: marketplace cache -> skills dir -> local plugin dir (dev mode)
 * @returns {string|null} Path to the hooks/scripts/ directory containing notify.py
 */
function findScriptsSourceDir() {
  const candidates = [
    // 1. Marketplace plugin cache
    path.join(os.homedir(), '.claude', 'plugins', 'cache', 'work-skills', 'claude-notify'),
    // 2. Skills directory (npx installer target)
    path.join(os.homedir(), '.claude', 'skills', 'claude-notify'),
    // 3. Local plugin directory (development mode)
    path.join(process.cwd(), 'plugins', 'claude-notify')
  ];

  for (const baseDir of candidates) {
    const scriptsDir = path.join(baseDir, 'hooks', 'scripts');
    const notifyPy = path.join(scriptsDir, 'notify.py');
    if (fs.existsSync(notifyPy)) {
      return scriptsDir;
    }
  }

  return null;
}

/**
 * Copy notification scripts to ~/.claude/hooks/
 * @param {string} sourceDir - Source scripts directory
 * @returns {{copied: string[], skipped: string[]}}
 */
function copyScripts(sourceDir) {
  const hooksDir = getHooksDir();
  fs.mkdirSync(hooksDir, { recursive: true });

  const result = { copied: [], skipped: [] };

  for (const { source, target } of SCRIPT_MAPPINGS) {
    const src = path.join(sourceDir, source);
    const dest = path.join(hooksDir, target);

    if (!fs.existsSync(src)) {
      result.skipped.push(source);
      continue;
    }

    fs.copyFileSync(src, dest);
    result.copied.push(target);
  }

  return result;
}

/**
 * Remove existing claude-notify hook entries from settings (idempotent)
 * @param {Object} settings
 * @returns {Object} Cleaned settings
 */
function removeExistingNotifyHooks(settings) {
  if (!settings.hooks) return settings;

  for (const eventName of Object.keys(settings.hooks)) {
    const entries = settings.hooks[eventName];
    if (!Array.isArray(entries)) continue;

    settings.hooks[eventName] = entries.map(entry => {
      if (!entry.hooks || !Array.isArray(entry.hooks)) return entry;
      entry.hooks = entry.hooks.filter(hook => {
        const cmd = hook.command || '';
        return !cmd.includes('notify-stop.py') && !cmd.includes('notify-attention.py');
      });
      // Remove entry if no hooks remain
      return entry;
    }).filter(entry => entry.hooks && entry.hooks.length > 0);

    // Remove empty event arrays
    if (settings.hooks[eventName].length === 0) {
      delete settings.hooks[eventName];
    }
  }

  return settings;
}

/**
 * Register global hooks in settings.json
 * @param {Object} settings
 * @returns {Object} Updated settings
 */
function registerGlobalHooks(settings) {
  if (!settings.hooks) {
    settings.hooks = {};
  }

  const hooksDir = getHooksDir();
  // Use forward slashes for consistency with GSD hooks
  const hooksDirForward = hooksDir.replace(/\\/g, '/');

  for (const [eventName, def] of Object.entries(HOOK_DEFINITIONS)) {
    const scriptPath = `${hooksDirForward}/${def.scriptFile}`;

    settings.hooks[eventName] = settings.hooks[eventName] || [];

    settings.hooks[eventName].push({
      matcher: def.matcher,
      hooks: [{
        type: 'command',
        command: `python "${scriptPath}"`,
        async: def.async,
        timeout: def.timeout
      }]
    });
  }

  return settings;
}

/**
 * Clean up marketplace plugin cache for claude-notify
 * Removes hooks.json from cache to prevent double-loading
 */
function cleanMarketplaceCache() {
  const cacheBase = path.join(
    os.homedir(), '.claude', 'plugins', 'cache', 'work-skills', 'claude-notify'
  );

  if (!fs.existsSync(cacheBase)) return;

  // Find version subdirectories (e.g., 1.0.2/)
  const entries = fs.readdirSync(cacheBase);
  for (const entry of entries) {
    const versionDir = path.join(cacheBase, entry);
    if (fs.statSync(versionDir).isDirectory()) {
      const hooksCacheDir = path.join(versionDir, 'hooks');
      if (fs.existsSync(hooksCacheDir)) {
        fs.rmSync(hooksCacheDir, { recursive: true, force: true });
      }
    }
  }
}

/**
 * Install notification hooks globally.
 * Called by the npx installer pipeline.
 * @param {Object} options - {onProgress: function}
 * @returns {{success: boolean, copied: string[], error?: string}}
 */
function installHooks(options = {}) {
  try {
    // Step 1: Find source scripts
    if (options.onProgress) options.onProgress('locating');
    const sourceDir = findScriptsSourceDir();

    if (!sourceDir) {
      return {
        success: false,
        copied: [],
        error: 'Notification scripts not found. Install claude-notify plugin first.'
      };
    }

    // Step 2: Copy scripts to ~/.claude/hooks/
    if (options.onProgress) options.onProgress('copying');
    const copyResult = copyScripts(sourceDir);

    if (copyResult.copied.length === 0) {
      return {
        success: false,
        copied: [],
        error: 'No notification scripts were copied.'
      };
    }

    // Step 3: Update settings.json (remove old + add new = idempotent)
    if (options.onProgress) options.onProgress('registering');
    let settings = readSettings();
    settings = removeExistingNotifyHooks(settings);
    settings = registerGlobalHooks(settings);
    writeSettings(settings);

    // Step 4: Clean marketplace cache to prevent double-loading
    if (options.onProgress) options.onProgress('cleaning');
    cleanMarketplaceCache();

    return {
      success: true,
      copied: copyResult.copied
    };
  } catch (error) {
    return {
      success: false,
      copied: [],
      error: error.message
    };
  }
}

/**
 * Check if global hooks are already registered
 * @returns {boolean}
 */
function isHooksInstalled() {
  const hooksDir = getHooksDir();
  const hasScripts = SCRIPT_MAPPINGS.every(
    ({ target }) => fs.existsSync(path.join(hooksDir, target))
  );

  if (!hasScripts) return false;

  const settings = readSettings();
  if (!settings.hooks) return false;

  const stopEntry = (settings.hooks.Stop || []).find(
    e => e.hooks && e.hooks.some(h => (h.command || '').includes('notify-stop.py'))
  );
  const notifyEntry = (settings.hooks.Notification || []).find(
    e => e.hooks && e.hooks.some(h => (h.command || '').includes('notify-attention.py'))
  );

  return !!(stopEntry && notifyEntry);
}

module.exports = {
  getHooksDir,
  getSettingsPath,
  findScriptsSourceDir,
  installHooks,
  isHooksInstalled,
  cleanMarketplaceCache,
  // Exported for testing
  _removeExistingNotifyHooks: removeExistingNotifyHooks,
  _registerGlobalHooks: registerGlobalHooks,
  _readSettings: readSettings,
  _writeSettings: writeSettings
};
