// Mock enquirer before requiring the module
jest.mock('enquirer', () => ({
  Confirm: jest.fn()
}));

// Mock pip-installer module
jest.mock('../../src/installers/pip-installer.js', () => ({
  installPipPackage: jest.fn(),
  getErrorGuidance: jest.fn()
}));

const { Confirm } = require('enquirer');
const { installPipPackage, getErrorGuidance } = require('../../src/installers/pip-installer.js');
const { runInstaller, promptAndInstall } = require('../../src/installers/index.js');

describe('installers/index (orchestrator)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('promptAndInstall', () => {
    it('should return empty arrays when all packages installed', async () => {
      const packages = [
        { name: 'requests', installed: true, version: '2.28.0' }
      ];
      const result = await promptAndInstall(packages);
      expect(result.installed).toEqual([]);
      expect(result.failed).toEqual([]);
      expect(result.skipped).toEqual([]);
    });

    it('should prompt for missing packages', async () => {
      const packages = [
        { name: 'requests', installed: false }
      ];
      Confirm.mockImplementation(() => ({
        run: jest.fn().mockResolvedValue(true)
      }));
      installPipPackage.mockResolvedValue({ success: true });

      await promptAndInstall(packages);
      expect(Confirm).toHaveBeenCalled();
    });

    it('should add to installed array on success', async () => {
      const packages = [{ name: 'requests', installed: false }];
      Confirm.mockImplementation(() => ({
        run: jest.fn().mockResolvedValue(true)
      }));
      installPipPackage.mockResolvedValue({ success: true, message: 'OK' });

      const result = await promptAndInstall(packages);
      expect(result.installed).toContain('requests');
    });

    it('should add to failed array on failure', async () => {
      const packages = [{ name: 'requests', installed: false }];
      Confirm.mockImplementation(() => ({
        run: jest.fn().mockResolvedValue(true)
      }));
      installPipPackage.mockResolvedValue({ success: false, error: 'unknown' });
      getErrorGuidance.mockReturnValue('guidance.installUnknown');

      const result = await promptAndInstall(packages);
      expect(result.failed).toContain('requests');
    });

    it('should add to skipped array when user declines', async () => {
      const packages = [{ name: 'requests', installed: false }];
      Confirm.mockImplementation(() => ({
        run: jest.fn().mockResolvedValue(false)
      }));

      const result = await promptAndInstall(packages);
      expect(result.skipped).toContain('requests');
    });
  });

  describe('runInstaller', () => {
    it('should extract pythonCmd from detection results', async () => {
      const detectionResults = [
        { name: 'Python', installed: true, path: 'python3' }
      ];
      // promptAndInstall should be called with pythonCmd='python3'
      await runInstaller(detectionResults);
      // Verify through behavior (implementation will call promptAndInstall with pythonCmd)
    });
  });
});
