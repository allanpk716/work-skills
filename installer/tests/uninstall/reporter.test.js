'use strict';

jest.mock('../../src/i18n/index.js', () => ({
  t: jest.fn((key, params) => {
    const translations = {
      'uninstall.remove.summary': '{removed} removed, {failed} failed, {skipped} skipped'
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

const chalk = require('chalk');
const { formatRemovalReport } = require('../../src/uninstall/reporter.js');
const { t } = require('../../src/i18n/index.js');

describe('Reporter - formatRemovalReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('with mixed results renders correct status icons for each', () => {
    const results = [
      { category: 'Hook Scripts', name: 'Hook scripts', status: 'removed', detail: '' },
      { category: 'Hook Registration', name: 'Hook registration', status: 'failed', detail: 'Permission denied' },
      { category: 'Plugins', name: 'claude-notify', status: 'skipped', detail: '' }
    ];

    const output = formatRemovalReport(results);

    expect(output).toContain('[v]');
    expect(output).toContain('[x]');
    expect(output).toContain('[-]');
  });

  test('with all-removed results shows green [v] Removed for each item', () => {
    const results = [
      { category: 'Hook Scripts', name: 'Hook scripts', status: 'removed', detail: '' },
      { category: 'Plugins', name: 'claude-notify', status: 'removed', detail: '' },
      { category: 'Plugins', name: 'extra-plugin', status: 'removed', detail: '' }
    ];

    const output = formatRemovalReport(results);

    // Should contain [v] for each removed item
    const matchCount = (output.match(/\[v\]/g) || []).length;
    expect(matchCount).toBe(3);
    // Should not contain any [x] or [-]
    expect(output).not.toContain('[x]');
    expect(output).not.toContain('[-]');
  });

  test('with all-failed results shows red [x] Failed for each item with error detail', () => {
    const results = [
      { category: 'Hook Scripts', name: 'Hook scripts', status: 'failed', detail: 'File locked' },
      { category: 'Environment Variables', name: 'PUSHOVER_TOKEN', status: 'failed', detail: 'Registry error' }
    ];

    const output = formatRemovalReport(results);

    const matchCount = (output.match(/\[x\]/g) || []).length;
    expect(matchCount).toBe(2);
    // Failed items should include their detail text
    expect(output).toContain('File locked');
    expect(output).toContain('Registry error');
  });

  test('with all-skipped results shows gray [-] Skipped for each item', () => {
    const results = [
      { category: 'Hook Scripts', name: 'Hook scripts', status: 'skipped', detail: '' },
      { category: 'Plugins', name: 'claude-notify', status: 'skipped', detail: '' }
    ];

    const output = formatRemovalReport(results);

    const matchCount = (output.match(/\[-\]/g) || []).length;
    expect(matchCount).toBe(2);
    expect(output).not.toContain('[v]');
    expect(output).not.toContain('[x]');
  });

  test('summary line shows correct counts', () => {
    const results = [
      { category: 'Hook Scripts', name: 'Hook scripts', status: 'removed', detail: '' },
      { category: 'Plugins', name: 'claude-notify', status: 'removed', detail: '' },
      { category: 'Environment Variables', name: 'PUSHOVER_TOKEN', status: 'failed', detail: 'Error' },
      { category: 'Plugins', name: 'extra-plugin', status: 'skipped', detail: '' }
    ];

    formatRemovalReport(results);

    expect(t).toHaveBeenCalledWith('uninstall.remove.summary', {
      removed: 2,
      failed: 1,
      skipped: 1
    });
  });

  test('with empty results array returns separator-only output', () => {
    const output = formatRemovalReport([]);

    // Should contain separator line but no [v], [x], or [-]
    expect(output).toContain('---');
    expect(output).not.toContain('[v]');
    expect(output).not.toContain('[x]');
    expect(output).not.toContain('[-]');
  });
});
