'use strict';

const execa = require('execa');

/**
 * Detect Python installation and version
 * @returns {Promise<{name: string, installed: boolean, version: string|null, meetsMinimum: boolean, command: string|null, guidance: string}>}
 */
async function detectPython() {
  const commands = ['python', 'python3', 'py'];

  for (const cmd of commands) {
    try {
      const { stdout } = await execa(cmd, ['--version'], { reject: false });

      if (stdout && stdout.includes('Python')) {
        const versionMatch = stdout.match(/Python (\d+\.\d+\.\d+)/i);

        if (versionMatch) {
          const version = versionMatch[1];
          const [major, minor] = version.split('.').map(Number);

          return {
            name: 'Python',
            command: cmd,
            installed: true,
            version,
            meetsMinimum: major > 3 || (major === 3 && minor >= 8),
            guidance: 'guidance.installPython'
          };
        }
      }
    } catch {
      // Try next command
    }
  }

  return {
    name: 'Python',
    command: null,
    installed: false,
    version: null,
    meetsMinimum: false,
    guidance: 'guidance.installPython'
  };
}

module.exports = { detectPython };
