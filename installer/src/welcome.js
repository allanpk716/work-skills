'use strict';

const chalk = require('chalk');
const boxen = require('boxen');
const { t } = require('./i18n/index.js');

/**
 * Show welcome banner
 * @param {Object} options
 * @param {boolean} options.useColors - Enable/disable colors
 */
function showWelcome(options = {}) {
  const { useColors = true } = options;
  const packageJson = require('../package.json');

  // Disable colors if requested
  const color = useColors ? chalk : new chalk.Instance({ level: 0 });

  // Build welcome content
  const title = color.bold.cyan(t('welcome.title'));
  const subtitle = color.gray(t('welcome.subtitle'));
  const version = color.green(`${t('welcome.version')}: v${packageJson.version}`);

  const features = [
    color.yellow('* ') + t('welcome.feature1'),
    color.yellow('* ') + t('welcome.feature2'),
    color.yellow('* ') + t('welcome.feature3')
  ].join('\n  ');

  const content = `${title}
${subtitle}

${version}

${color.white(t('welcome.features') + ':')}
  ${features}`;

  const box = boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: useColors ? 'cyan' : 'white'
  });

  console.log(box);
}

module.exports = {
  showWelcome
};
