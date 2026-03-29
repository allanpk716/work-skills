const execa = require('execa');
jest.mock('execa');

// Import functions that will be implemented in Wave 1
const { runPythonVerification } = require('../../src/verification/runner.js');

describe('verification/runner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runPythonVerification', () => {
    it('should return success with stdout when script exits 0', async () => {
      const mockStdout = '  [OK] Python version: PASS\n      Current: 3.9.1, Required: >=3.8';
      execa.mockResolvedValue({ stdout: mockStdout, exitCode: 0 });

      const result = await runPythonVerification();

      expect(result.success).toBe(true);
      expect(result.stdout).toBe(mockStdout);
      expect(result.exitCode).toBe(0);
    });

    it('should handle timeout and return error', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.timedOut = true;
      execa.mockRejectedValue(timeoutError);

      const result = await runPythonVerification();

      expect(result.success).toBe(false);
      expect(result.error).toBe('timeout');
    });

    it('should handle Python not found (ENOENT)', async () => {
      const enoentError = new Error('Command not found');
      enoentError.code = 'ENOENT';
      execa.mockRejectedValue(enoentError);

      const result = await runPythonVerification();

      expect(result.success).toBe(false);
      expect(result.error).toBe('python_not_found');
    });

    it('should return success with stdout when script exits 1 (some checks failed)', async () => {
      const mockStdout = '  [X] Python version: FAIL';
      execa.mockResolvedValue({
        failed: true,
        stdout: mockStdout,
        stderr: '',
        exitCode: 1
      });

      const result = await runPythonVerification();

      // Exit code 1 means some checks failed, not an execution error
      expect(result.success).toBe(true);
      expect(result.stdout).toBe(mockStdout);
      expect(result.exitCode).toBe(1);
    });
  });
});
