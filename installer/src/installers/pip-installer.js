'use strict';

const execa = require('execa');
const chalk = require('chalk');
const { t } = require('../i18n/index.js');

/**
 * Install a Python package using pip
 * @param {string} packageName - Name of the package to install
 * @param {string} pythonCmd - Python command to use (default: 'python')
 * @returns {Promise<{success: boolean, message: string, output?: string, error?: string, errorDetails?: string}>}
 */
async function installPipPackage(packageName, pythonCmd = 'python') {
  try {
    const { stdout } = await execa(pythonCmd, ['-m', 'pip', 'install', packageName, '--user']);

    return {
      success: true,
      message: t('install.success', { package: packageName }),
      output: stdout
    };
  } catch (error) {
    const stderr = error.stderr || error.message || '';
    let errorType = 'unknown';

    // Detect error type from stderr
    if (stderr.includes('Permission denied') || stderr.includes('Access is denied')) {
      errorType = 'permission';
    } else if (stderr.toLowerCase().includes('network') || stderr.toLowerCase().includes('connection')) {
      errorType = 'network';
    } else if (stderr.includes('not found') || stderr.includes('ENOENT')) {
      errorType = 'pipNotFound';
    }

    return {
      success: false,
      message: t('install.failed', { package: packageName }),
      error: errorType,
      errorDetails: stderr
    };
  }
}

/**
 * Get guidance message key for an error type
 * @param {string} errorType - Type of error
 * @returns {string} - i18n key for guidance message
 */
function getErrorGuidance(errorType) {
  const guidanceMap = {
    'permission': 'guidance.installPermission',
    'network': 'guidance.installNetwork',
    'pipNotFound': 'guidance.installPipNotFound',
    'unknown': 'guidance.installUnknown'
  };

  return guidanceMap[errorType] || guidanceMap['unknown'];
}

module.exports = {
  installPipPackage,
  getErrorGuidance
};
