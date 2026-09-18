@echo off
title AegisNet ESP32 Serial Bridge
color 0A
echo.
echo  =========================================================
echo   AegisNet ESP32 Serial Bridge - Auto-Detection System
echo  =========================================================
echo.
echo  [*] Checking Python installation...
python --version 2>NUL
if errorlevel 1 (
    echo  [ERROR] Python not found! Please install Python 3.8+ from python.org
    pause
    exit /b 1
)
echo  [*] Installing required packages...
pip install pyserial paho-mqtt --quiet
echo  [*] Starting Serial Bridge...
echo  [*] Connect your ESP32 via USB - it will be auto-detected!
echo  [*] Press Ctrl+C to stop the bridge
echo.
python serial_bridge.py
pause
