'use strict';

// Mock ALL external dependencies
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

jest.mock('../../src/marketplace/config-manager.js', () => ({
  readClaudeConfig: jest.fn(),
  writeClaudeConfig: jest.fn()
}));

jest.mock('../../src/marketplace/plugin-installer.js', () => ({
  getSkillsDir: jest.fn(() => 'C:/Users/test/.claude/skills')
}));

const fs = require('fs');
const execa = require('execa');
const { _readSettings, _writeSettings, _removeExistingNotifyHooks, getHooksDir, getCommandsDir } = require('../../src/hooks/hooks-installer.js');
const { readClaudeConfig, writeClaudeConfig } = require('../../src/marketplace/config-manager.js');
const { getSkillsDir } = require('../../src/marketplace/plugin-installer.js');
const { removeAllComponents } = require('../../src/uninstall/remover.js');

// Helper: all components installed
function makeAllInstalledResults() {
  return {
    plugins: [
      { name: 'claude-notify', installed: true, path: 'C:/Users/test/.claude/skills/claude-notify/SKILL.md' },
      { name: 'windows-git-commit', installed: true, path: 'C:/Users/test/.claude/skills/windows-git-commit/SKILL.md' }
    ],
    hooksScripts: { installed: true, path: 'C:/Users/test/.claude/hooks' },
    hooksRegistered: { installed: true, path: '~/.claude/settings.json' },
    commandsInstalled: { installed: true, path: 'C:/Users/test/.claude/commands' },
    marketplaceSource: { installed: true, path: 'C:/Users/test/.claude/config.json' },
    envVars: {
      token: { name: 'PUSHOVER_TOKEN', installed: true },
      user: { name: 'PUSHOVER_USER', installed: true }
    },
    hasAnyInstalled: true
  };
}

// Helper: nothing installed
function makeNothingInstalledResults() {
  return {
    plugins: [
      { name: 'claude-notify', installed: false, path: 'C:/Users/test/.claude/skills/claude-notify/SKILL.md' },
      { name: 'windows-git-commit', installed: false, path: 'C:/Users/test/.claude/skills/windows-git-commit/SKILL.md' }
    ],
    hooksScripts: { installed: false, path: 'C:/Users/test/.claude/hooks' },
    hooksRegistered: { installed: false, path: '~/.claude/settings.json' },
    commandsInstalled: { installed: false, path: 'C:/Users/test/.claude/commands' },
    marketplaceSource: { installed: false, path: 'C:/Users/test/.claude/config.json' },
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

  test('with all-installed detection results calls all 7 removal steps and returns results for each', async () => {
    const results = makeAllInstalledResults();
    _readSettings.mockReturnValue({ hooks: {} });
    _removeExistingNotifyHooks.mockReturnValue({ hooks: {} });
    readClaudeConfig.mockReturnValue({ marketplaceSources: { 'work-skills': { type: 'github' } } });

    const removalResults = await removeAllComponents(results);

    // Should have results for: 2 plugins + 1 hookScripts + 1 hookReg + 1 commands + 1 marketplaceCache + 1 marketplaceSource + 2 envVars = 9 entries
    // Actually: hookScripts, hookReg, commands, 2 plugins, marketplaceCache, marketplaceSource, 2 envVars = 9
    expect(removalResults.length).toBe(9);

    // All should be removed (not failed or skipped)
    const removedCount = removalResults.filter(r => r.status === 'removed').length;
    expect(removedCount).toBe(9);

    // Verify fs.rmSync was called for hook scripts
    expect(fs.rmSync).toHaveBeenCalled();

    // Verify env var deletion was called
    expect(execa).toHaveBeenCalledTimes(2);
  });

  test('with nothing-installed detection results returns all-skipped results', async () => {
    const results = makeNothingInstalledResults();

    const removalResults = await removeAllComponents(results);

    // All should be skipped
    expect(removalResults.length).toBe(9);
    const skippedCount = removalResults.filter(r => r.status === 'skipped').length;
    expect(skippedCount).toBe(9);

    // No actual removal should be attempted
    expect(fs.rmSync).not.toHaveBeenCalled();
    expect(execa).not.toHaveBeenCalled();
    expect(_readSettings).not.toHaveBeenCalled();
    expect(readClaudeConfig).not.toHaveBeenCalled();
  });

  test('with partial installation returns correct removed/skipped mix', async () => {
    const results = {
      plugins: [
        { name: 'claude-notify', installed: true, path: 'path1' },
        { name: 'windows-git-commit', installed: false, path: 'path2' }
      ],
      hooksScripts: { installed: true, path: 'hooks' },
      hooksRegistered: { installed: false, path: 'settings' },
      commandsInstalled: { installed: false, path: 'commands' },
      marketplaceSource: { installed: false, path: 'config' },
      envVars: {
        token: { name: 'PUSHOVER_TOKEN', installed: true },
        user: { name: 'PUSHOVER_USER', installed: false }
      },
      hasAnyInstalled: true
    };

    _readSettings.mockReturnValue({ hooks: {} });
    _removeExistingNotifyHooks.mockReturnValue({ hooks: {} });
    readClaudeConfig.mockReturnValue({ marketplaceSources: {} });

    const removalResults = await removeAllComponents(results);

    const removedItems = removalResults.filter(r => r.status === 'removed');
    const skippedItems = removalResults.filter(r => r.status === 'skipped');

    // claude-notify plugin + hooksScripts + token env var = 3 removed
    // But marketplaceCache also depends on marketplaceSource.installed which is false
    // So: claude-notify(removed), windows-git-commit(skipped), hooksScripts(removed), hooksRegistered(skipped), commands(skipped), marketplaceCache(skipped), marketplaceSource(skipped), token(removed), user(skipped)
    expect(removedItems.length).toBe(3);
    expect(skippedItems.length).toBe(6);
  });

  test('when hook script removal fails, remaining steps continue and failure is recorded', async () => {
    const results = makeAllInstalledResults();
    // Make fs.rmSync throw on the first call (hook scripts)
    fs.rmSync.mockImplementationOnce(() => { throw new Error('Permission denied'); });

    _readSettings.mockReturnValue({ hooks: {} });
    _removeExistingNotifyHooks.mockReturnValue({ hooks: {} });
    readClaudeConfig.mockReturnValue({ marketplaceSources: { 'work-skills': {} } });

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
    readClaudeConfig.mockReturnValue({ marketplaceSources: { 'work-skills': {} } });
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

  test('marketplace source removal calls readClaudeConfig, deletes work-skills entry, writeClaudeConfig', async () => {
    const results = makeAllInstalledResults();
    const mockConfig = {
      marketplaceSources: {
        'work-skills': { type: 'github', url: 'https://github.com/allanpk716/work-skills' }
      }
    };
    fs.rmSync.mockImplementation(() => {});
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});
    readClaudeConfig.mockReturnValue(mockConfig);

    await removeAllComponents(results);

    expect(readClaudeConfig).toHaveBeenCalledTimes(1);
    // Verify work-skills was deleted from config before writing
    expect(writeClaudeConfig).toHaveBeenCalledTimes(1);
    const writtenConfig = writeClaudeConfig.mock.calls[0][0];
    expect(writtenConfig.marketplaceSources['work-skills']).toBeUndefined();
  });

  test('plugin directory removal calls fs.rmSync with recursive:true, force:true for each installed plugin', async () => {
    const results = makeAllInstalledResults();
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});
    readClaudeConfig.mockReturnValue({ marketplaceSources: {} });

    await removeAllComponents(results);

    // Check that rmSync was called with recursive:true, force:true for plugin directories
    const pluginCalls = fs.rmSync.mock.calls.filter(call => {
      const path = call[0];
      return path && (path.includes('claude-notify') || path.includes('windows-git-commit'));
    });

    expect(pluginCalls.length).toBe(2);
    for (const call of pluginCalls) {
      expect(call[1]).toEqual(expect.objectContaining({ recursive: true, force: true }));
    }
  });

  test('env var removal calls execa with correct reg delete arguments', async () => {
    const results = makeAllInstalledResults();
    fs.rmSync.mockImplementation(() => {});
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});
    readClaudeConfig.mockReturnValue({ marketplaceSources: {} });

    await removeAllComponents(results);

    expect(execa).toHaveBeenCalledTimes(2);
    expect(execa).toHaveBeenCalledWith('reg', ['delete', 'HKCU\\Environment', '/v', 'PUSHOVER_TOKEN', '/f']);
    expect(execa).toHaveBeenCalledWith('reg', ['delete', 'HKCU\\Environment', '/v', 'PUSHOVER_USER', '/f']);
  });

  test('marketplace cache removal deletes both cache/work-skills and marketplaces/work-skills directories', async () => {
    const results = makeAllInstalledResults();
    fs.rmSync.mockImplementation(() => {});
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});
    readClaudeConfig.mockReturnValue({ marketplaceSources: { 'work-skills': {} } });
    fs.existsSync.mockReturnValue(true);

    await removeAllComponents(results);

    // Find rmSync calls for marketplace cache directories
    const cacheCalls = fs.rmSync.mock.calls.filter(call => {
      const p = call[0];
      return p && (p.includes('cache') || p.includes('marketplaces')) && p.includes('work-skills');
    });

    expect(cacheCalls.length).toBeGreaterThanOrEqual(2);
  });

  test('slash command removal deletes all 4 command .md files from commands directory', async () => {
    const results = makeAllInstalledResults();
    _readSettings.mockReturnValue({});
    _removeExistingNotifyHooks.mockReturnValue({});
    readClaudeConfig.mockReturnValue({ marketplaceSources: {} });

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
