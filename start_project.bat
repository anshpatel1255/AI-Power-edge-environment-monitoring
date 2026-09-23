@echo off
title Code Vortex - Environment Monitoring System Launcher
color 0A

echo =====================================================================
echo   Code Vortex - Environmental Monitoring System
echo =====================================================================
echo.
echo Starting all system services in dedicated terminal windows...
echo.

:: 1. Start ESP32 USB COM Bridge (Port 4001)
echo [1/3] Starting ESP32 Serial Hardware Bridge on Port 4001...
start "Code Vortex - ESP32 Hardware Bridge (Port 4001)" cmd /k "python -u aegisnet\scripts\com7_bridge.py"

:: 2. Start Frontend UI (Port 3000)
echo [2/3] Starting Vite Frontend on http://localhost:3000...
start "Code Vortex - Frontend Web UI (Port 3000)" cmd /k "cd aegisnet\frontend && npm run dev"

:: 3. Start Backend Node Server (Port 4000)
echo [3/3] Starting Backend API Server on Port 4000...
start "Code Vortex - Backend API (Port 4000)" cmd /k "cd aegisnet\backend-node && npm start"

echo.
echo =====================================================================
echo   All services have been launched!
echo.
echo   - Web UI:         http://localhost:3000
echo   - COM Bridge:     http://localhost:4001/api/stream
echo   - Backend API:    http://localhost:4000
echo =====================================================================
echo.
pause
