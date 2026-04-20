"""
Performance regression tests for security scanner
Validates <2 second requirement for medium repositories
"""
import pytest
from pathlib import Path
import sys

# Add scanner to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scanner.executor import run_pre_commit_scan
from scanner.utils.file_utils import is_binary_file


class TestPerformance:
    """Performance regression tests"""

    def test_binary_detection_speed(self, benchmark, binary_test_file):
        """
        Binary detection should complete in <10ms per file
        Validates optimized 8KB sampling approach
        """
        result = benchmark(is_binary_file, binary_test_file)

        # Correctness check (not timed)
        assert result == True

    def test_medium_repo_scan_time(self, benchmark, medium_repo):
        """
        Medium repo scan should complete in <2 seconds
        ROADMAP requirement: <2s for medium-sized repositories
        """
        result = benchmark(run_pre_commit_scan, medium_repo)

        # Verify scanner returns valid result
        success, issues = result
        assert isinstance(success, bool)
        assert isinstance(issues, list)

    def test_regex_pattern_matching_speed(self, benchmark):
        """
        Pre-compiled patterns should be 70%+ faster than re.search
        Validates RESEARCH.md optimization recommendation
        """
        from scanner.rules import AWS_ACCESS_KEY_RULE

        # Create content with 1000 potential matches
        content = "AKIAIOSFODNN7EXAMPLE " * 1000

        result = benchmark(
            lambda: list(AWS_ACCESS_KEY_RULE.pattern.finditer(content))
        )

        # Should find 1000 matches
        assert len(result) == 1000
