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
  { source: 'notify-attention.py', target: 'notify-attention.py' },
  { source: 'flags.py', target: 'flags.py' }
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
 * Checks: marketplace cache -> skills dir -> local plugin dir (dev mode) -> deployed hooks
 * @returns {string|null} Path to the directory containing the hook scripts
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

  // Check standard locations with hooks/scripts/ subdirectory
  for (const baseDir of candidates) {
    const scriptsDir = path.join(baseDir, 'hooks', 'scripts');
    const notifyPy = path.join(scriptsDir, 'notify.py');
    if (fs.existsSync(notifyPy)) {
      return scriptsDir;
    }
  }

  // 4. Fallback: already deployed hooks directory (scripts already in target location)
  // When source scripts were cleaned up but hooks are already deployed, reuse them
  const deployedDir = getHooksDir();
  const deployedNotifyStop = path.join(deployedDir, 'notify-stop.py');
  if (fs.existsSync(deployedNotifyStop)) {
    return deployedDir;
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
 * Clean up stale marketplace hooks that would cause duplicate notifications.
 * Removes hooks.json from both the plugin cache and the skills directory,
 * since Claude Code loads hooks from all these locations independently.
 */
function cleanMarketplaceCache() {
  const locations = [
    // Plugin cache (marketplace installed plugins)
    path.join(os.homedir(), '.claude', 'plugins', 'cache', 'work-skills', 'claude-notify'),
    // Marketplace directory (plugin registry)
    path.join(os.homedir(), '.claude', 'plugins', 'marketplaces', 'work-skills', 'plugins', 'claude-notify')
    // NOTE: skills directory is NOT cleaned here - preserving hooks/scripts/ as source
    // for subsequent installer runs (findScriptsSourceDir checks this location)
  ];

  for (const baseDir of locations) {
    if (!fs.existsSync(baseDir)) continue;

    // Find version subdirectories (e.g., 1.0.2/) or handle flat structure
    const entries = fs.statSync(baseDir).isDirectory() ? fs.readdirSync(baseDir) : [];
    const dirs = entries.filter(e => {
      const fullPath = path.join(baseDir, e);
      return fs.statSync(fullPath).isDirectory();
    });

    // Check both version subdirectories and the base directory itself
    const checkDirs = dirs.length > 0
      ? dirs.map(d => path.join(baseDir, d))
      : [baseDir];

    for (const dir of checkDirs) {
      const hooksDir = path.join(dir, 'hooks');
      if (fs.existsSync(hooksDir)) {
        fs.rmSync(hooksDir, { recursive: true, force: true });
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

    // Determine if source is the deployed hooks directory itself (fallback scenario)
    const hooksDir = getHooksDir();
    const alreadyDeployed = (sourceDir === hooksDir);

    let copied = [];

    if (alreadyDeployed) {
      // Scripts are already in the target location, no need to copy
      copied = SCRIPT_MAPPINGS
        .filter(({ target }) => fs.existsSync(path.join(hooksDir, target)))
        .map(({ target }) => target);
    } else {
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
      copied = copyResult.copied;
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
      copied
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
 * Check if global hooks are already registered in settings.json.
 * Does NOT check script content - scripts are always re-copied on install.
 * @returns {boolean}
 */
function isHooksRegistered() {
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

/**
 * Check if hook scripts exist on disk (regardless of settings.json registration).
 * @returns {boolean}
 */
function isHooksInstalled() {
  const hooksDir = getHooksDir();
  return SCRIPT_MAPPINGS.every(
    ({ target }) => fs.existsSync(path.join(hooksDir, target))
  );
}

/**
 * Get the global commands directory path
 * @returns {string} ~/.claude/commands/
 */
function getCommandsDir() {
  return path.join(os.homedir(), '.claude', 'commands');
}

/**
 * Get the installed scripts directory path (after plugin installation)
 * @returns {string} ~/.claude/skills/claude-notify/scripts/
 */
function getScriptsInstallDir() {
  return path.join(os.homedir(), '.claude', 'skills', 'claude-notify', 'scripts');
}

/**
 * Command template definitions for global installation.
 * Each template has a getContent(scriptsDir) function that returns the .md file content.
 */
const COMMAND_TEMPLATES = [
  {
    name: 'notify-enable',
    description: 'Enable a notification channel (pushover or windows)',
    getContent: (scriptsDir) => `---
name: notify-enable
description: Enable a notification channel (pushover or windows) by removing the .no-{channel} flag file
---

Enable the specified notification channel for this project.

**Argument:** $ARGUMENTS

<process>
1. Parse the argument - must be either \`pushover\` or \`windows\`
2. Run the enable script:
   \`\`\`bash
   python "${scriptsDir}/notify-enable.py" <pushover|windows>
   \`\`\`
3. Report the result to the user
</process>

<rules>
- If no argument provided, ask user to specify: \`pushover\` or \`windows\`
- If invalid argument, show valid options and ask again
- The script is idempotent - enabling an already-enabled channel shows "already enabled"
</rules>`
  },
  {
    name: 'notify-disable',
    description: 'Disable a notification channel (pushover or windows)',
    getContent: (scriptsDir) => `---
name: notify-disable
description: Disable a notification channel (pushover or windows) by creating the .no-{channel} flag file
---

Disable the specified notification channel for this project.

**Argument:** $ARGUMENTS

<process>
1. Parse the argument - must be either \`pushover\` or \`windows\`
2. Run the disable script:
   \`\`\`bash
   python "${scriptsDir}/notify-disable.py" <pushover|windows>
   \`\`\`
3. Report the result to the user
</process>

<rules>
- If no argument provided, ask user to specify: \`pushover\` or \`windows\`
- If invalid argument, show valid options and ask again
- The script is idempotent - disabling an already-disabled channel shows "already disabled"
</rules>`
  },
  {
    name: 'notify-status',
    description: 'Show the current status of all notification channels',
    getContent: (scriptsDir) => `---
name: notify-status
description: Show the current status of all notification channels (pushover and windows)
---

Show the current enable/disable status of all notification channels for this project.

<process>
1. Run the status script:
   \`\`\`bash
   python "${scriptsDir}/notify-status.py"
   \`\`\`
2. Display the output to the user
3. If any channel is disabled, remind the user they can re-enable with \`/notify-enable <channel>\`
</process>`
  },
  {
    name: 'check-notify-env',
    description: 'Check claude-notify plugin runtime environment',
    getContent: () => `---
name: check-notify-env
description: Check claude-notify plugin runtime environment requirements
---

<objective>
Systematically check the claude-notify plugin runtime environment configuration, including Python environment, dependencies, environment variables, and hooks configuration.

This helps users quickly verify on new machines whether notification functionality will work properly.
</objective>

<process>
1. **Check Python Environment**
   - Verify Python is installed
   - Check Python version

2. **Check Python Dependencies**
   - Verify \`requests\` package is installed
   - If missing, provide installation command

3. **Check Environment Variables**
   - Verify \`PUSHOVER_TOKEN\` is configured
   - Verify \`PUSHOVER_USER\` is configured
   - If missing, prompt user to configure

4. **Check Global Hooks Configuration**
   - Read \`~/.claude/settings.json\` hooks section
   - Verify \`Stop\` hook contains \`notify-stop.py\`
   - Verify \`Notification\` hook contains \`notify-attention.py\`
   - Check \`~/.claude/hooks/notify-stop.py\` and \`~/.claude/hooks/notify-attention.py\` exist
   - If missing, prompt user to run npx install command

5. **Generate Diagnostic Report**
   - List all check item statuses
   - For failures, provide specific fix steps
   - Give overall assessment: environment ready or not
</process>

<success_criteria>
- All check items executed and status reported
- Clear fix guidance for each issue
- Complete diagnostic report generated
</success_criteria>`
  }
];

/**
 * Install slash command files to ~/.claude/commands/
 * Called by the npx installer pipeline after plugin installation.
 * @param {Object} options - {onProgress: function}
 * @returns {{success: boolean, installed: string[], error?: string}}
 */
function installCommands(options = {}) {
  try {
    const commandsDir = getCommandsDir();
    fs.mkdirSync(commandsDir, { recursive: true });

    // Resolve scripts directory with forward slashes
    const scriptsDir = getScriptsInstallDir().replace(/\\/g, '/');
    const installed = [];

    for (const tmpl of COMMAND_TEMPLATES) {
      if (options.onProgress) options.onProgress('writing', tmpl.name);
      const content = tmpl.getContent(scriptsDir);
      const filePath = path.join(commandsDir, `${tmpl.name}.md`);
      fs.writeFileSync(filePath, content, 'utf8');
      installed.push(tmpl.name);
    }

    return { success: true, installed };
  } catch (error) {
    return { success: false, installed: [], error: error.message };
  }
}

/**
 * Check if global commands are already installed
 * @returns {boolean}
 */
function isCommandsInstalled() {
  const commandsDir = getCommandsDir();
  return COMMAND_TEMPLATES.every(
    tmpl => fs.existsSync(path.join(commandsDir, `${tmpl.name}.md`))
  );
}

module.exports = {
  getHooksDir,
  getSettingsPath,
  findScriptsSourceDir,
  installHooks,
  isHooksInstalled,
  isHooksRegistered,
  cleanMarketplaceCache,
  installCommands,
  isCommandsInstalled,
  // Exported for testing
  _removeExistingNotifyHooks: removeExistingNotifyHooks,
  _registerGlobalHooks: registerGlobalHooks,
  _readSettings: readSettings,
  _writeSettings: writeSettings
};
