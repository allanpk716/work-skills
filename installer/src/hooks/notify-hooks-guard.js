#!/usr/bin/env node
// notify-hooks-guard: Auto-repair notification hooks at session start
// Checks if Stop/Notification hooks are registered, repairs if missing
// Registered as SessionStart hook - runs once per session

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const SETTINGS_PATH = path.join(HOME, '.claude', 'settings.json');
const HOOKS_DIR = path.join(HOME, '.claude', 'hooks');

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

try {
  // Check if all notification scripts exist on disk
  for (const def of Object.values(HOOK_DEFINITIONS)) {
    if (!fs.existsSync(path.join(HOOKS_DIR, def.scriptFile))) {
      // Scripts not installed - cannot repair, skip silently
      process.exit(0);
    }
  }

  // Read settings
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch {
    process.exit(0);
  }

  if (!settings.hooks) settings.hooks = {};

  let repaired = false;

  for (const [eventName, def] of Object.entries(HOOK_DEFINITIONS)) {
    const entries = settings.hooks[eventName] || [];
    const exists = entries.some(
      e => e.hooks && e.hooks.some(h => (h.command || '').includes(def.scriptFile))
    );

    if (!exists) {
      const scriptPath = path.join(HOOKS_DIR, def.scriptFile).replace(/\\/g, '/');
      settings.hooks[eventName] = entries;
      settings.hooks[eventName].push({
        matcher: def.matcher,
        hooks: [{
          type: 'command',
          command: `python "${scriptPath}"`,
          async: def.async,
          timeout: def.timeout
        }]
      });
      repaired = true;
    }
  }

  if (repaired) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  }
} catch {
  // Silent failure - guard should never break session startup
}
