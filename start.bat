@echo off
title SmartUps Pro - Local Preview Server
echo Starting SmartUps Pro Server...
start http://localhost:3000
"C:\Users\WINDOW 10\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
pause
