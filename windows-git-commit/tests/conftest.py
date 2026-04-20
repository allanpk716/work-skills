"""
Shared pytest fixtures for security scanner tests
Provides test repository fixtures for performance benchmarking
"""
import pytest
from pathlib import Path
import tempfile
import shutil


@pytest.fixture
def small_repo(tmp_path):
    """
    Small test repository: <100 files
    Simulates small project for quick unit tests
    """
    repo = tmp_path / "small_repo"
    repo.mkdir()

    # Create 50 Python files
    for i in range(50):
        (repo / f"module_{i}.py").write_text(f"# Module {i}\n\ndef func_{i}():\n    pass\n")

    # Create some config files
    (repo / "config.json").write_text('{"key": "value"}\n')
    (repo / "README.md").write_text("# Test Repository\n")

    return repo


@pytest.fixture
def medium_repo(tmp_path):
    """
    Medium test repository: 100-1000 files
    Simulates typical project for <2 second performance requirement
    """
    repo = tmp_path / "medium_repo"
    repo.mkdir()

    # Create 500 source files
    for i in range(500):
        (repo / f"file_{i}.py").write_text(f"# File {i}\n\nclass Class{i}:\n    pass\n")

    # Create nested directories
    for subdir in ["src", "tests", "docs"]:
        (repo / subdir).mkdir()
        for i in range(50):
            (repo / subdir / f"{subdir}_file_{i}.py").write_text(f"# {subdir} file {i}\n")

    return repo


@pytest.fixture
def large_repo(tmp_path):
    """
    Large test repository: >1000 files
    Simulates large monorepo for stress testing
    """
    repo = tmp_path / "large_repo"
    repo.mkdir()

    # Create 2000 files
    for i in range(2000):
        (repo / f"large_file_{i}.py").write_text(f"# Large file {i}\n")

    return repo


@pytest.fixture
def binary_test_file(tmp_path):
    """Binary file for testing binary detection"""
    binary_file = tmp_path / "test.bin"
    # Write null bytes to simulate binary content
    binary_file.write_bytes(b'\x00\x01\x02\x03' * 100)
    return binary_file
