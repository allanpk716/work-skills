'use strict';

const chalk = require('chalk');
const { MultiSelect } = require('enquirer');
const { t } = require('../i18n/index.js');
const { registerMarketplaceSource } = require('./config-manager.js');
const { fetchMarketplaceJson, parsePluginList } = require('./plugin-discovery.js');
const { isPluginInstalled, installPlugins } = require('./plugin-installer.js');

/**
 * Display plugin list as a table
 * @param {Array} plugins - List of plugins to display
 */
function displayPluginTable(plugins) {
  console.log('\n' + chalk.bold(t('marketplace.available')));
  console.log();

  // Simple table format (no external table library)
  const separator = chalk.gray('|----------------------|---------|------------------------------------------|');
  const header = chalk.gray('| Name                 | Version | Description                              |');
  console.log(separator);
  console.log(header);
  console.log(separator);

  plugins.forEach(plugin => {
    const name = plugin.name.padEnd(20).substring(0, 20);
    const version = plugin.version.padEnd(7).substring(0, 7);
    const desc = (plugin.description || '').padEnd(40).substring(0, 40);
    const installed = isPluginInstalled(plugin.name);
    const status = installed ? chalk.green(' [installed]') : '';
    console.log(`| ${chalk.cyan(name)} | ${chalk.yellow(version)} | ${desc}|${status}`);
  });

  console.log(separator);
}

/**
 * Display installation summary
 * @param {Object} result - {installed, skipped, failed}
 */
function displayInstallSummary(result) {
  console.log('\n' + chalk.bold(t('marketplace.summary')));
  console.log(chalk.gray('─'.repeat(60)));

  if (result.installed.length > 0) {
    console.log(chalk.green('✓ ' + t('marketplace.summary_installed', { count: result.installed.length })));
    result.installed.forEach(p => console.log(chalk.gray(`    - ${p.name} v${p.version}`)));
  }

  if (result.skipped.length > 0) {
    console.log(chalk.yellow('⊘ ' + t('marketplace.summary_skipped', { count: result.skipped.length })));
    result.skipped.forEach(p => console.log(chalk.gray(`    - ${p.name}`)));
  }

  if (result.failed.length > 0) {
    console.log(chalk.red('✗ ' + t('marketplace.summary_failed', { count: result.failed.length })));
    result.failed.forEach(p => console.log(chalk.gray(`    - ${p.name}: ${p.error}`)));
  }

  console.log(chalk.gray('─'.repeat(60)));

  if (result.installed.length > 0) {
    console.log(chalk.green('\n' + t('marketplace.complete')));
  }
}

/**
 * Main marketplace integration function
 * @returns {Promise<{success: boolean, installed: number, skipped: number, failed: number}>}
 */
async function runMarketplaceIntegration() {
  console.log(chalk.bold.blue('\n=== ' + t('marketplace.title') + ' ===\n'));

  try {
    // Step 1: Register marketplace source
    console.log(chalk.gray(t('marketplace.registering')));
    const registerResult = registerMarketplaceSource();

    if (!registerResult.success) {
      console.log(chalk.red('✗ Failed to register marketplace source'));
      return { success: false, installed: 0, skipped: 0, failed: 0, error: registerResult.error };
    }

    console.log(chalk.green('✓ ' + t('marketplace.registered')));

    // Step 2: Fetch plugin list
    console.log(chalk.gray('\n' + t('marketplace.fetching')));
    const marketplaceData = await fetchMarketplaceJson();
    const plugins = parsePluginList(marketplaceData);

    if (plugins.length === 0) {
      console.log(chalk.yellow('No plugins available.'));
      return { success: true, installed: 0, skipped: 0, failed: 0 };
    }

    // Step 3: Display plugins and prompt for selection
    displayPluginTable(plugins);

    const multiselect = new MultiSelect({
      name: 'plugins',
      message: t('marketplace.select_plugins'),
      choices: plugins.map(p => ({
        name: p.name,
        message: `${p.name} (${p.version}) - ${(p.description || '').substring(0, 40)}...`,
        disabled: isPluginInstalled(p.name)
      })),
      initial: []
    });

    const selectedNames = await multiselect.run();

    if (selectedNames.length === 0) {
      console.log(chalk.yellow('\n' + t('marketplace.none_selected')));
      const alreadyInstalledCount = plugins.filter(p => isPluginInstalled(p.name)).length;
      return { success: true, installed: 0, skipped: alreadyInstalledCount, failed: 0 };
    }

    // Step 4: Install selected plugins
    const selectedPlugins = plugins.filter(p => selectedNames.includes(p.name));

    const result = await installPlugins(selectedPlugins, {
      onProgress: (plugin, status) => {
        if (status === 'installing') {
          console.log(chalk.gray(`  ${t('marketplace.installing', { name: plugin.name })}`));
        } else if (status === 'installed') {
          console.log(chalk.green(`  ✓ ${t('marketplace.install_success', { name: plugin.name })}`));
        }
      }
    });

    // Step 5: Display summary
    displayInstallSummary(result);

    return {
      success: result.failed.length === 0,
      installed: result.installed.length,
      skipped: result.skipped.length,
      failed: result.failed.length
    };

  } catch (error) {
    // Handle specific errors
    if (error.message.includes('Network') || error.message.includes('timeout')) {
      console.log(chalk.red('\n✗ ' + t('marketplace.error.network')));
    } else {
      console.log(chalk.red('\n✗ ' + t('marketplace.error.unknown')));
      console.log(chalk.gray('  ' + error.message));
    }
    return { success: false, installed: 0, skipped: 0, failed: 0, error: error.message };
  }
}

module.exports = {
  runMarketplaceIntegration,
  displayPluginTable,
  displayInstallSummary
};
