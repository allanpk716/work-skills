'use strict';

const { isWindows, checkPlatform } = require('../src/platform.js');

describe('Platform Detection', () => {
  test('isWindows returns true on win32', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true });
    expect(isWindows()).toBe(true);
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
  });

  test('isWindows returns false on darwin', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', writable: true, configurable: true });
    expect(isWindows()).toBe(false);
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
  });

  test('checkPlatform returns true on Windows', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true });
    expect(checkPlatform()).toBe(true);
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
  });

  test('checkPlatform exits with code 1 on non-Windows', () => {
    const originalPlatform = process.platform;
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    Object.defineProperty(process, 'platform', { value: 'darwin', writable: true, configurable: true });
    checkPlatform();

    expect(mockExit).toHaveBeenCalledWith(1);

    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
    mockExit.mockRestore();
  });
});
