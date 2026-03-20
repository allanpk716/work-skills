'use strict';

const { detectGit } = require('../../src/detectors/git.js');
const execa = require('execa');

jest.mock('execa');

describe('Git Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectGit returns installed: true when Git is available', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'git version 2.43.0.windows.1'
    });

    const result = await detectGit();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('2.43.0');
    expect(result.meetsMinimum).toBe(true);
    expect(result.command).toBe('git');
    expect(result.name).toBe('Git');
  });

  test('detectGit returns installed: false when Git is not found', async () => {
    execa.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await detectGit();

    expect(result.installed).toBe(false);
    expect(result.version).toBeNull();
    expect(result.meetsMinimum).toBe(false);
    expect(result.command).toBeNull();
  });

  test('detectGit extracts version from Windows format', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'git version 2.43.0.windows.1'
    });

    const result = await detectGit();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('2.43.0');
  });

  test('detectGit returns meetsMinimum: true (any version acceptable)', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'git version 1.0.0'
    });

    const result = await detectGit();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('1.0.0');
    expect(result.meetsMinimum).toBe(true);
  });

  test('detectGit returns guidance key', async () => {
    execa.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await detectGit();

    expect(result.guidance).toBe('guidance.installGit');
  });

  test('detectGit handles standard version format', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'git version 2.43.0'
    });

    const result = await detectGit();

    expect(result.installed).toBe(true);
    expect(result.version).toBe('2.43.0');
  });
});
