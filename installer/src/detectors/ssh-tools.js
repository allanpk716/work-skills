/**
 * SSH Tools Detector
 * Detects TortoiseGit and PuTTY via Windows registry
 */

const Registry = require('winreg');

/**
 * Check if TortoiseGit is installed via registry
 * @returns {Promise<{installed: boolean}>}
 */
async function detectTortoiseGit() {
  return new Promise((resolve) => {
    const regKey = new Registry({
      hive: Registry.HKLM,
      key: '\\Software\\TortoiseGit'
    });

    regKey.valueExists('', (err, exists) => {
      if (err || !exists) {
        // Try 32-bit path on 64-bit Windows
        const regKey32 = new Registry({
          hive: Registry.HKLM,
          key: '\\Software\\Wow6432Node\\TortoiseGit'
        });
        regKey32.valueExists('', (err2, exists2) => {
          resolve({ installed: !err2 && exists2 });
        });
      } else {
        resolve({ installed: true });
      }
    });
  });
}

/**
 * Check if PuTTY is installed via registry
 * @returns {Promise<{installed: boolean}>}
 */
async function detectPuTTY() {
  return new Promise((resolve) => {
    const regKey = new Registry({
      hive: Registry.HKCU,
      key: '\\Software\\SimonTatham\\PuTTY'
    });

    regKey.keyExists((err, exists) => {
      resolve({ installed: !err && exists });
    });
  });
}

/**
 * Check if any SSH tool (TortoiseGit or PuTTY) is installed
 * @returns {Promise<{name: string, installed: boolean, version: null, meetsMinimum: boolean, details: object, message: string, guidance: string}>}
 */
async function detectSSHTools() {
  const [tortoiseGit, putty] = await Promise.all([
    detectTortoiseGit(),
    detectPuTTY()
  ]);

  const installed = tortoiseGit.installed || putty.installed;

  let message;
  if (tortoiseGit.installed && putty.installed) {
    message = 'Both TortoiseGit and PuTTY installed';
  } else if (tortoiseGit.installed) {
    message = 'TortoiseGit installed';
  } else if (putty.installed) {
    message = 'PuTTY installed';
  } else {
    message = 'Neither TortoiseGit nor PuTTY found';
  }

  return {
    name: 'SSH Tools',
    installed,
    version: null,
    meetsMinimum: installed,
    details: {
      tortoiseGit: tortoiseGit.installed,
      putty: putty.installed
    },
    message,
    guidance: installed ? null : 'guidance.installSSHTools'
  };
}

module.exports = {
  detectSSHTools,
  detectTortoiseGit,
  detectPuTTY
};
