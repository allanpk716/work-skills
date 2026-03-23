'use strict';

const execa = require('execa');
const path = require('path');
const fs = require('fs');

/**
 * Run Python verification script and capture output
 * @returns {Promise<{success: boolean, stdout?: string, stderr?: string, exitCode?: number, error?: string}>}
 */
async function runPythonVerification() {
  // Build script path (relative to this module)
  const scriptPath = path.join(__dirname, '../../../plugins/claude-notify/scripts/verify-installation.py');

  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    return {
      success: false,
      error: 'script_not_found'
    };
  }

  try {
    const result = await execa('python', [scriptPath], {
      timeout: 30000,
      encoding: 'utf-8',
      reject: false
    });

    // Handle execution failure (non-zero exit code)
    if (result.failed) {
      return {
        success: false,
        error: 'execution_failed',
        stderr: result.stderr,
        exitCode: result.exitCode
      };
    }

    // Success
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    };

  } catch (error) {
    // Handle timeout
    if (error.timedOut) {
      return {
        success: false,
        error: 'timeout'
      };
    }

    // Handle Python not found (ENOENT)
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'python_not_found'
      };
    }

    // Re-throw unexpected errors
    throw error;
  }
}

module.exports = {
  runPythonVerification
};
