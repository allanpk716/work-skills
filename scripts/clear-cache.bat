@echo off
REM Claude Notify Plugin Cache Cleaner
REM This script clears the plugin cache to force reload of hooks configuration

echo ========================================
echo Claude Notify - Cache Cleaner
echo ========================================
echo.

REM Set cache path
set CACHE_PATH=%USERPROFILE%\.claude\plugins\cache\work-skills\claude-notify

REM Check if cache exists
if not exist "%CACHE_PATH%" (
    echo [INFO] Cache directory not found: %CACHE_PATH%
    echo [INFO] Cache may already be cleared or not yet created.
    goto :end
)

REM Display cache info
echo [INFO] Cache directory found: %CACHE_PATH%
echo.

REM Delete cache
echo [ACTION] Clearing plugin cache...
rmdir /s /q "%CACHE_PATH%" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Cache cleared successfully!
) else (
    echo [ERROR] Failed to clear cache. Please close Claude Code and try again.
    goto :end
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. CLOSE Claude Code completely
echo 2. RESTART Claude Code
echo 3. The plugin cache will be rebuilt automatically
echo.
echo To verify cache was rebuilt, run:
echo   type "%USERPROFILE%\.claude\plugins\cache\work-skills\claude-notify\1.0.0\hooks\hooks.json"
echo.

:end
echo ========================================
pause
