@echo off
REM test.bat - Run all tests for claude-notify skill
REM This script runs the Python unittest test suite

echo ====================================
echo Claude Notify - Test Suite
echo ====================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Run tests with verbosity
python -m unittest discover -s tests -v

echo.
echo ====================================
echo Tests complete.
echo ====================================
pause
