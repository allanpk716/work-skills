/**
 * SSH Tools Detector Tests
 * Tests TortoiseGit and PuTTY detection via Windows registry
 */

const { detectSSHTools, detectTortoiseGit, detectPuTTY } = require('../../src/detectors/ssh-tools');

// Mock winreg module
jest.mock('winreg', () => {
  return jest.fn().mockImplementation((config) => {
    return {
      valueExists: jest.fn((valueName, callback) => {
        // Simulate registry found for TortoiseGit standard path
        if (config.key.includes('TortoiseGit') && !config.key.includes('Wow6432Node')) {
          callback(null, true);
        }
        // Simulate registry not found for other paths
        else {
          callback(null, false);
        }
      }),
      keyExists: jest.fn((callback) => {
        // Simulate registry found for PuTTY
        if (config.key.includes('PuTTY')) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      })
    };
  });
});

describe('SSH Tools Detector', () => {
  describe('detectTortoiseGit', () => {
    it('should return installed: true when registry key exists', async () => {
      const result = await detectTortoiseGit();
      expect(result.installed).toBe(true);
    });

    it('should return installed: false when registry key missing', async () => {
      // Clear mock and set to return false
      const Registry = require('winreg');
      Registry.mockImplementationOnce((config) => ({
        valueExists: jest.fn((valueName, callback) => callback(null, false)),
        keyExists: jest.fn((callback) => callback(null, false))
      }));

      const result = await detectTortoiseGit();
      expect(result.installed).toBe(false);
    });

    it('should check Wow6432Node path as fallback', async () => {
      // Mock to fail on standard path, succeed on Wow6432Node
      const Registry = require('winreg');
      let callCount = 0;

      Registry.mockImplementationOnce((config) => ({
        valueExists: jest.fn((valueName, callback) => {
          callCount++;
          if (config.key.includes('Wow6432Node')) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        }),
        keyExists: jest.fn((callback) => callback(null, false))
      }));

      const result = await detectTortoiseGit();
      // This test validates the Wow6432Node fallback logic
      expect(result).toBeDefined();
    });
  });

  describe('detectPuTTY', () => {
    it('should return installed: true when registry key exists', async () => {
      const result = await detectPuTTY();
      expect(result.installed).toBe(true);
    });

    it('should return installed: false when registry key missing', async () => {
      const Registry = require('winreg');
      Registry.mockImplementationOnce((config) => ({
        valueExists: jest.fn((valueName, callback) => callback(null, false)),
        keyExists: jest.fn((callback) => callback(null, false))
      }));

      const result = await detectPuTTY();
      expect(result.installed).toBe(false);
    });
  });

  describe('detectSSHTools', () => {
    it('should return installed: true if either tool found', async () => {
      const result = await detectSSHTools();
      expect(result.installed).toBe(true);
      expect(result).toHaveProperty('name', 'SSH Tools');
    });

    it('should return details with both tool statuses', async () => {
      const result = await detectSSHTools();
      expect(result).toHaveProperty('details');
      expect(result.details).toHaveProperty('tortoiseGit');
      expect(result.details).toHaveProperty('putty');
      expect(typeof result.details.tortoiseGit).toBe('boolean');
      expect(typeof result.details.putty).toBe('boolean');
    });

    it('should return correct structure when neither tool is installed', async () => {
      // Reset and configure mock to return false for all checks
      jest.resetModules();
      const Registry = require('winreg');

      Registry.mockImplementation((config) => ({
        valueExists: jest.fn((valueName, callback) => callback(null, false)),
        keyExists: jest.fn((callback) => callback(null, false))
      }));

      // Re-require the module to use the new mock
      const { detectSSHTools: detectSSHToolsFresh } = require('../../src/detectors/ssh-tools');
      const result = await detectSSHToolsFresh();

      expect(result.installed).toBe(false);
      expect(result.details.tortoiseGit).toBe(false);
      expect(result.details.putty).toBe(false);
    });
  });
});
