'use strict';

const { main } = require('../src/index.js');

jest.mock('../src/uninstall/index.js', () => ({
  runUninstall: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/cli.js', () => ({
  parseArgs: jest.fn()
}));

jest.mock('../src/welcome.js', () => ({
  showWelcome: jest.fn()
}));

jest.mock('../src/detectors/index.js', () => ({
  runAllDetectors: jest.fn().mockResolvedValue({ results: [], allPassed: true })
}));

jest.mock('../src/installers/index.js', () => ({
  runInstaller: jest.fn()
}));

jest.mock('../src/configurators/index.js', () => ({
  runAllConfigurators: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/marketplace/index.js', () => ({
  runMarketplaceIntegration: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/hooks/index.js', () => ({
  runHooksInstallation: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/verification/index.js', () => ({
  runVerification: jest.fn().mockResolvedValue({ success: true })
}));

const { parseArgs } = require('../src/cli.js');
const { runUninstall } = require('../src/uninstall/index.js');

describe('Main Entry Point', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parseArgs.mockReturnValue({
      lang: 'auto',
      useColors: true,
      verifyOnly: false,
      uninstallOnly: false
    });
  });

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

  test('main() routes to uninstall when --uninstall flag is set', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    parseArgs.mockReturnValue({
      lang: 'auto',
      useColors: true,
      verifyOnly: false,
      uninstallOnly: true
    });

    await main();

    expect(runUninstall).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });
});
