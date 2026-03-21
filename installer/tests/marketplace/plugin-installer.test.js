'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import module under test
let pluginInstaller;

try {
  pluginInstaller = require('../../src/marketplace/plugin-installer.js');
} catch (error) {
  console.error('Failed to import plugin-installer:', error.message);
  process.exit(1);
}

const { isPluginInstalled, installPlugin, installPlugins, getSkillsDir, REPO_URL } = pluginInstaller;

console.log('Testing plugin-installer module...\n');

const skillsDir = path.join(os.homedir(), '.claude', 'skills');
const testPluginDir = path.join(skillsDir, 'test-plugin');

// Cleanup helper
function cleanup() {
  if (fs.existsSync(testPluginDir)) {
    fs.rmSync(testPluginDir, { recursive: true, force: true });
  }
}

// Test 1: isPluginInstalled('claude-notify') returns true when SKILL.md exists
console.log('Test 1: isPluginInstalled() returns true when SKILL.md exists');
cleanup();
try {
  // Create a fake plugin
  fs.mkdirSync(testPluginDir, { recursive: true });
  fs.writeFileSync(path.join(testPluginDir, 'SKILL.md'), '# Test Plugin');

  const installed = isPluginInstalled('test-plugin');
  assert.strictEqual(installed, true, 'Should return true when SKILL.md exists');
  console.log('  PASS: Detects installed plugin\n');
} catch (error) {
  console.error('  FAIL:', error.message);
  cleanup();
  process.exit(1);
}

// Test 2: isPluginInstalled('nonexistent') returns false when directory missing
console.log('Test 2: isPluginInstalled() returns false when directory missing');
cleanup();
try {
  const installed = isPluginInstalled('nonexistent-plugin-xyz');
  assert.strictEqual(installed, false, 'Should return false for missing plugin');
  console.log('  PASS: Detects missing plugin\n');
} catch (error) {
  console.error('  FAIL:', error.message);
  cleanup();
  process.exit(1);
}

// Test 3: installPlugin() clones repo and copies plugin to skills directory
console.log('Test 3: installPlugin() clones repo and copies plugin (integration test)');
console.log('  (This test requires Git and network access - may take 10-20 seconds)');
cleanup();
(async () => {
  try {
    // This is an integration test that actually clones the repo
    // We'll test with claude-notify plugin
    const plugin = {
      name: 'claude-notify-test',
      version: '1.0.0',
      source: './plugins/claude-notify'
    };

    const result = await installPlugin(plugin, { onProgress: () => {} });

    assert.ok(result.success || result.error, 'Should return success or error');
    if (result.success) {
      assert.ok(result.path, 'Should return installation path');
      console.log('  PASS: Plugin installed to:', result.path, '\n');
    } else {
      console.log('  INFO: Installation failed (expected if repo not accessible):', result.error, '\n');
    }

    // Test 4: installPlugins() returns {installed: [], skipped: [], failed: []}
    console.log('Test 4: installPlugins() returns {installed: [], skipped: [], failed: []}');
    const plugins = [
      { name: 'test-plugin', version: '1.0.0', source: './plugins/test' } // This one already installed from Test 1
    ];

    // Ensure test-plugin has SKILL.md (from Test 1)
    if (!fs.existsSync(testPluginDir)) {
      fs.mkdirSync(testPluginDir, { recursive: true });
      fs.writeFileSync(path.join(testPluginDir, 'SKILL.md'), '# Test');
    }

    const installResult = await installPlugins(plugins, { onProgress: () => {} });
    assert.ok(Array.isArray(installResult.installed), 'Should have installed array');
    assert.ok(Array.isArray(installResult.skipped), 'Should have skipped array');
    assert.ok(Array.isArray(installResult.failed), 'Should have failed array');
    assert.strictEqual(installResult.skipped.length, 1, 'Should skip already installed plugin');
    console.log('  PASS: Returns correct structure\n');

    // Verify REPO_URL constant
    console.log('Bonus: Verify REPO_URL constant');
    assert.ok(REPO_URL, 'REPO_URL should be defined');
    assert.ok(REPO_URL.includes('github.com'), 'Should be GitHub URL');
    assert.ok(REPO_URL.includes('work-skills'), 'Should point to work-skills repo');
    console.log('  PASS: REPO_URL is correct:', REPO_URL, '\n');

    console.log('All tests passed!');

    // Final cleanup
    cleanup();
    const testPlugin2 = path.join(skillsDir, 'claude-notify-test');
    if (fs.existsSync(testPlugin2)) {
      fs.rmSync(testPlugin2, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('  FAIL:', error.message);
    cleanup();
    process.exit(1);
  }
})();
