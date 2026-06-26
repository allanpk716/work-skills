'use strict';

// Mock all external dependencies (Phase 54: paths.js provides plugin detection helpers)
jest.mock('../../src/uninstall/paths.js', () => ({
  isPluginInstalled: jest.fn(),
  getSkillsDir: jest.fn()
}));

jest.mock('../../src/hooks/hooks-installer.js', () => ({
  isHooksInstalled: jest.fn(),
  isHooksRegistered: jest.fn(),
  isCommandsInstalled: jest.fn(),
  getHooksDir: jest.fn(),
  getCommandsDir: jest.fn()
}));

jest.mock('../../src/configurators/pushover.js', () => ({
  detectPushoverFull: jest.fn()
}));

const { detectAllInstalled } = require('../../src/uninstall/detector.js');
const { isPluginInstalled, getSkillsDir } = require('../../src/uninstall/paths.js');
const { isHooksInstalled, isHooksRegistered, isCommandsInstalled, getHooksDir, getCommandsDir } = require('../../src/hooks/hooks-installer.js');
const { detectPushoverFull } = require('../../src/configurators/pushover.js');

describe('Uninstall Detector', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: nothing installed
    isPluginInstalled.mockReturnValue(false);
    getSkillsDir.mockReturnValue('C:/Users/test/.claude/skills');
    isHooksInstalled.mockReturnValue(false);
    isHooksRegistered.mockReturnValue(false);
    isCommandsInstalled.mockReturnValue(false);
    getHooksDir.mockReturnValue('C:/Users/test/.claude/hooks');
    getCommandsDir.mockReturnValue('C:/Users/test/.claude/commands');
    detectPushoverFull.mockResolvedValue({ token: null, user: null });
  });

  test('returns correct structure with all expected keys', async () => {
    const result = await detectAllInstalled();

    expect(result).toHaveProperty('plugins');
    expect(result).toHaveProperty('hooksScripts');
    expect(result).toHaveProperty('hooksRegistered');
    expect(result).toHaveProperty('commandsInstalled');
    expect(result).toHaveProperty('envVars');
    expect(result).toHaveProperty('hasAnyInstalled');
  });

  test('plugins array has 1 entry (claude-notify only)', async () => {
    const result = await detectAllInstalled();

    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]).toHaveProperty('name', 'claude-notify');
    expect(result.plugins[0]).toHaveProperty('installed');
    expect(result.plugins[0]).toHaveProperty('path');
  });

  test('detects installed plugins', async () => {
    isPluginInstalled.mockImplementation((name) => name === 'claude-notify');

    const result = await detectAllInstalled();

    expect(result.plugins[0].installed).toBe(true);
    expect(result.plugins[0].name).toBe('claude-notify');
    expect(result.plugins[0].path).toContain('claude-notify');
  });

  test('detects hook scripts', async () => {
    isHooksInstalled.mockReturnValue(true);

    const result = await detectAllInstalled();

    expect(result.hooksScripts.installed).toBe(true);
    expect(result.hooksScripts).toHaveProperty('path');
  });

  test('detects hook scripts not installed', async () => {
    isHooksInstalled.mockReturnValue(false);

    const result = await detectAllInstalled();

    expect(result.hooksScripts.installed).toBe(false);
  });

  test('detects hook registration', async () => {
    isHooksRegistered.mockReturnValue(true);

    const result = await detectAllInstalled();

    expect(result.hooksRegistered.installed).toBe(true);
    expect(result.hooksRegistered).toHaveProperty('path');
  });

  test('detects hook registration not installed', async () => {
    isHooksRegistered.mockReturnValue(false);

    const result = await detectAllInstalled();

    expect(result.hooksRegistered.installed).toBe(false);
  });

  test('detects slash commands', async () => {
    isCommandsInstalled.mockReturnValue(true);

    const result = await detectAllInstalled();

    expect(result.commandsInstalled.installed).toBe(true);
    expect(result.commandsInstalled).toHaveProperty('path');
  });

  test('detects slash commands not installed', async () => {
    isCommandsInstalled.mockReturnValue(false);

    const result = await detectAllInstalled();

    expect(result.commandsInstalled.installed).toBe(false);
  });

  test('detects pushover env vars installed', async () => {
    detectPushoverFull.mockResolvedValue({ token: 'abc123', user: 'xyz789' });

    const result = await detectAllInstalled();

    expect(result.envVars.token.name).toBe('PUSHOVER_TOKEN');
    expect(result.envVars.token.installed).toBe(true);
    expect(result.envVars.user.name).toBe('PUSHOVER_USER');
    expect(result.envVars.user.installed).toBe(true);
  });

  test('detects pushover env vars not installed', async () => {
    detectPushoverFull.mockResolvedValue({ token: null, user: null });

    const result = await detectAllInstalled();

    expect(result.envVars.token.installed).toBe(false);
    expect(result.envVars.user.installed).toBe(false);
  });

  test('detects partial pushover env vars (token only)', async () => {
    detectPushoverFull.mockResolvedValue({ token: 'abc123', user: null });

    const result = await detectAllInstalled();

    expect(result.envVars.token.installed).toBe(true);
    expect(result.envVars.user.installed).toBe(false);
  });

  test('hasAnyInstalled is true when at least one item is installed', async () => {
    isPluginInstalled.mockImplementation((name) => name === 'claude-notify');

    const result = await detectAllInstalled();

    expect(result.hasAnyInstalled).toBe(true);
  });

  test('hasAnyInstalled is true when env var is set', async () => {
    detectPushoverFull.mockResolvedValue({ token: 'abc123', user: null });

    const result = await detectAllInstalled();

    expect(result.hasAnyInstalled).toBe(true);
  });

  test('hasAnyInstalled is false when nothing is installed', async () => {
    // Defaults: all return false/null
    const result = await detectAllInstalled();

    expect(result.hasAnyInstalled).toBe(false);
  });

  test('calls the correct underlying detection functions', async () => {
    await detectAllInstalled();

    expect(isPluginInstalled).toHaveBeenCalledWith('claude-notify');
    expect(isHooksInstalled).toHaveBeenCalled();
    expect(isHooksRegistered).toHaveBeenCalled();
    expect(isCommandsInstalled).toHaveBeenCalled();
    expect(detectPushoverFull).toHaveBeenCalled();
  });
});
