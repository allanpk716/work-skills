'use strict';

const { detectPython } = require('../../src/detectors/python.js');
const execa = require('execa');

jest.mock('execa');

describe('Python Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectPython returns installed: true when Python 3.8+ is available', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Python 3.11.0'
    });

    const result = await detectPython();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('3.11.0');
    expect(result.meetsMinimum).toBe(true);
    expect(result.command).toBe('python');
    expect(result.name).toBe('Python');
  });

  test('detectPython returns installed: false when Python is not found', async () => {
    execa.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await detectPython();

    expect(result.installed).toBe(false);
    expect(result.version).toBeNull();
    expect(result.meetsMinimum).toBe(false);
    expect(result.command).toBeNull();
  });

  test('detectPython returns meetsMinimum: false for Python < 3.8', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Python 3.7.0'
    });

    const result = await detectPython();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('3.7.0');
    expect(result.meetsMinimum).toBe(false);
  });

  test('detectPython returns meetsMinimum: true for Python >= 3.8', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Python 3.8.0'
    });

    const result = await detectPython();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('3.8.0');
    expect(result.meetsMinimum).toBe(true);
  });

  test('detectPython tries multiple commands (python, python3, py)', async () => {
    // First command (python) fails
    execa.mockRejectedValueOnce(new Error('ENOENT'));
    // Second command (python3) fails
    execa.mockRejectedValueOnce(new Error('ENOENT'));
    // Third command (py) succeeds
    execa.mockResolvedValueOnce({
      stdout: 'Python 3.10.5'
    });

    const result = await detectPython();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('3.10.5');
    expect(result.command).toBe('py');
    expect(execa).toHaveBeenCalledTimes(3);
  });

  test('detectPython returns guidance key', async () => {
    execa.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await detectPython();

    expect(result.guidance).toBe('guidance.installPython');
  });

  test('detectPython handles Python 4.0.0 (future version)', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Python 4.0.0'
    });

    const result = await detectPython();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('4.0.0');
    expect(result.meetsMinimum).toBe(true);
  });
});
