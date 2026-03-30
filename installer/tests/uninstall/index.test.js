'use strict';

jest.mock('../../src/uninstall/detector.js', () => ({
  detectAllInstalled: jest.fn()
}));

jest.mock('../../src/uninstall/formatter.js', () => ({
  formatDetectionTable: jest.fn()
}));

jest.mock('../../src/i18n/index.js', () => ({
  t: jest.fn((key, params) => {
    const translations = {
      'uninstall.summary': 'Found {found}/{total} items installed',
      'uninstall.nothingFound': 'Nothing installed - all clear!'
    };
    let result = translations[key] || key;
    if (params) {
      Object.keys(params).forEach(p => {
        result = result.replace(`{${p}}`, params[p]);
      });
    }
    return result;
  })
}));

const { runUninstallDetection } = require('../../src/uninstall/index.js');
const { detectAllInstalled } = require('../../src/uninstall/detector.js');
const { formatDetectionTable } = require('../../src/uninstall/formatter.js');
const { t } = require('../../src/i18n/index.js');

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

describe('Uninstall Index - runUninstallDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('calls detectAllInstalled', async () => {
    detectAllInstalled.mockResolvedValue(makeNothingInstalledResults());
    formatDetectionTable.mockReturnValue('table output');

    await runUninstallDetection();

    expect(detectAllInstalled).toHaveBeenCalledTimes(1);
  });

  test('calls formatDetectionTable with detection results', async () => {
    const results = makeAllInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('formatted table');

    await runUninstallDetection();

    expect(formatDetectionTable).toHaveBeenCalledWith(results);
  });

  test('console.logs the formatted output', async () => {
    detectAllInstalled.mockResolvedValue(makeAllInstalledResults());
    formatDetectionTable.mockReturnValue('formatted table output');

    await runUninstallDetection();

    expect(console.log).toHaveBeenCalledWith('formatted table output');
  });

  test('returns the results object', async () => {
    const results = makeAllInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');

    const returned = await runUninstallDetection();

    expect(returned).toBe(results);
  });

  test('prints summary with correct installed count', async () => {
    const results = makeAllInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');

    await runUninstallDetection();

    // All 8 items installed (2 plugins + 1 hooks + 1 hookReg + 1 commands + 1 marketplace + 2 envVars)
    expect(t).toHaveBeenCalledWith('uninstall.summary', { found: 8, total: 8 });
  });

  test('handles nothing installed without error', async () => {
    const results = makeNothingInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('Nothing installed');

    const returned = await runUninstallDetection();

    expect(returned).toBe(results);
    expect(t).toHaveBeenCalledWith('uninstall.summary', { found: 0, total: 8 });
  });

  test('counts partial installation correctly', async () => {
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

    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');

    await runUninstallDetection();

    // 1 plugin + 1 hooksScripts + 1 envVar.token = 3
    expect(t).toHaveBeenCalledWith('uninstall.summary', { found: 3, total: 8 });
  });
});
