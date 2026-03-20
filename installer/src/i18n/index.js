'use strict';

const en = require('./en.json');
const zh = require('./zh.json');

const translations = { en, zh };

let currentLang = null;

/**
 * Detect system language
 * @returns {'en'|'zh'}
 */
function detectLanguage() {
  const langEnv = process.env.LANG || process.env.LC_ALL || '';
  const languageEnv = process.env.LANGUAGE || '';
  const lcCtype = process.env.LC_CTYPE || '';

  // Check for Chinese language environment
  if (langEnv.toLowerCase().startsWith('zh') ||
      languageEnv.toLowerCase().includes('zh') ||
      lcCtype.toLowerCase().startsWith('zh')) {
    return 'zh';
  }

  return 'en';
}

/**
 * Get current language (auto-detect or manually set)
 * @returns {'en'|'zh'}
 */
function getLanguage() {
  return currentLang || detectLanguage();
}

/**
 * Set language manually (overrides auto-detection)
 * @param {'en'|'zh'|null} lang
 */
function setLanguage(lang) {
  if (lang === 'en' || lang === 'zh' || lang === null) {
    currentLang = lang;
  }
}

/**
 * Translate a key
 * @param {string} key - Translation key
 * @param {Object} params - Parameters to replace in translation string
 * @returns {string} - Translated string with parameters replaced
 */
function t(key, params = {}) {
  const lang = getLanguage();
  let translation = translations[lang]?.[key] || translations['en'][key] || key;

  // Replace {param} with actual values
  Object.keys(params).forEach(param => {
    translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });

  return translation;
}

module.exports = {
  t,
  detectLanguage,
  getLanguage,
  setLanguage
};
