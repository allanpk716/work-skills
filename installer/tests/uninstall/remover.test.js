'use strict';

// Mock ALL external dependencies (Phase 54: paths.js provides getSkillsDir)
jest.mock('fs', () => ({
  rmSync: jest.fn(),
  existsSync: jest.fn()
}));

jest.mock('execa', () => jest.fn());

jest.mock('../../src/hooks/hooks-installer.js', () => ({
  _readSettings: jest.fn(),
  _writeSettings: jest.fn(),
  _removeExistingNotifyHooks: jest.fn(),
  getHooksDir: jest.fn(() => 'C:/Users/test/.claude/hooks'),
  getCommandsDir: jest.fn(() => 'C:/Users/test/.claude/commands')
}));

jest.mock('../../src/uninstall/paths.js', () => ({
  getSkillsDir: jest.fn(() => 'C:/Users/test/.claude/skills'),
  isPluginInstalled: jest.fn()
}));

const fs = require('fs');
const execa = require('execa');
const { _readSettings, _writeSettings, _removeExistingNotifyHooks, getHooksDir, getCommandsDir } = require('../../src/hooks/hooks-installer.js');
const { getSkillsDir } = require('../../src/uninstall/paths.js');
const { removeAllComponents } = require('../../src/uninstall/remover.js');

// Helper: all components installed (Phase 54: single plugin claude-notify)
function makeAllInstalledResults() {
  return {
    plugins: [
      { name: 'claude-notify', installed: true, path: 'C:/Users/test/.claude/skills/claude-notify/SKILL.md' }
    ],
    hooksScripts: { installed: true, path: 'C:/Users/test/.claude/hooks' },
    hooksRegistered: { installed: true, path: '~/.claude/settings.json' },
    commandsInstalled: { installed: true, path: 'C:/Users/test/.claude/commands' },
    envVars: {
      token: { name: 'PUSHOVER_TOKEN', installed: true },
      user: { name: 'PUSHOVER_USER', installed: true }
    },
    hasAnyInstalled: true
  };
}

// Helper: nothing installed (Phase 54: single plugin claude-notify)
function makeNothingInstalledResults() {
  return {
    plugins: [
      { name: 'claude-notify', installed: false, path: 'C:/Users/test/.claude/skills/claude-notify/SKILL.md' }
    ],
    hooksScripts: { installed: false, path: 'C:/Users/test/.claude/hooks' },
    hooksRegistered: { installed: false, path: '~/.claude/settings.json' },
    commandsInstalled: { installed: false, path: 'C:/Users/test/.claude/commands' },
    envVars: {
      token: { name: 'PUSHOVER_TOKEN', installed: false },
      user: { name: 'PUSHOVER_USER', installed: false }
    },
    hasAnyInstalled: false
  };
}

describe('Remover - removeAllComponents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('with all-installed detection results calls all 5 removal steps and returns results for each', async () => {
    const results = makeAllInstalledResults();
    _readSettings.mockReturnValue({ hooks: {} });
    _removeExistingNotifyHooks.mockReturnValue({ hooks: {} });

    const removalResults = await removeAllComponents(results);

    // 5 removal steps with 1 plugin + 2 envVars = 6 entries:
    // 1 hookScripts + 1 hookReg + 1 commands + 1 plugin (claude-notify) + 2 envVars (token, user) = 6
    expect(removalResults.length).toBe(6);

    // All should be removed (not failed or skipped)
    const removedCount = removalResults.filter(r => r.status === 'removed').length;
    expect(removedCount).toBe(6);

    // Verify fs.rmSync was called for hook scripts
    expect(fs.rmSync).toHaveBeenCalled();

    // Verify env var deletion was called
    expect(execa).toHaveBeenCalledTimes(2);
  });

  test('with nothing-installed detection results returns all-skipped results', async () => {
    const results = makeNothingInstalledResults();

    const removalResults = await removeAllComponents(results);

    // All should be skipped: 1 hookScripts + 1 hookReg + 1 commands + 1 plugin + 2 envVars = 6
    expect(removalResults.length).toBe(6);
    const skippedCount = removalResults.filter(r => r.status === 'skipped').length;
    expect(skippedCount).toBe(6);

    // No actual removal should be attempted
    expect(fs.rmSync).not.toHaveBeenCalled();
    expect(execa).not.toHaveBeenCalled();
    expect(_readSettings).not.toHaveBeenCalled();
  });

  test('with partial installation returns correct removed/skipped mix', async () => {
    const results = {
      plugins: [
        { name: 'claude-notify', installed: true, path: 'path1' }
      ],
      hooksScripts: { installed: true, path: 'hooks' },
      hooksRegistered: { installed: false, path: 'settings' },
      commandsInstalled: { installed: false, path: 'commands' },
      envVars: {
        token: { name: 'PUSHOVER_TOKEN', installed: true },
        user: { name: 'PUSHOVER_USER', installed: false }
      },
      hasAnyInstalled: true
    };

    _readSettings.mockReturnValue({ hooks: {} });
    _removeExistingNotifyHooks.mockReturnValue({ hooks: {} });

    const removalResults = await removeAllComponents(results);

    const removedItems = removalResults.filter(r => r.status === 'removed');
    const skippedItems = removalResults.filter(r => r.status === 'skipped');

    // claude-notify(removed) + hooksScripts(removed) + token(removed) = 3 removed
    // hooksRegistered(skipped) + commands(skipped) + user(skipped) = 3 skipped
    expect(removedItems.length).toBe(3);
    expect(skippedItems.length).toBe(3);
  });

  test('when hook script removal fails, remaining steps continue and failure is recorded', async () => {
    const results = makeAllInstalledResults();
    // Make fs.rmSync throw on the first call (hook scripts)
    fs.rmSync.mockImplementationOnce(() => { throw new Error('Permission denied'); });

    _readSettings.mockReturnValue({ hooks: {} });
    _removeExistingNotifyHooks.mockReturnValue({ hooks: {} });

    const removalResults = await removeAllComponents(results);

    // Hook scripts should have failed
    const hookScriptResult = removalResults.find(r => r.name === 'Hook scripts');
    expect(hookScriptResult).toBeDefined();
    expect(hookScriptResult.status).toBe('failed');
    expect(hookScriptResult.detail).toContain('Permission denied');

    // Other steps should still have executed
    const removedCount = removalResults.filter(r => r.status === 'removed').length;
    expect(removedCount).toBeGreaterThan(0);
  });

  test('when registry deletion fails, failure is recorded with error message', async () => {
    const results = makeAllInstalledResults();
    fs.rmSync.mockImplementation(() => {});
    _readSettings.mockReturnValue({ hooks: {} });
    _removeExistingNotifyHooks.mockReturnValue({ hooks: {} });
    execa.mockRejectedValue(new Error('Registry access denied'));

    const removalResults = await removeAllComponents(results);

    const failedEnvVars = removalResults.filter(r => r.status === 'failed' && r.category === 'Environment Variables');
    expect(failedEnvVars.length).toBe(2);
    expect(failedEnvVars[0].detail).toContain('Registry access denied');
  });

  test('hook registration removal calls _readSettings, _removeExistingNotifyHooks, _writeSettings', async () => {
    const results = makeAllInstalledResults();
    const mockSettings = { hooks: { Stop: [{ hooks: [{ command: 'python "notify-stop.py"' }] }] } };
    const cleanedSettings = { hooks: {} };
    _readSettings.mockReturnValue(mockSettings);
    _removeExistingNotifyHooks.mockReturnValue(cleanedSettings);

    await removeAllComponents(results);

    expect(_readSettings).toHaveBeenCalledTimes(1);
    expect(_removeExistingNotifyHooks).toHaveBeenCalledWith(mockSettings);
    expect(_writeSettings).toHaveBeenCalledWith(cleanedSettings);
  });

  test('plugin directory removal calls fs.rmSync with recursive:true, force:true for each installed plugin', async () => {
    const results = makeAllInstalledResults();
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});

    await removeAllComponents(results);

    // Check that rmSync was called with recursive:true, force:true for plugin directories
    const pluginCalls = fs.rmSync.mock.calls.filter(call => {
      const path = call[0];
      return path && path.includes('claude-notify');
    });

    expect(pluginCalls.length).toBe(1);
    for (const call of pluginCalls) {
      expect(call[1]).toEqual(expect.objectContaining({ recursive: true, force: true }));
    }
  });

  test('env var removal calls execa with correct reg delete arguments', async () => {
    const results = makeAllInstalledResults();
    fs.rmSync.mockImplementation(() => {});
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});

    await removeAllComponents(results);

    expect(execa).toHaveBeenCalledTimes(2);
    expect(execa).toHaveBeenCalledWith('reg', ['delete', 'HKCU\\Environment', '/v', 'PUSHOVER_TOKEN', '/f']);
    expect(execa).toHaveBeenCalledWith('reg', ['delete', 'HKCU\\Environment', '/v', 'PUSHOVER_USER', '/f']);
  });

  test('slash command removal deletes all 4 command .md files from commands directory', async () => {
    const results = makeAllInstalledResults();
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});

    await removeAllComponents(results);

    const commandFiles = ['notify-enable.md', 'notify-disable.md', 'notify-status.md', 'check-notify-env.md'];
    const commandsDir = getCommandsDir();

    for (const file of commandFiles) {
      expect(fs.rmSync).toHaveBeenCalledWith(
        expect.stringContaining(file),
        expect.objectContaining({ force: true })
      );
    }
  });
});
