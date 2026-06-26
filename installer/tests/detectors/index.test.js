'use strict';

const { runAllDetectors, printResult } = require('../../src/detectors/index.js');

// Mock all detector modules (Phase 54 trim: only Python + requests remain)
jest.mock('../../src/detectors/python.js', () => ({
  detectPython: jest.fn()
}));

jest.mock('../../src/detectors/pip-package.js', () => ({
  detectPipPackage: jest.fn()
}));

jest.mock('chalk', () => ({
  green: jest.fn((text) => `[GREEN:${text}]`),
  red: jest.fn((text) => `[RED:${text}]`),
  gray: jest.fn((text) => `[GRAY:${text}]`)
}));

jest.mock('../../src/i18n/index.js', () => ({
  t: jest.fn((key) => {
    const translations = {
      'detection.checking': 'Checking environment dependencies...',
      'detection.summary': 'Detection complete: {passed}/{total} passed',
      'guidance.installPython': 'Please install Python 3.8 or later',
      'guidance.installRequests': 'Please install requests package'
    };
    return translations[key] || key;
  })
}));

const { detectPython } = require('../../src/detectors/python.js');
const { detectPipPackage } = require('../../src/detectors/pip-package.js');

describe('Detectors Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('runAllDetectors', () => {
    test('runAllDetectors returns array of results', async () => {
      // Setup mocks for passing results (2 detectors: Python + requests)
      detectPython.mockResolvedValue({
        name: 'Python',
        installed: true,
        version: '3.11.0',
        meetsMinimum: true,
        guidance: 'guidance.installPython'
      });

      detectPipPackage.mockResolvedValue({
        name: 'requests',
        installed: true,
        version: '2.31.0',
        meetsMinimum: true,
        guidance: 'guidance.installRequests'
      });

      const result = await runAllDetectors();

      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.allPassed).toBe(true);
    });

    test('runAllDetectors returns true when all pass', async () => {
      detectPython.mockResolvedValue({
        name: 'Python',
        installed: true,
        version: '3.11.0',
        meetsMinimum: true,
        guidance: 'guidance.installPython'
      });

      detectPipPackage.mockResolvedValue({
        name: 'requests',
        installed: true,
        version: '2.31.0',
        meetsMinimum: true,
        guidance: 'guidance.installRequests'
      });

      const result = await runAllDetectors();

      expect(result.allPassed).toBe(true);
    });

    test('runAllDetectors returns false when any fail', async () => {
      detectPython.mockResolvedValue({
        name: 'Python',
        installed: false,
        version: null,
        meetsMinimum: false,
        guidance: 'guidance.installPython'
      });

      detectPipPackage.mockResolvedValue({
        name: 'requests',
        installed: true,
        version: '2.31.0',
        meetsMinimum: true,
        guidance: 'guidance.installRequests'
      });

      const result = await runAllDetectors();

      expect(result.allPassed).toBe(false);
    });
  });

  describe('printResult', () => {
    test('printResult outputs [OK] for passing result', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = {
        name: 'Python',
        installed: true,
        version: '3.11.0',
        meetsMinimum: true
      };

      printResult(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[GREEN:[OK]]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Python')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('3.11.0')
      );
    });

    test('printResult outputs [FAIL] for failing result', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = {
        name: 'Python',
        installed: false,
        version: null,
        meetsMinimum: false
      };

      printResult(result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RED:[FAIL]]')
      );
    });

    test('printResult shows guidance for failed detection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = {
        name: 'Python',
        installed: false,
        version: null,
        meetsMinimum: false,
        guidance: 'guidance.installPython'
      };

      printResult(result);

      const calls = consoleSpy.mock.calls;
      const hasGuidance = calls.some(call =>
        call[0] && call[0].includes('[GRAY:') &&
        call[0].includes('Please install Python 3.8 or later')
      );

      expect(hasGuidance).toBe(true);
    });
  });
});
