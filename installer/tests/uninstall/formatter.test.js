'use strict';

jest.mock('chalk', () => ({
  green: jest.fn((text) => `[GREEN:${text}]`),
  red: jest.fn((text) => `[RED:${text}]`),
  gray: jest.fn((text) => `[GRAY:${text}]`),
  cyan: jest.fn((text) => `[CYAN:${text}]`),
  yellow: jest.fn((text) => `[YELLOW:${text}]`)
}));

jest.mock('../../src/i18n/index.js', () => ({
  t: jest.fn((key, params) => {
    const translations = {
      'uninstall.title': 'Uninstall Detection',
      'uninstall.category.plugins': 'Plugins',
      'uninstall.category.hooks': 'Hook Scripts',
      'uninstall.category.hookRegistration': 'Hook Registration',
      'uninstall.category.commands': 'Slash Commands',
      'uninstall.category.environment': 'Environment Variables',
      'uninstall.status.installed': 'Installed',
      'uninstall.status.notInstalled': 'Not Installed',
      'uninstall.summary': 'Found {found}/{total} items installed',
      'uninstall.nothingFound': 'Nothing installed - all clear!',
      'uninstall.item.pluginDir': '{name} Plugin',
      'uninstall.item.hookScript': 'Notification Scripts',
      'uninstall.item.hookReg': 'Hook Registration',
      'uninstall.item.command': 'Slash Commands',
      'uninstall.item.envVar': '{name}'
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

const { formatDetectionTable } = require('../../src/uninstall/formatter.js');
const { t } = require('../../src/i18n/index.js');

function makeAllNotInstalledResults() {
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

function makeSomeInstalledResults() {
  return {
    plugins: [
      { name: 'claude-notify', installed: true, path: 'C:/Users/test/.claude/skills/claude-notify/SKILL.md' }
    ],
    hooksScripts: { installed: true, path: 'C:/Users/test/.claude/hooks' },
    hooksRegistered: { installed: false, path: '~/.claude/settings.json' },
    commandsInstalled: { installed: true, path: 'C:/Users/test/.claude/commands' },
    envVars: {
      token: { name: 'PUSHOVER_TOKEN', installed: true },
      user: { name: 'PUSHOVER_USER', installed: false }
    },
    hasAnyInstalled: true
  };
}

describe('Uninstall Formatter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('formats table with installed items showing check mark', () => {
    const results = makeSomeInstalledResults();
    const output = formatDetectionTable(results);

    // Should contain the green checkmark for installed items
    expect(output).toContain('[GREEN:');
    // Should contain path details for installed items
    expect(output).toContain('claude-notify');
  });

  test('formats table with not-installed items showing empty set', () => {
    const results = makeSomeInstalledResults();
    const output = formatDetectionTable(results);

    // Should contain the gray empty-set icon for not-installed items
    expect(output).toContain('[GRAY:');
  });

  test('shows nothing-found message when nothing installed', () => {
    const results = makeAllNotInstalledResults();
    const output = formatDetectionTable(results);

    expect(t).toHaveBeenCalledWith('uninstall.nothingFound');
    expect(output).toContain('Nothing installed');
  });

  test('includes all category headers', () => {
    const results = makeSomeInstalledResults();
    const output = formatDetectionTable(results);

    expect(t).toHaveBeenCalledWith('uninstall.category.plugins');
    expect(t).toHaveBeenCalledWith('uninstall.category.hooks');
    expect(t).toHaveBeenCalledWith('uninstall.category.hookRegistration');
    expect(t).toHaveBeenCalledWith('uninstall.category.commands');
    expect(t).toHaveBeenCalledWith('uninstall.category.environment');
  });

  test('handles empty results without crash', () => {
    const results = makeAllNotInstalledResults();
    expect(() => formatDetectionTable(results)).not.toThrow();
  });

  test('output contains separator lines when items installed', () => {
    const results = makeSomeInstalledResults();
    const output = formatDetectionTable(results);

    // Should contain pipe characters for table formatting
    expect(output).toContain('|');
    // Should contain dashes for separators
    expect(output).toContain('-');
  });

  test('output uses i18n for status text', () => {
    const results = makeSomeInstalledResults();
    formatDetectionTable(results);

    expect(t).toHaveBeenCalledWith('uninstall.status.installed');
    expect(t).toHaveBeenCalledWith('uninstall.status.notInstalled');
  });
});
