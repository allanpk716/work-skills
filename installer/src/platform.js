'use strict';

/**
 * Check if current platform is Windows
 * @returns {boolean}
 */
function isWindows() {
  return process.platform === 'win32';
}

/**
 * Check platform and exit with error if not Windows
 * This function checks if the current platform is Windows.
 * If not Windows, it prints an error message and exits with code 1.
 * If Windows, it returns true.
 * @returns {boolean} - true if Windows, never returns false (exits instead)
 */
function checkPlatform() {
  if (!isWindows()) {
    console.error('');
    console.error('Error: This installer is designed for Windows only.');
    console.error('Current platform: ' + process.platform);
    console.error('');
    process.exit(1);
  }
  return true;
}

module.exports = {
  isWindows,
  checkPlatform
};
