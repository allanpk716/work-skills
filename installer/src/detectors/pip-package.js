'use strict';

const execa = require('execa');

/**
 * Detect if a Python pip package is installed
 * @param {string} packageName - Name of the package to detect
 * @param {string} pythonCmd - Python command to use (default: 'python')
 * @returns {Promise<{name: string, installed: boolean, version: string|null, meetsMinimum: boolean, guidance: string}>}
 */
async function detectPipPackage(packageName, pythonCmd = 'python') {
  try {
    const { stdout } = await execa(pythonCmd, ['-m', 'pip', 'show', packageName]);

    // Parse pip show output for Name and Version
    const nameMatch = stdout.match(/Name:\s*(.+)/i);
    const versionMatch = stdout.match(/Version:\s*(.+)/i);

    if (nameMatch) {
      const version = versionMatch ? versionMatch[1].trim() : null;

      return {
        name: packageName,
        installed: true,
        version,
        meetsMinimum: true, // Always true if installed
        guidance: `guidance.install${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`
      };
    }
  } catch {
    // Package not installed or pip not available
  }

  return {
    name: packageName,
    installed: false,
    version: null,
    meetsMinimum: false,
    guidance: `guidance.install${packageName.charAt(0).toUpperCase() + packageName.slice(1)}`
  };
}

module.exports = { detectPipPackage };
