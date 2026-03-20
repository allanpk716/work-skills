'use strict';

const { detectPipPackage } = require('../../src/detectors/pip-package.js');
const { execa } = require('execa');

jest.mock('execa');

describe('Pip Package Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detectPipPackage returns installed: true when package exists', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Name: requests\nVersion: 2.31.0\nSummary: Python HTTP for Humans.\n...'
    });

    const result = await detectPipPackage('requests');

    expect(result.installed).toBe(true);
    expect(result.version).toBe('2.31.0');
    expect(result.name).toBe('requests');
    expect(result.meetsMinimum).toBe(true);
  });

  test('detectPipPackage returns installed: false when package not found', async () => {
    execa.mockRejectedValueOnce(new Error('Package not found'));

    const result = await detectPipPackage('nonexistent-package');

    expect(result.installed).toBe(false);
    expect(result.version).toBeNull();
    expect(result.meetsMinimum).toBe(false);
  });

  test('detectPipPackage extracts version from pip show output', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Name: requests\nVersion: 2.31.0\nSummary: Python HTTP for Humans.'
    });

    const result = await detectPipPackage('requests');

    expect(result.version).toBe('2.31.0');
  });

  test('detectPipPackage uses provided python command', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Name: requests\nVersion: 2.31.0\nSummary: Python HTTP for Humans.'
    });

    await detectPipPackage('requests', 'python3');

    expect(execa).toHaveBeenCalledWith('python3', ['-m', 'pip', 'show', 'requests']);
  });

  test('detectPipPackage returns dynamic guidance key', async () => {
    execa.mockRejectedValueOnce(new Error('Package not found'));

    const result = await detectPipPackage('requests');

    expect(result.guidance).toBe('guidance.installRequests');
  });

  test('detectPipPackage capitalizes package name in guidance key', async () => {
    execa.mockRejectedValueOnce(new Error('Package not found'));

    const result = await detectPipPackage('numpy');

    expect(result.guidance).toBe('guidance.installNumpy');
  });

  test('detectPipPackage handles missing version in output', async () => {
    execa.mockResolvedValueOnce({
      stdout: 'Name: requests\nSummary: Python HTTP for Humans.'
    });

    const result = await detectPipPackage('requests');

    expect(result.installed).toBe(true);
    expect(result.version).toBeNull();
    expect(result.meetsMinimum).toBe(true);
  });
});
