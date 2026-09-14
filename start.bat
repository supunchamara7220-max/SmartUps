@echo off
title SmartUps Pro - Local Preview Server
echo Starting SmartUps Pro Server...
start http://localhost:3000
node local-server.js
if %errorlevel% neq 0 (
    "C:\Users\WINDOW 10\AppData\Roaming\Antigravity\bin\agy-node.cmd" local-server.js
)
pause
