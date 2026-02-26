"""
Security rule activation tests - verify all SENS rules are working
Phase 11: Fix Orphaned Security Rules
"""
import sys
from pathlib import Path

# Add plugin path for imports
plugin_root = Path(__file__).parent.parent / "plugins" / "windows-git-commit" / "skills" / "windows-git-commit"
sys.path.insert(0, str(plugin_root))

import pytest
from scanner.rules import PGP_KEY_RULE, PEM_CERT_RULE


def test_pgp_key_rule_pattern():
    """Test PGP private key detection pattern (SENS-05)"""
    # Standard PGP private key block
    content = """-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: GnuPG v1

lQOYBFx...
-----END PGP PRIVATE KEY BLOCK-----"""

    matches = list(PGP_KEY_RULE.pattern.finditer(content))
    assert len(matches) == 1, "Should detect PGP private key block"
    assert "BEGIN PGP PRIVATE KEY BLOCK" in matches[0].group(0)

    # Case sensitivity
    content_lower = content.lower()
    matches_lower = list(PGP_KEY_RULE.pattern.finditer(content_lower))
    assert len(matches_lower) == 1, "Should be case-insensitive"


def test_pem_cert_rule_pattern():
    """Test PEM certificate detection pattern (SENS-06)"""
    # Standard PEM certificate
    content = """-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKN7MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
-----END CERTIFICATE-----"""

    matches = list(PEM_CERT_RULE.pattern.finditer(content))
    assert len(matches) == 1, "Should detect PEM certificate"
    assert "BEGIN CERTIFICATE" in matches[0].group(0)


def test_pgp_key_in_config_file():
    """Test PGP key detection in realistic scenario"""
    content = """
# Configuration file
database_url = "postgresql://localhost/mydb"

# PGP key for signing
signing_key = '''-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: GnuPG v2

mQENBFx...
-----END PGP PRIVATE KEY BLOCK-----'''

api_key = "secret123"
"""

    matches = list(PGP_KEY_RULE.pattern.finditer(content))
    assert len(matches) == 1, "Should detect embedded PGP key"


def test_multiple_pem_certs():
    """Test detection of multiple PEM certificates in one file"""
    content = """
Certificate chain:
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKN7MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKN8MA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
-----END CERTIFICATE-----
"""

    matches = list(PEM_CERT_RULE.pattern.finditer(content))
    assert len(matches) == 2, "Should detect all PEM certificates"


def test_rule_metadata():
    """Verify rule metadata is correctly defined"""
    assert PGP_KEY_RULE.rule_id == "SENS-05"
    assert "pgp" in PGP_KEY_RULE.tags
    assert "private-key" in PGP_KEY_RULE.tags
    assert "critical" in PGP_KEY_RULE.tags

    assert PEM_CERT_RULE.rule_id == "SENS-06"
    assert "pem" in PEM_CERT_RULE.tags
    assert "certificate" in PEM_CERT_RULE.tags
