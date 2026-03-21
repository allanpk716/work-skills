'use strict';

const https = require('https');

/**
 * GitHub raw content URL for marketplace.json
 */
const MARKETPLACE_URL = 'https://raw.githubusercontent.com/allanpk716/work-skills/main/.claude-plugin/marketplace.json';

/**
 * Fetch marketplace.json from GitHub
 * @param {number} timeout - Request timeout in milliseconds (default: 10000)
 * @returns {Promise<Object>} Parsed marketplace.json object
 */
function fetchMarketplaceJson(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(MARKETPLACE_URL, { timeout }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Failed to parse marketplace.json: ' + err.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('Network error: ' + err.message));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Parse plugin list from marketplace data
 * @param {Object} marketplaceData - Raw marketplace.json data
 * @returns {Array<{name, description, version, source, category}>}
 */
function parsePluginList(marketplaceData) {
  if (!marketplaceData.plugins || !Array.isArray(marketplaceData.plugins)) {
    return [];
  }

  return marketplaceData.plugins.map(p => ({
    name: p.name,
    description: p.description || '',
    version: p.version || '0.0.0',
    source: p.source || '',
    category: p.category || 'general'
  }));
}

module.exports = {
  MARKETPLACE_URL,
  fetchMarketplaceJson,
  parsePluginList
};
