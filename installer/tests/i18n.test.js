'use strict';

const { t, detectLanguage, setLanguage, getLanguage } = require('../src/i18n/index.js');

describe('i18n Module', () => {
  let originalLang;
  let originalLcAll;
  let originalLanguage;
  let originalLcCtype;

  beforeEach(() => {
    // Save original env vars
    originalLang = process.env.LANG;
    originalLcAll = process.env.LC_ALL;
    originalLanguage = process.env.LANGUAGE;
    originalLcCtype = process.env.LC_CTYPE;

    // Reset language before each test
    setLanguage(null);
  });

  afterEach(() => {
    // Restore original env vars
    if (originalLang !== undefined) {
      process.env.LANG = originalLang;
    } else {
      delete process.env.LANG;
    }
    if (originalLcAll !== undefined) {
      process.env.LC_ALL = originalLcAll;
    } else {
      delete process.env.LC_ALL;
    }
    if (originalLanguage !== undefined) {
      process.env.LANGUAGE = originalLanguage;
    } else {
      delete process.env.LANGUAGE;
    }
    if (originalLcCtype !== undefined) {
      process.env.LC_CTYPE = originalLcCtype;
    } else {
      delete process.env.LC_CTYPE;
    }
  });

  test('detectLanguage returns zh for Chinese LANG', () => {
    process.env.LANG = 'zh_CN.UTF-8';
    expect(detectLanguage()).toBe('zh');
  });

  test('detectLanguage returns en for English/unset LANG', () => {
    delete process.env.LANG;
    delete process.env.LC_ALL;
    delete process.env.LANGUAGE;
    delete process.env.LC_CTYPE;

    expect(detectLanguage()).toBe('en');
  });

  test('t() returns translated string in English', () => {
    setLanguage('en');
    expect(t('welcome.title')).toBe('Work Skills Setup');
  });

  test('t() returns translated string in Chinese', () => {
    setLanguage('zh');
    expect(t('welcome.title')).toBe('Work Skills 安装器');
  });

  test('t() returns key for missing translation', () => {
    setLanguage('en');
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  test('setLanguage overrides detection', () => {
    process.env.LANG = 'en_US.UTF-8';
    setLanguage('zh');
    expect(getLanguage()).toBe('zh');
  });
});
