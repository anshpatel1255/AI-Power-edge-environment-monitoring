@echo off
title AegisNet Live ESP32 COM Bridge (Port 4001)
color 0B
echo.
echo =================================================================
echo   AegisNet ESP32 Hardware Bridge (Auto-detects COM8 / COM7)
echo   Streams live telemetry to Frontend at http://localhost:4001/api/stream
echo =================================================================
echo.
python -u scripts\com7_bridge.py
pause
