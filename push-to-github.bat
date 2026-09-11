@echo off
title SmartUps Pro - Push to GitHub
echo ===================================================
echo ⚡ SmartUps - Pushing to GitHub Repository
echo Repository: https://github.com/supunchamara7220-max/SmartUps.git
echo ===================================================
echo.
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo [SUCCESS] All files pushed to GitHub successfully!
    echo Visit: https://github.com/supunchamara7220-max/SmartUps
    echo ===================================================
) else (
    echo ---------------------------------------------------
    echo If prompted, sign in via browser or enter your
    echo GitHub Personal Access Token.
    echo ---------------------------------------------------
)
pause
