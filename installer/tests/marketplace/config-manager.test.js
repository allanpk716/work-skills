'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import module under test
let configManager;

try {
  configManager = require('../../src/marketplace/config-manager.js');
} catch (error) {
  console.error('Failed to import config-manager:', error.message);
  process.exit(1);
}

const { readClaudeConfig, writeClaudeConfig, registerMarketplaceSource, getConfigPath } = configManager;

// Test helper
const testConfigPath = path.join(os.homedir(), '.claude', 'config.json');
const backupPath = path.join(os.homedir(), '.claude', 'config.json.test-backup');

function backupConfig() {
  if (fs.existsSync(testConfigPath)) {
    fs.copyFileSync(testConfigPath, backupPath);
    fs.unlinkSync(testConfigPath);
  }
}

function restoreConfig() {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, testConfigPath);
    fs.unlinkSync(backupPath);
  } else if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath);
  }
}

console.log('Testing config-manager module...\n');

// Test 1: readClaudeConfig() returns {} when config.json does not exist
console.log('Test 1: readClaudeConfig() returns {} when config.json does not exist');
backupConfig();
try {
  const config = readClaudeConfig();
  assert.deepStrictEqual(config, {}, 'Should return empty object when config missing');
  console.log('  PASS: Returns {} for missing config\n');
} catch (error) {
  console.error('  FAIL:', error.message);
  restoreConfig();
  process.exit(1);
}

// Test 2: readClaudeConfig() returns parsed JSON when config.json exists
console.log('Test 2: readClaudeConfig() returns parsed JSON when config.json exists');
try {
  const testConfig = { test: 'value', nested: { key: 123 } };
  fs.mkdirSync(path.dirname(testConfigPath), { recursive: true });
  fs.writeFileSync(testConfigPath, JSON.stringify(testConfig));

  const config = readClaudeConfig();
  assert.deepStrictEqual(config, testConfig, 'Should parse existing config correctly');
  console.log('  PASS: Parses existing config\n');
} catch (error) {
  console.error('  FAIL:', error.message);
  restoreConfig();
  process.exit(1);
}

// Test 3: writeClaudeConfig({test: 1}) writes valid JSON to config.json
console.log('Test 3: writeClaudeConfig({test: 1}) writes valid JSON to config.json');
try {
  const testConfig = { test: 1, another: 'value' };
  writeClaudeConfig(testConfig);

  const raw = fs.readFileSync(testConfigPath, 'utf8');
  const parsed = JSON.parse(raw);
  assert.deepStrictEqual(parsed, testConfig, 'Written config should match');
  console.log('  PASS: Writes valid JSON\n');
} catch (error) {
  console.error('  FAIL:', error.message);
  restoreConfig();
  process.exit(1);
}

// Test 4: registerMarketplaceSource() adds work-skills entry to marketplaceSources
console.log('Test 4: registerMarketplaceSource() adds work-skills entry to marketplaceSources');
try {
  // Start with clean config
  fs.unlinkSync(testConfigPath);

  registerMarketplaceSource();

  const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
  assert.ok(config.marketplaceSources, 'marketplaceSources should exist');
  assert.ok(config.marketplaceSources['work-skills'], 'work-skills entry should exist');
  assert.strictEqual(config.marketplaceSources['work-skills'].type, 'github');
  assert.strictEqual(config.marketplaceSources['work-skills'].url, 'https://github.com/allanpk716/work-skills');
  assert.strictEqual(config.marketplaceSources['work-skills'].branch, 'main');
  console.log('  PASS: Adds work-skills marketplace source\n');
} catch (error) {
  console.error('  FAIL:', error.message);
  restoreConfig();
  process.exit(1);
}

// Test 5: registerMarketplaceSource() returns {success: true, path: '...'} on success
console.log('Test 5: registerMarketplaceSource() returns {success: true, path: "..."} on success');
try {
  // Start with clean config
  if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath);
  }

  const result = registerMarketplaceSource();
  assert.strictEqual(result.success, true, 'Should return success: true');
  assert.ok(result.path, 'Should return path');
  assert.strictEqual(result.path, testConfigPath, 'Path should match expected location');
  console.log('  PASS: Returns success object with path\n');
} catch (error) {
  console.error('  FAIL:', error.message);
  restoreConfig();
  process.exit(1);
}

// Cleanup
restoreConfig();

console.log('All tests passed!');
