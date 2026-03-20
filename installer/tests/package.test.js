'use strict';

const fs = require('fs');
const path = require('path');

describe('Package Configuration', () => {
  const packageJsonPath = path.join(__dirname, '../package.json');
  let packageJson;

  beforeAll(() => {
    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }
  });

  test('package.json exists with name "@allanpk716/work-skills-setup"', () => {
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    expect(packageJson).toBeDefined();
    expect(packageJson.name).toBe('@allanpk716/work-skills-setup');
  });

  test('package.json contains "bin" field mapping "work-skills-setup" to "./bin/setup.js"', () => {
    expect(packageJson.bin).toBeDefined();
    expect(packageJson.bin['work-skills-setup']).toBe('./bin/setup.js');
  });

  test('package.json contains "files" field including ["bin", "src"]', () => {
    expect(packageJson.files).toBeDefined();
    expect(packageJson.files).toContain('bin');
    expect(packageJson.files).toContain('src');
  });

  test('package.json contains engines.node >= "16.0.0"', () => {
    expect(packageJson.engines).toBeDefined();
    expect(packageJson.engines.node).toBe('>=16.0.0');
  });
});
