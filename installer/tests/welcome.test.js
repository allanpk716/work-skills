'use strict';

const { showWelcome } = require('../src/welcome.js');

describe('Welcome Module', () => {
  test('showWelcome outputs to console', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    showWelcome({ useColors: true });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('Work Skills');

    consoleSpy.mockRestore();
  });

  test('showWelcome contains version', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    showWelcome({ useColors: true });

    const output = consoleSpy.mock.calls[0][0];
    expect(output).toMatch(/v\d+\.\d+\.\d+/);

    consoleSpy.mockRestore();
  });

  test('showWelcome with useColors=false does not throw', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    expect(() => showWelcome({ useColors: false })).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('showWelcome uses boxen for border', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    showWelcome({ useColors: true });

    const output = consoleSpy.mock.calls[0][0];
    // Boxen creates rounded borders with specific characters
    expect(output).toMatch(/[╭╮╰╯│─]/);

    consoleSpy.mockRestore();
  });
});
