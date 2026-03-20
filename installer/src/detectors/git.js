'use strict';

const execa = require('execa');

/**
 * Detect Git installation and version
 * @returns {Promise<{name: string, installed: boolean, version: string|null, meetsMinimum: boolean, command: string|null, guidance: string}>}
 */
async function detectGit() {
  try {
    const { stdout } = await execa('git', ['--version']);

    // stdout: "git version 2.43.0.windows.1"
    const versionMatch = stdout.match(/git version (\d+\.\d+\.\d+)/i);
    const version = versionMatch ? versionMatch[1] : null;

    return {
      name: 'Git',
      command: 'git',
      installed: true,
      version,
      meetsMinimum: true, // Any Git version is acceptable
      guidance: 'guidance.installGit'
    };
  } catch {
    return {
      name: 'Git',
      command: null,
      installed: false,
      version: null,
      meetsMinimum: false,
      guidance: 'guidance.installGit'
    };
  }
}

module.exports = { detectGit };
