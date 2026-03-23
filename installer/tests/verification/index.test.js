// Mock verification modules
jest.mock('../../src/verification/runner.js', () => ({
  runPythonVerification: jest.fn()
}));

jest.mock('../../src/verification/parser.js', () => ({
  parseVerificationOutput: jest.fn()
}));

jest.mock('../../src/verification/formatter.js', () => ({
  formatVerificationTable: jest.fn(),
  calculateSummary: jest.fn(),
  displayCommonSolutions: jest.fn()
}));

const { runPythonVerification } = require('../../src/verification/runner.js');
const { parseVerificationOutput } = require('../../src/verification/parser.js');
const { formatVerificationTable, calculateSummary, displayCommonSolutions } = require('../../src/verification/formatter.js');
const { runVerification } = require('../../src/verification/index.js');

describe('verification/index (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runVerification', () => {
    it('should return object with success, passed, total properties', async () => {
      runPythonVerification.mockResolvedValue({
        success: true,
        stdout: '[OK] Python: PASS'
      });

      parseVerificationOutput.mockReturnValue([
        { name: 'Python', status: 'PASS', symbol: 'OK', details: '' }
      ]);

      formatVerificationTable.mockReturnValue('table output');
      calculateSummary.mockReturnValue({ passed: 1, total: 1 });

      const result = await runVerification();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('total');
    });

    it('should display verification title using i18n', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      runPythonVerification.mockResolvedValue({
        success: true,
        stdout: ''
      });

      parseVerificationOutput.mockReturnValue([]);
      formatVerificationTable.mockReturnValue('');
      calculateSummary.mockReturnValue({ passed: 0, total: 0 });

      await runVerification();

      // Should display title (i18n key: verification.title)
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should show rerun command at the end', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      runPythonVerification.mockResolvedValue({
        success: true,
        stdout: ''
      });

      parseVerificationOutput.mockReturnValue([]);
      formatVerificationTable.mockReturnValue('');
      calculateSummary.mockReturnValue({ passed: 0, total: 0 });

      await runVerification();

      // Should display rerun command (i18n key: verification.rerunCommand)
      const calls = consoleSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('npx @allanpk716/work-skills-setup --verify');

      consoleSpy.mockRestore();
    });

    it('should display common solutions when checks fail', async () => {
      runPythonVerification.mockResolvedValue({
        success: true,
        stdout: ''
      });

      parseVerificationOutput.mockReturnValue([
        { name: 'Environment Variables', status: 'FAIL', symbol: 'X', details: '' }
      ]);

      formatVerificationTable.mockReturnValue('table');
      calculateSummary.mockReturnValue({ passed: 0, total: 1 });

      await runVerification();

      // Should call displayCommonSolutions when checks fail
      expect(displayCommonSolutions).toHaveBeenCalled();
    });
  });
});
