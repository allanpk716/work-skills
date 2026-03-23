const chalk = require('chalk');

// Import functions that will be implemented in Wave 1
const { formatVerificationTable, calculateSummary } = require('../../src/verification/formatter.js');

describe('verification/formatter', () => {
  describe('formatVerificationTable', () => {
    it('should create table with Check/Status/Details headers', () => {
      const results = [
        { name: 'Python version', status: 'PASS', symbol: 'OK', details: '3.9.1' }
      ];

      const table = formatVerificationTable(results);

      expect(table).toContain('Check');
      expect(table).toContain('Status');
      expect(table).toContain('Details');
    });

    it('should show green PASS icon for passed checks', () => {
      const results = [
        { name: 'Python version', status: 'PASS', symbol: 'OK', details: '3.9.1' }
      ];

      const table = formatVerificationTable(results);

      expect(table).toContain('PASS');
      expect(table).toContain(chalk.green('✓'));
    });

    it('should show red FAIL icon for failed checks', () => {
      const results = [
        { name: 'Environment Variables', status: 'FAIL', symbol: 'X', details: 'Token not set' }
      ];

      const table = formatVerificationTable(results);

      expect(table).toContain('FAIL');
      expect(table).toContain(chalk.red('✗'));
    });

    it('should show gray SKIP icon for skipped checks', () => {
      const results = [
        { name: 'Pushover API', status: 'SKIP', symbol: 'OK', details: 'Not configured' }
      ];

      const table = formatVerificationTable(results);

      expect(table).toContain('SKIP');
      expect(table).toContain(chalk.gray('⊘'));
    });

    it('should handle multiple results', () => {
      const results = [
        { name: 'Python version', status: 'PASS', symbol: 'OK', details: '3.9.1' },
        { name: 'Environment Variables', status: 'FAIL', symbol: 'X', details: 'Token not set' }
      ];

      const table = formatVerificationTable(results);

      expect(table).toContain('Python version');
      expect(table).toContain('Environment Variables');
    });
  });

  describe('calculateSummary', () => {
    it('should return correct passed/total counts', () => {
      const results = [
        { name: 'Python version', status: 'PASS', symbol: 'OK', details: '' },
        { name: 'Standard Libraries', status: 'PASS', symbol: 'OK', details: '' },
        { name: 'Environment Variables', status: 'FAIL', symbol: 'X', details: '' }
      ];

      const summary = calculateSummary(results);

      expect(summary.passed).toBe(2);
      expect(summary.total).toBe(3);
    });

    it('should count SKIP as not passed', () => {
      const results = [
        { name: 'Python version', status: 'PASS', symbol: 'OK', details: '' },
        { name: 'Pushover API', status: 'SKIP', symbol: 'OK', details: '' }
      ];

      const summary = calculateSummary(results);

      expect(summary.passed).toBe(1);
      expect(summary.total).toBe(2);
    });

    it('should handle empty results', () => {
      const results = [];

      const summary = calculateSummary(results);

      expect(summary.passed).toBe(0);
      expect(summary.total).toBe(0);
    });
  });
});
