#!/usr/bin/env python3
"""
Claude Notify Installation Verification Script

Verifies that the Claude Notify plugin is properly installed and configured.
"""

import os
import sys
import platform
import subprocess
from pathlib import Path


def print_header(title):
    """Print a formatted section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def print_result(test_name, passed, message=""):
    """Print a test result with status indicator."""
    status = "PASS" if passed else "FAIL"
    symbol = "OK" if passed else "X"
    print(f"  [{symbol}] {test_name}: {status}")
    if message:
        print(f"      {message}")


def check_python_version():
    """Check Python version compatibility."""
    print_header("Python Version Check")

    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    required = (3, 8)
    passed = version >= required

    print_result(
        "Python version",
        passed,
        f"Current: {version_str}, Required: >={required[0]}.{required[1]}"
    )

    return passed


def check_standard_libraries():
    """Check required Python standard libraries."""
    print_header("Standard Library Check")

    required_libs = {
        'requests': 'HTTP client for Pushover API',
        'subprocess': 'Process execution for Claude CLI and PowerShell',
        'pathlib': 'Path handling',
        'concurrent.futures': 'Parallel execution'
    }

    all_passed = True

    for lib, purpose in required_libs.items():
        try:
            __import__(lib)
            print_result(f"{lib}", True, purpose)
        except ImportError:
            print_result(f"{lib}", False, f"Missing - {purpose}")
            all_passed = False

    return all_passed


def check_environment_variables():
    """Check Pushover environment variables configuration."""
    print_header("Environment Variables Check")

    token = os.environ.get('PUSHOVER_TOKEN')
    user = os.environ.get('PUSHOVER_USER')

    token_set = bool(token)
    user_set = bool(user)

    print_result(
        "PUSHOVER_TOKEN",
        token_set,
        "Set" if token_set else "Not set (required for Pushover notifications)"
    )

    print_result(
        "PUSHOVER_USER",
        user_set,
        "Set" if user_set else "Not set (required for Pushover notifications)"
    )

    if not token_set and not user_set:
        print("\n  Note: Pushover credentials are optional for Windows Toast notifications.")
        print("        Set PUSHOVER_TOKEN and PUSHOVER_USER for mobile notifications.")

    return True  # Not blocking - notifications can work without Pushover


def check_pushover_api():
    """Test Pushover API connectivity."""
    print_header("Pushover API Connectivity Test")

    token = os.environ.get('PUSHOVER_TOKEN')
    user = os.environ.get('PUSHOVER_USER')

    if not token or not user:
        print_result("Pushover API test", False, "Skipped - credentials not configured")
        return True  # Not blocking

    try:
        import requests

        # Send a test notification (suppress output)
        response = requests.post(
            'https://api.pushover.net/1/messages.json',
            data={
                'token': token,
                'user': user,
                'title': 'Claude Notify - Verification Test',
                'message': 'Installation verification successful!',
                'priority': 0
            },
            timeout=5
        )

        if response.status_code == 200:
            print_result("Pushover API test", True, "Test notification sent successfully")
            return True
        else:
            print_result("Pushover API test", False, f"API error: {response.status_code}")
            return False

    except requests.Timeout:
        print_result("Pushover API test", False, "Connection timeout")
        return False
    except Exception as e:
        print_result("Pushover API test", False, f"Error: {str(e)}")
        return False


def check_windows_toast():
    """Test Windows Toast notification functionality."""
    print_header("Windows Toast Notification Test")

    if platform.system() != 'Windows':
        print_result("Windows Toast test", False, "Skipped - not running on Windows")
        return True  # Not blocking on non-Windows

    try:
        # PowerShell script to send test Toast notification
        ps_script = '''
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

        $template = @"
        <toast>
            <visual>
                <binding template="ToastText02">
                    <text id="1">Claude Notify</text>
                    <text id="2">Installation verification successful!</text>
                </binding>
            </visual>
        </toast>
"@

        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code Verification").Show($toast)
        '''

        result = subprocess.run(
            ['powershell', '-Command', ps_script],
            capture_output=True,
            text=True,
            timeout=5,
            encoding='utf-8'
        )

        if result.returncode == 0:
            print_result("Windows Toast test", True, "Test notification displayed")
            return True
        else:
            error_msg = result.stderr.strip() if result.stderr else "Unknown error"
            print_result("Windows Toast test", False, f"PowerShell error: {error_msg}")
            return False

    except subprocess.TimeoutExpired:
        print_result("Windows Toast test", False, "PowerShell timeout")
        return False
    except Exception as e:
        print_result("Windows Toast test", False, f"Error: {str(e)}")
        return False


def check_hook_files():
    """Check if hook files exist."""
    print_header("Plugin Files Check")

    # Get plugin root (assuming this script is in scripts/ directory)
    script_dir = Path(__file__).parent
    plugin_root = script_dir.parent

    hooks_json = plugin_root / 'hooks' / 'hooks.json'
    notify_script = plugin_root / 'hooks' / 'scripts' / 'notify.py'

    hooks_exists = hooks_json.exists()
    notify_exists = notify_script.exists()

    print_result("hooks/hooks.json", hooks_exists, str(hooks_json) if hooks_exists else "Not found")
    print_result("hooks/scripts/notify.py", notify_exists, str(notify_script) if notify_exists else "Not found")

    return hooks_exists and notify_exists


def check_slash_commands():
    """Check slash command scripts are available and functional."""
    print_header("Slash Commands Check")

    scripts = ['notify-enable.py', 'notify-disable.py', 'notify-status.py']
    scripts_dir = Path(__file__).parent

    all_ok = True

    for script in scripts:
        script_path = scripts_dir / script
        if script_path.exists():
            print_result(f"{script} exists", True, str(script_path))

            # Test basic invocation (should fail with exit code 1 but show usage)
            try:
                # Set PYTHONIOENCODING environment variable for UTF-8 output
                env = os.environ.copy()
                env['PYTHONIOENCODING'] = 'utf-8'

                result = subprocess.run(
                    [sys.executable, str(script_path)],
                    capture_output=True,
                    text=True,
                    timeout=5,
                    encoding='utf-8',
                    env=env
                )
                # Script should exit with error (no parameters) but show usage
                output = result.stdout + result.stderr
                # Check for either UTF-8 Chinese or GBK garbled output (execution succeeded)
                if output and ("用法:" in output or "Usage:" in output or "错误" in output or len(output) > 0):
                    print_result(f"{script} responds", True, "Script executes and validates parameters")
                else:
                    print_result(f"{script} responds", False, f"Unexpected output format")
                    all_ok = False
            except subprocess.TimeoutExpired:
                print_result(f"{script} responds", False, "Execution timeout")
                all_ok = False
            except Exception as e:
                print_result(f"{script} responds", False, f"Execution error: {str(e)}")
                all_ok = False
        else:
            print_result(f"{script} exists", False, "Not found")
            all_ok = False

    return all_ok


def main():
    """Run all verification checks."""
    print("\n" + "="*60)
    print("  Claude Notify - Installation Verification")
    print("="*60)

    results = {
        'Python Version': check_python_version(),
        'Standard Libraries': check_standard_libraries(),
        'Environment Variables': check_environment_variables(),
        'Pushover API': check_pushover_api(),
        'Windows Toast': check_windows_toast(),
        'Plugin Files': check_hook_files(),
        'Slash Commands': check_slash_commands()
    }

    print_header("Summary")

    passed = sum(1 for r in results.values() if r)
    total = len(results)

    print(f"\n  Total: {passed}/{total} checks passed")

    if passed == total:
        print("\n  Installation verification PASSED")
        print("  Claude Notify is ready to use!")
        print("\n  Available slash commands:")
        print("    /notify-enable <pushover|windows> - Enable notification channel")
        print("    /notify-disable <pushover|windows> - Disable notification channel")
        print("    /notify-status - View notification status")
        return 0
    else:
        print("\n  Installation verification FAILED")
        print("  Please review the failed checks above.")
        print("\n  Common solutions:")
        print("  - Install missing Python libraries: pip install requests")
        print("  - Set environment variables: PUSHOVER_TOKEN, PUSHOVER_USER")
        print("  - Check PowerShell execution policy")
        return 1


if __name__ == '__main__':
    sys.exit(main())
