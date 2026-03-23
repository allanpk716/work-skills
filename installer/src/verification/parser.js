'use strict';

/**
 * Parse Python verification script output into structured results
 * @param {string} stdout - Raw output from Python script
 * @returns {Array<{name: string, status: string, symbol: string, details: string}>}
 */
function parseVerificationOutput(stdout) {
  if (!stdout || stdout.trim() === '') {
    return [];
  }

  const lines = stdout.split('\n');
  const results = [];

  // Pattern: "  [OK] Python version: PASS"
  // Pattern: "  [X] Environment Variables: FAIL"
  // Pattern: "  [OK] Pushover API: SKIP"
  const pattern = /^\s*\[(OK|X)\]\s*(.+?):\s*(PASS|FAIL|SKIP)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(pattern);

    if (match) {
      const [, symbol, name, status] = match;

      // Check if next line is a detail line (indented, not a result line)
      let details = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // Detail lines start with spaces but don't match the result pattern
        if (nextLine && !nextLine.match(/^\s*\[(OK|X)\]/)) {
          details = nextLine;
          i++; // Skip the detail line in next iteration
        }
      }

      results.push({
        name: name.trim(),
        status,  // 'PASS' | 'FAIL' | 'SKIP'
        symbol,  // 'OK' | 'X'
        details
      });
    }
  }

  return results;
}

module.exports = {
  parseVerificationOutput
};
