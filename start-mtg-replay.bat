@echo off
title MTG Arena Replay Viewer
cd /d "%~dp0"
echo Starting MTG Arena Replay Viewer...
echo The browser will open automatically. Close this window to stop the server.
echo.
npm run dev -- --open
