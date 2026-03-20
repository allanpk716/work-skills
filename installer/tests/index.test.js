'use strict';

const { main } = require('../src/index.js');

describe('Main Entry Point', () => {
  test('main() function is exported', () => {
    expect(main).toBeDefined();
    expect(typeof main).toBe('function');
  });

  test('main() calls checkPlatform() - verified by platform check behavior', () => {
    const originalPlatform = process.platform;
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Test that on non-Windows, main() causes exit(1) via checkPlatform()
    Object.defineProperty(process, 'platform', { value: 'darwin', writable: true, configurable: true });

    main();

    expect(mockExit).toHaveBeenCalledWith(1);

    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
    mockExit.mockRestore();
  });

  test('main() runs without error on Windows', () => {
    const originalPlatform = process.platform;
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    Object.defineProperty(process, 'platform', { value: 'win32', writable: true, configurable: true });

    // Should not throw and should not exit
    expect(() => main()).not.toThrow();
    expect(mockExit).not.toHaveBeenCalled();

    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true, configurable: true });
    mockExit.mockRestore();
  });
});
