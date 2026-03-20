const execa = require('execa');
jest.mock('execa');

// Import functions that will be implemented in Wave 1
const { installPipPackage, getErrorGuidance } = require('../../src/installers/pip-installer.js');

describe('pip-installer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('installPipPackage', () => {
    it('should return success=true when execa succeeds', async () => {
      execa.mockResolvedValue({ stdout: 'Successfully installed requests-2.28.0' });
      const result = await installPipPackage('requests');
      expect(result.success).toBe(true);
      expect(result.message).toContain('requests');
    });

    it('should return error=permission when stderr contains "Access is denied"', async () => {
      execa.mockRejectedValue({ stderr: 'Access is denied' });
      const result = await installPipPackage('requests');
      expect(result.success).toBe(false);
      expect(result.error).toBe('permission');
    });

    it('should return error=network when stderr contains "Connection refused"', async () => {
      execa.mockRejectedValue({ stderr: 'Connection refused' });
      const result = await installPipPackage('requests');
      expect(result.success).toBe(false);
      expect(result.error).toBe('network');
    });

    it('should return error=pipNotFound when stderr contains "ENOENT"', async () => {
      execa.mockRejectedValue({ stderr: 'ENOENT: no such file' });
      const result = await installPipPackage('requests');
      expect(result.success).toBe(false);
      expect(result.error).toBe('pipNotFound');
    });

    it('should return error=unknown for unknown errors', async () => {
      execa.mockRejectedValue({ stderr: 'Some unknown error' });
      const result = await installPipPackage('requests');
      expect(result.success).toBe(false);
      expect(result.error).toBe('unknown');
    });

    it('should include --user flag in pip command', async () => {
      execa.mockResolvedValue({ stdout: 'Success' });
      await installPipPackage('requests');
      expect(execa).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['--user'])
      );
    });
  });

  describe('getErrorGuidance', () => {
    it('should return guidance.installPermission for permission error', () => {
      expect(getErrorGuidance('permission')).toBe('guidance.installPermission');
    });

    it('should return guidance.installNetwork for network error', () => {
      expect(getErrorGuidance('network')).toBe('guidance.installNetwork');
    });

    it('should return guidance.installPipNotFound for pipNotFound error', () => {
      expect(getErrorGuidance('pipNotFound')).toBe('guidance.installPipNotFound');
    });

    it('should return guidance.installUnknown for unknown error', () => {
      expect(getErrorGuidance('unknown')).toBe('guidance.installUnknown');
    });
  });
});
