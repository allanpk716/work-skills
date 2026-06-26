'use strict';

jest.mock('../../src/uninstall/detector.js', () => ({
  detectAllInstalled: jest.fn()
}));

jest.mock('../../src/uninstall/formatter.js', () => ({
  formatDetectionTable: jest.fn()
}));

jest.mock('enquirer', () => ({
  Confirm: jest.fn().mockImplementation(() => ({
    run: jest.fn()
  }))
}));

jest.mock('../../src/uninstall/remover.js', () => ({
  removeAllComponents: jest.fn()
}));

jest.mock('../../src/uninstall/reporter.js', () => ({
  formatRemovalReport: jest.fn()
}));

jest.mock('../../src/i18n/index.js', () => ({
  t: jest.fn((key, params) => {
    const translations = {
      'uninstall.summary': 'Found {found}/{total} items installed',
      'uninstall.nothingFound': 'Nothing installed - all clear!',
      'uninstall.remove.confirmPrompt': 'Proceed with uninstall?',
      'uninstall.remove.aborted': 'Uninstall cancelled.',
      'uninstall.remove.progress': 'Removing...',
      'uninstall.remove.complete': 'Uninstall complete.',
      'uninstall.remove.nothingToRemove': 'Nothing to remove.'
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

const { runUninstall, runUninstallDetection } = require('../../src/uninstall/index.js');
const { detectAllInstalled } = require('../../src/uninstall/detector.js');
const { formatDetectionTable } = require('../../src/uninstall/formatter.js');
const { removeAllComponents } = require('../../src/uninstall/remover.js');
const { formatRemovalReport } = require('../../src/uninstall/reporter.js');
const { Confirm } = require('enquirer');
const { t } = require('../../src/i18n/index.js');

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

    // 6 items installed (1 plugin + 1 hooks + 1 hookReg + 1 commands + 2 envVars)
    expect(t).toHaveBeenCalledWith('uninstall.summary', { found: 6, total: 6 });
  });

  test('handles nothing installed without error', async () => {
    const results = makeNothingInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('Nothing installed');

    const returned = await runUninstallDetection();

    expect(returned).toBe(results);
    expect(t).toHaveBeenCalledWith('uninstall.summary', { found: 0, total: 6 });
  });

  test('counts partial installation correctly', async () => {
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

    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');

    await runUninstallDetection();

    // 1 plugin + 1 hooksScripts + 1 envVar.token = 3
    expect(t).toHaveBeenCalledWith('uninstall.summary', { found: 3, total: 6 });
  });
});

describe('Uninstall Index - runUninstall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('displays detection table before confirming', async () => {
    const results = makeAllInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('detection table');
    Confirm.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(false)
    }));

    await runUninstall();

    expect(formatDetectionTable).toHaveBeenCalledWith(results);
    expect(console.log).toHaveBeenCalledWith('detection table');
  });

  test('asks user for confirmation before removal', async () => {
    const results = makeAllInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');

    let confirmOptions = {};
    Confirm.mockImplementation((opts) => {
      confirmOptions = opts;
      return { run: jest.fn().mockResolvedValue(false) };
    });

    await runUninstall();

    expect(Confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'confirmUninstall',
        initial: false
      })
    );
    expect(removeAllComponents).not.toHaveBeenCalled();
  });

  test('aborts without changes when user declines', async () => {
    const results = makeAllInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');
    Confirm.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(false)
    }));

    const result = await runUninstall();

    expect(removeAllComponents).not.toHaveBeenCalled();
    expect(t).toHaveBeenCalledWith('uninstall.remove.aborted');
    expect(result).toEqual({ success: true, aborted: true });
  });

  test('executes removal and shows report when confirmed', async () => {
    const results = makeAllInstalledResults();
    const removalResults = [
      { category: 'Hook Scripts', name: 'Hook scripts', status: 'removed', detail: '' }
    ];
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');
    Confirm.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(true)
    }));
    removeAllComponents.mockResolvedValue(removalResults);
    formatRemovalReport.mockReturnValue('removal report');

    const result = await runUninstall();

    expect(removeAllComponents).toHaveBeenCalledWith(results);
    expect(formatRemovalReport).toHaveBeenCalledWith(removalResults);
    expect(console.log).toHaveBeenCalledWith('removal report');
    expect(t).toHaveBeenCalledWith('uninstall.remove.progress');
    expect(t).toHaveBeenCalledWith('uninstall.remove.complete');
    expect(result).toEqual({ success: true, results: removalResults });
  });

  test('handles nothing installed', async () => {
    const results = makeNothingInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('nothing table');

    const result = await runUninstall();

    expect(Confirm).not.toHaveBeenCalled();
    expect(t).toHaveBeenCalledWith('uninstall.nothingFound');
    expect(result).toEqual({ success: true, nothingToRemove: true });
  });

  test('returns correct result for aborted uninstall', async () => {
    const results = makeAllInstalledResults();
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');
    Confirm.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(false)
    }));

    const result = await runUninstall();

    expect(result).toEqual({ success: true, aborted: true });
    expect(result.aborted).toBe(true);
    expect(result.success).toBe(true);
  });

  test('returns correct result for successful uninstall', async () => {
    const results = makeAllInstalledResults();
    const removalResults = [
      { category: 'Plugins', name: 'claude-notify', status: 'removed', detail: '' }
    ];
    detectAllInstalled.mockResolvedValue(results);
    formatDetectionTable.mockReturnValue('table');
    Confirm.mockImplementation(() => ({
      run: jest.fn().mockResolvedValue(true)
    }));
    removeAllComponents.mockResolvedValue(removalResults);
    formatRemovalReport.mockReturnValue('report');

    const result = await runUninstall();

    expect(result.success).toBe(true);
    expect(result.results).toBe(removalResults);
  });
});
