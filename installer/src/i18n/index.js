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
 * @returns {string} - Translated string
 */
function t(key) {
  const lang = getLanguage();
  const translation = translations[lang]?.[key];
  return translation || translations['en'][key] || key;
}

module.exports = {
  t,
  detectLanguage,
  getLanguage,
  setLanguage
};
