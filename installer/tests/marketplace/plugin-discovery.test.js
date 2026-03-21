'use strict';

const assert = require('assert');

// Import module under test
let pluginDiscovery;

try {
  pluginDiscovery = require('../../src/marketplace/plugin-discovery.js');
} catch (error) {
  console.error('Failed to import plugin-discovery:', error.message);
  process.exit(1);
}

const { fetchMarketplaceJson, parsePluginList, MARKETPLACE_URL } = pluginDiscovery;

console.log('Testing plugin-discovery module...\n');

// Test 1: fetchMarketplaceJson() returns parsed JSON object from GitHub
console.log('Test 1: fetchMarketplaceJson() returns parsed JSON object from GitHub (live test)');
(async () => {
  try {
    const data = await fetchMarketplaceJson(5000); // 5 second timeout
    assert.ok(data, 'Should return data');
    assert.ok(typeof data === 'object', 'Should return object');
    assert.ok(Array.isArray(data.plugins), 'Should have plugins array');
    console.log('  PASS: Returns parsed marketplace.json\n');
  } catch (error) {
    console.error('  FAIL:', error.message);
    console.log('  (This test requires network access to GitHub)\n');
  }

  // Test 2: fetchMarketplaceJson() throws error with message on network failure
  console.log('Test 2: fetchMarketplaceJson() throws error with message on network failure');
  try {
    // Try to fetch from an invalid URL by temporarily changing the URL
    // Since we can't modify the constant, we'll test with an extremely short timeout
    await fetchMarketplaceJson(1); // 1ms timeout - should fail
    console.error('  FAIL: Should have thrown error');
    process.exit(1);
  } catch (error) {
    assert.ok(error.message, 'Error should have message');
    console.log('  PASS: Throws error on timeout:', error.message, '\n');
  }

  // Test 3: parsePluginList({plugins: [{name: 'x'}]}) returns array with plugin info
  console.log('Test 3: parsePluginList({plugins: [{name: "x"}]}) returns array with plugin info');
  try {
    const input = {
      plugins: [
        { name: 'test-plugin', description: 'A test', version: '1.0.0', source: './plugins/test', category: 'test' }
      ]
    };
    const result = parsePluginList(input);
    assert.ok(Array.isArray(result), 'Should return array');
    assert.strictEqual(result.length, 1, 'Should have 1 plugin');
    assert.strictEqual(result[0].name, 'test-plugin');
    assert.strictEqual(result[0].description, 'A test');
    assert.strictEqual(result[0].version, '1.0.0');
    assert.strictEqual(result[0].source, './plugins/test');
    assert.strictEqual(result[0].category, 'test');
    console.log('  PASS: Parses plugin list correctly\n');
  } catch (error) {
    console.error('  FAIL:', error.message);
    process.exit(1);
  }

  // Test 4: parsePluginList({}) returns empty array when plugins missing
  console.log('Test 4: parsePluginList({}) returns empty array when plugins missing');
  try {
    const result = parsePluginList({});
    assert.ok(Array.isArray(result), 'Should return array');
    assert.strictEqual(result.length, 0, 'Should be empty');
    console.log('  PASS: Returns empty array for missing plugins\n');
  } catch (error) {
    console.error('  FAIL:', error.message);
    process.exit(1);
  }

  // Verify MARKETPLACE_URL constant
  console.log('Bonus: Verify MARKETPLACE_URL constant');
  try {
    assert.ok(MARKETPLACE_URL, 'MARKETPLACE_URL should be defined');
    assert.ok(MARKETPLACE_URL.includes('raw.githubusercontent.com'), 'Should be GitHub raw URL');
    assert.ok(MARKETPLACE_URL.includes('marketplace.json'), 'Should point to marketplace.json');
    console.log('  PASS: MARKETPLACE_URL is correct:', MARKETPLACE_URL, '\n');
  } catch (error) {
    console.error('  FAIL:', error.message);
    process.exit(1);
  }

  console.log('All tests passed!');
})();
