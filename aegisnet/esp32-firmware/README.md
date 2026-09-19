# 🔌 AegisNet ESP32 Multi-Node Hardware Integration Guide

This guide details how to flash and run the **4-Board ESP32 Mesh Network** for live dynamic telemetry ingestion into the AegisNet Command Center via **USB COM7**.

---

## 🏛️ System Topology

```
+---------------------+        +---------------------+        +---------------------+
|   ESP32 Sensor 1    |        |   ESP32 Sensor 2    |        |   ESP32 Sensor 3    |
|    (ESP32-FLOOD)    |        |   (ESP32-COTEMP)    |        |  (ESP32-POLLUTION)  |
|  Water Depth + Soil |        |  CO Gas + Temp/Flame|        | PM2.5 + NH3/Methane |
+----------+----------+        +----------+----------+        +----------+----------+
           |                              |                              |
           \-----------------------\      |      /-----------------------/
                                   ESP-NOW 2.4GHz Wireless
                                          v
                               +---------------------+
                               |  USB ESP32 Gateway  |
                               |    (Coordinator)    |
                               +----------+----------+
                                          |
                                    USB Serial (COM7)
                                     @ 115200 baud
                                          v
                            +-----------------------------+
                            | AegisNet Command Center UI  |
                            | (Google Chrome / MS Edge)   |
                            +-----------------------------+
```

---

## 📋 Pinout & Sensor Wiring

### 1. USB Gateway ESP32 (`ESP32_USB_Gateway.ino`)
- **Connection**: Plug directly into your computer's USB port (assigned as **COM7**).
- **Wiring**: No external sensors needed. Runs the ESP-NOW receiver and relays packets to USB Serial.

### 2. Node 1: Flood & Water Level (`ESP32_Sensor_Flood.ino`)
| Sensor | Sensor Pin | ESP32 Pin | Note |
|---|---|---|---|
| **HC-SR04 Ultrasonic** | VCC | 5V / VIN | Distance to water surface |
| | GND | GND | |
| | TRIG | GPIO 5 | Digital Output trigger |
| | ECHO | GPIO 18 | Digital Input echo |
| **Soil Moisture Sensor** | VCC | 3.3V | Ground saturation |
| | GND | GND | |
| | A0 / SIG | GPIO 34 (ADC1) | Analog reading |

### 3. Node 2: Fire, CO & Thermal (`ESP32_Sensor_Fire_CO.ino`)
| Sensor | Sensor Pin | ESP32 Pin | Note |
|---|---|---|---|
| **MQ-7 CO Gas Sensor** | VCC | 5V / VIN | Carbon monoxide detection |
| | GND | GND | |
| | A0 / SIG | GPIO 35 (ADC1) | Analog ppm calculation |
| **Flame IR Sensor** | VCC | 3.3V / 5V | Optical fire detection |
| | GND | GND | |
| | D0 | GPIO 19 | Active LOW digital interrupt |
| **DHT11 / DHT22** | VCC | 3.3V | Ambient temperature & humidity |
| | DATA | GPIO 4 | Pull-up resistor recommended |
| | GND | GND | |

### 4. Node 3: Air Pollution & Gas (`ESP32_Sensor_Pollution.ino`)
| Sensor | Sensor Pin | ESP32 Pin | Note |
|---|---|---|---|
| **MQ-135 Air Quality** | VCC | 5V / VIN | NH3, Ammonia, Benzene |
| | GND | GND | |
| | A0 / SIG | GPIO 32 (ADC1) | Analog air quality |
| **MQ-4 Methane / CNG** | VCC | 5V / VIN | Natural gas / Methane leak |
| | GND | GND | |
| | A0 / SIG | GPIO 33 (ADC1) | Analog gas percentage |
| **Optical Dust / PM2.5** | VCC | 5V | Particulate laser/IR sensor |
| | VOUT | GPIO 36 (VP) | Analog dust density |

---

## ⚡ How to Connect & View Dynamic Data

### Method A: Direct In-Browser Web Serial (Recommended)
1. Plug your USB Gateway ESP32 into your computer (**COM7**).
2. Open the AegisNet website in **Google Chrome** or **Microsoft Edge** at `http://localhost:3000/dashboard`.
3. In the top navbar, click the **"⚡ USB ESP32"** button (or click **"Connect USB ESP32"** in the hardware banner).
4. The **ESP32 Gateway USB Terminal & Diagnostics** modal will appear.
5. Click **"Connect COM7 (Web Serial)"**.
6. Select your ESP32's COM port in the browser popup (lists `COM7` / Silicon Labs CP210x / CH340).
7. **Done!** You will immediately see:
   - Raw incoming JSON packets streaming in the terminal with millisecond timestamps.
   - All 3 sensor node telemetry cards updating live in real-time.
   - Hero metrics, sensor health cards, live map markers, and history curves automatically reacting!

### Method B: Background Python COM7 Bridge (Optional)
If you prefer running a background script or are testing on other browsers:
```bash
python aegisnet/scripts/com7_bridge.py
```
The bridge connects to **COM7 @ 115200 baud** and broadcasts telemetry to `http://localhost:4001/api/stream`. The AegisNet website automatically detects and syncs with it!
