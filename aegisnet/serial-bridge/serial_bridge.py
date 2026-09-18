#!/usr/bin/env python3
"""
AegisNet ESP32 Serial Bridge
Automatically detects ESP32 on USB, parses sensor output,
and publishes to MQTT for real-time dashboard monitoring.

Node types auto-detected:
  - FLOOD NODE        -> ESP32-FLOOD-01
  - CO + TEMPERATURE NODE -> ESP32-COTEMP-01
  - POLLUTION NODE    -> ESP32-POLLUTION-01

Usage: python serial_bridge.py
"""

import serial
import serial.tools.list_ports
import paho.mqtt.client as mqtt
import json
import time
import threading
import sys
import re
from datetime import datetime

# --- Config -----------------------------------------------------------------
MQTT_BROKER    = "localhost"
MQTT_PORT      = 1883
SERIAL_BAUD    = 9600          # match your Arduino baud rate
RECONNECT_DELAY = 5            # seconds between reconnect attempts
PUBLISH_INTERVAL = 2           # seconds between publishes

# ESP32 USB chip vendor/product combos (CP2102, CH340, FTDI, Atmel)
ESP32_VID_PIDS = [
    (0x10C4, 0xEA60),  # Silicon Labs CP2102 (most common ESP32)
    (0x1A86, 0x7523),  # CH340 (cheap ESP32 boards)
    (0x0403, 0x6001),  # FTDI FT232R
    (0x0403, 0x6015),  # FTDI FT231X
    (0x2341, 0x0043),  # Arduino Uno (UNO R3 with sensors)
    (0x2341, 0x0001),  # Arduino Uno (alt PID)
    (0x2341, 0x0010),  # Arduino Uno
    (0x1A86, 0x55D3),  # CH343 (newer boards)
]

# Alert thresholds
THRESHOLDS = {
    "flood": {
        "water_level_cm_warn":    100,   # cm (water close = low distance value)
        "water_level_cm_critical": 50,
        "soil_moisture_warn":      70,   # %
        "soil_moisture_critical":  90,
    },
    "cotemp": {
        "co_ppm_warn":    5,
        "co_ppm_critical": 9,
        "temp_warn":      35,
        "temp_critical":  40,
        "humidity_warn":  90,
    },
    "pollution": {
        "pm25_warn":     35,
        "pm25_critical": 55,
        "pm10_warn":     50,
        "pm10_critical": 100,
    }
}

# --- State ------------------------------------------------------------------
current_node_type = None   # 'flood' | 'cotemp' | 'pollution'
current_readings  = {}
mqtt_client       = None
running           = True

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")

# --- COM Port Auto-Detection -------------------------------------------------
def find_esp32_port():
    """Scan COM ports and return the first ESP32/Arduino port found."""
    ports = list(serial.tools.list_ports.comports())
    
    if not ports:
        return None

    # First pass: match by known VID/PID
    for port in ports:
        if port.vid and port.pid:
            if (port.vid, port.pid) in ESP32_VID_PIDS:
                log(f"[DETECT] Found ESP32/Arduino: {port.device} ({port.description})")
                return port.device

    # Second pass: match by description keywords
    keywords = ['esp32', 'esp8266', 'arduino', 'cp210', 'ch340', 'ftdi', 'usb serial', 'uart']
    for port in ports:
        desc = (port.description or '').lower()
        if any(k in desc for k in keywords):
            log(f"[DETECT] Found by description: {port.device} ({port.description})")
            return port.device

    # Last resort: return first available COM port
    if ports:
        log(f"[DETECT] Using first available port: {ports[0].device} ({ports[0].description})")
        return ports[0].device

    return None

# --- MQTT Setup --------------------------------------------------------------
def connect_mqtt():
    global mqtt_client
    client = mqtt.Client(client_id="aegisnet-serial-bridge")
    
    def on_connect(c, ud, flags, rc):
        if rc == 0:
            log("[MQTT] Connected to broker successfully")
        else:
            log(f"[MQTT] Connection failed, code={rc}")
    
    def on_disconnect(c, ud, rc):
        log(f"[MQTT] Disconnected (rc={rc}), will retry...")
    
    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        client.loop_start()
        mqtt_client = client
        return client
    except Exception as e:
        log(f"[MQTT] Cannot connect to broker: {e}")
        log("[MQTT] Make sure Mosquitto is running (or run: mosquitto -v)")
        return None

# --- Sensor Line Parser -------------------------------------------------------
def parse_line(line: str):
    """Parse a single line from ESP32 serial output. Returns dict of parsed values."""
    global current_node_type, current_readings

    line = line.strip()
    if not line:
        return

    # -- Node Type Header Detection ------------------------------------------
    if "FLOOD NODE" in line.upper():
        current_node_type = "flood"
        current_readings  = {}
        log(f"[PARSE] -- FLOOD NODE detected --")
        return

    if ("CO + TEMPERATURE" in line.upper() or
        "CO+TEMPERATURE"   in line.upper() or
        "CO + TEMP"        in line.upper()):
        current_node_type = "cotemp"
        current_readings  = {}
        log(f"[PARSE] -- CO+TEMPERATURE NODE detected --")
        return

    if "POLLUTION NODE" in line.upper():
        current_node_type = "pollution"
        current_readings  = {}
        log(f"[PARSE] -- POLLUTION NODE detected --")
        return

    if current_node_type is None:
        return  # skip lines before first node header

    # -- FLOOD NODE fields ----------------------------------------------------
    if current_node_type == "flood":
        # "Distance: 141.14 cm" or "Distance: 141.14"
        m = re.search(r'distance[:\s]+([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
        if m:
            current_readings["water_level_cm"] = float(m.group(1))

        # "Soil Moisture: 0.0 %" or "Soil: 45%"
        m = re.search(r'soil[^:]*:\s*([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
        if m:
            current_readings["soil_moisture"] = float(m.group(1))

    # -- CO+TEMP NODE fields ---------------------------------------------------
    elif current_node_type == "cotemp":
        # "CO: 0.5 ppm"
        m = re.search(r'\bCO\b[:\s]+([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
        if m:
            current_readings["gas_ppm"] = float(m.group(1))

        # "DHT11 Temp: 28.0 C" or "DHT11 Humidity: 79.5%"
        m = re.search(r'DHT11\s+Temp[:\s]+([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
        if m:
            current_readings["temperature_c"] = float(m.group(1))

        m = re.search(r'DHT11\s+Hum[:\s]+([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
        if m:
            current_readings["humidity_pct"] = float(m.group(1))

        # "DS18B20 Temp: 28.69 C" — prefer DS18B20 if both present
        m = re.search(r'DS18B20[:\s]+([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
        if m:
            current_readings["temperature_c"] = float(m.group(1))  # override DHT11

    # -- POLLUTION NODE fields -------------------------------------------------
    elif current_node_type == "pollution":
        # "PM1.0=15 ug/m3" or "PM1.0: 15"
        m = re.search(r'PM1\.0[=:\s]+([0-9]+)', line, re.IGNORECASE)
        if m:
            current_readings["pm10_value"] = int(m.group(1))   # store as extra

        # "PM2.5=29 ug/m3"
        m = re.search(r'PM2\.5[=:\s]+([0-9]+)', line, re.IGNORECASE)
        if m:
            current_readings["smoke_aqi"] = int(m.group(1))

        # "PM10=33 ug/m3"
        m = re.search(r'\bPM10[=:\s]+([0-9]+)', line, re.IGNORECASE)
        if m:
            current_readings["pm10"] = int(m.group(1))

        # "MQ-135 / NH3: ADC=1263, Voltage=1.02V, Strength=30.8%, Status=DETECTED"
        m = re.search(r'MQ-?135.*Strength=([0-9]+\.?[0-9]*)%', line, re.IGNORECASE)
        if m:
            current_readings["mq135_strength"] = float(m.group(1))
        m = re.search(r'MQ-?135.*Status=(\w+)', line, re.IGNORECASE)
        if m:
            current_readings["mq135_status"] = m.group(1).upper()  # DETECTED / CLEAR

        # "MQ-7 / CO: ADC=976 ... Status=CLEAR"
        m = re.search(r'MQ-?7.*Strength=([0-9]+\.?[0-9]*)%', line, re.IGNORECASE)
        if m:
            current_readings["mq7_strength"] = float(m.group(1))
        m = re.search(r'MQ-?7.*Status=(\w+)', line, re.IGNORECASE)
        if m:
            current_readings["mq7_status"] = m.group(1).upper()

        # "MQ-4 / CH4: ADC=2399 ... Strength=58.6%, Status=DETECTED"
        m = re.search(r'MQ-?4.*Strength=([0-9]+\.?[0-9]*)%', line, re.IGNORECASE)
        if m:
            current_readings["mq4_strength"] = float(m.group(1))
        m = re.search(r'MQ-?4.*Status=(\w+)', line, re.IGNORECASE)
        if m:
            current_readings["mq4_status"] = m.group(1).upper()

        # Also: "MQ-135: ADC=... Voltage=... Strength=..."
        m = re.search(r'Strength=([0-9]+\.?[0-9]*)%', line, re.IGNORECASE)
        if m and "gas_ppm" not in current_readings:
            current_readings["gas_ppm"] = float(m.group(1))  # use MQ strength as ppm approx

# --- Risk Score Calculator -----------------------------------------------------
def compute_risk(node_type, readings):
    """Compute risk scores (0-100) for each hazard type based on sensor readings."""
    risk_flood      = 0
    risk_fire       = 0
    risk_pollution  = 0
    flame_detected  = False
    alerts          = []

    if node_type == "flood":
        wl = readings.get("water_level_cm", 999)
        sm = readings.get("soil_moisture", 0)

        # Lower distance = water closer to sensor = higher flood risk
        if wl < THRESHOLDS["flood"]["water_level_cm_critical"]:
            risk_flood = 90
            alerts.append(("flood", 90, f"CRITICAL: Water level extremely high (distance only {wl:.1f}cm)"))
        elif wl < THRESHOLDS["flood"]["water_level_cm_warn"]:
            risk_flood = 55
            alerts.append(("flood", 55, f"WARNING: Rising water detected (distance {wl:.1f}cm)"))
        else:
            risk_flood = max(0, int((300 - wl) / 3))  # scale 0-100

        if sm > THRESHOLDS["flood"]["soil_moisture_critical"]:
            risk_flood = max(risk_flood, 75)
        elif sm > THRESHOLDS["flood"]["soil_moisture_warn"]:
            risk_flood = max(risk_flood, 45)

    elif node_type == "cotemp":
        co   = readings.get("gas_ppm", 0)
        temp = readings.get("temperature_c", 25)
        hum  = readings.get("humidity_pct", 50)

        if co > THRESHOLDS["cotemp"]["co_ppm_critical"]:
            risk_fire = 85
            alerts.append(("fire", 85, f"CRITICAL: CO level dangerous ({co:.1f} ppm)"))
        elif co > THRESHOLDS["cotemp"]["co_ppm_warn"]:
            risk_fire = 50
            alerts.append(("fire", 50, f"WARNING: CO elevated ({co:.1f} ppm)"))
        else:
            risk_fire = int(co * 5)

        if temp > THRESHOLDS["cotemp"]["temp_critical"]:
            risk_fire = max(risk_fire, 80)
            alerts.append(("fire", 80, f"CRITICAL: High temperature ({temp:.1f}°C)"))
        elif temp > THRESHOLDS["cotemp"]["temp_warn"]:
            risk_fire = max(risk_fire, 45)

    elif node_type == "pollution":
        pm25 = readings.get("smoke_aqi", 0)
        pm10 = readings.get("pm10", 0)
        nh3  = readings.get("mq135_status", "CLEAR")
        ch4  = readings.get("mq4_status",   "CLEAR")

        if pm25 > THRESHOLDS["pollution"]["pm25_critical"]:
            risk_pollution = 88
            alerts.append(("pollution", 88, f"CRITICAL: PM2.5 very high ({pm25} µg/m³)"))
        elif pm25 > THRESHOLDS["pollution"]["pm25_warn"]:
            risk_pollution = 52
            alerts.append(("pollution", 52, f"WARNING: PM2.5 elevated ({pm25} µg/m³)"))
        else:
            risk_pollution = int(pm25 * 1.5)

        if nh3 == "DETECTED":
            risk_pollution = max(risk_pollution, 60)
            alerts.append(("pollution", 60, "WARNING: NH3 ammonia gas detected by MQ-135"))
        if ch4 == "DETECTED":
            risk_pollution = max(risk_pollution, 65)
            alerts.append(("pollution", 65, "WARNING: CH4 methane detected by MQ-4"))

    return risk_flood, risk_fire, risk_pollution, flame_detected, alerts

# --- MQTT Publisher ----------------------------------------------------------
def publish_reading(node_id, node_type, readings):
    if mqtt_client is None:
        return

    risk_flood, risk_fire, risk_pollution, flame_detected, alerts = compute_risk(node_type, readings)

    payload = {
        "node_id":         node_id,
        "node_type":       node_type,
        "water_level_cm":  readings.get("water_level_cm", None),
        "soil_moisture":   readings.get("soil_moisture", None),
        "flame_detected":  flame_detected,
        "smoke_aqi":       readings.get("smoke_aqi", None),
        "pm10":            readings.get("pm10", None),
        "temperature_c":   readings.get("temperature_c", None),
        "humidity_pct":    readings.get("humidity_pct", None),
        "gas_ppm":         readings.get("gas_ppm", None),
        "mq135_strength":  readings.get("mq135_strength", None),
        "mq135_status":    readings.get("mq135_status", None),
        "mq7_strength":    readings.get("mq7_strength", None),
        "mq7_status":      readings.get("mq7_status", None),
        "mq4_strength":    readings.get("mq4_strength", None),
        "mq4_status":      readings.get("mq4_status", None),
        "risk_flood":      risk_flood,
        "risk_fire":       risk_fire,
        "risk_pollution":  risk_pollution,
        "battery_pct":     100,
        "rssi":            -65,
        "solar_charging":  False,
        "timestamp":       datetime.utcnow().isoformat() + "Z",
    }

    topic = f"aegisnet/{node_id}/telemetry"
    result = mqtt_client.publish(topic, json.dumps(payload), qos=1)
    log(f"[MQTT] Published to {topic} | flood={risk_flood} fire={risk_fire} poll={risk_pollution}")

    # Publish alerts if thresholds breached
    for (hazard, score, msg) in alerts:
        alert_payload = {"hazard": hazard, "risk_score": score, "message": msg}
        mqtt_client.publish(f"aegisnet/{node_id}/alert", json.dumps(alert_payload), qos=1)
        log(f"[ALERT] {msg}")

# --- Node ID Map -------------------------------------------------------------
NODE_ID_MAP = {
    "flood":     "ESP32-FLOOD-01",
    "cotemp":    "ESP32-COTEMP-01",
    "pollution": "ESP32-POLLUTION-01",
}

# --- Publish Loop Thread ------------------------------------------------------
last_published_type = None
last_readings       = {}

def publish_loop():
    """Every N seconds, publish the latest accumulated readings."""
    global last_published_type, last_readings
    while running:
        time.sleep(PUBLISH_INTERVAL)
        if current_node_type and current_readings:
            # Only publish if we have new data or a new node type
            if current_readings != last_readings or current_node_type != last_published_type:
                node_id = NODE_ID_MAP.get(current_node_type, "ESP32-UNKNOWN-01")
                publish_reading(node_id, current_node_type, dict(current_readings))
                last_published_type = current_node_type
                last_readings       = dict(current_readings)

# --- Main Serial Read Loop ----------------------------------------------------
def read_serial(port_name):
    global running
    try:
        ser = serial.Serial(port_name, SERIAL_BAUD, timeout=2)
        log(f"[SERIAL] Opened {port_name} at {SERIAL_BAUD} baud")
        
        # Publish a "connected" marker to MQTT
        if mqtt_client:
            mqtt_client.publish("aegisnet/bridge/status",
                json.dumps({"status": "connected", "port": port_name}), qos=1)
        
        while running:
            try:
                raw = ser.readline()
                if raw:
                    line = raw.decode("utf-8", errors="replace").strip()
                    if line:
                        print(f"  >> {line}")
                        parse_line(line)
            except serial.SerialException as e:
                log(f"[SERIAL] Read error: {e}")
                break
            except Exception as e:
                log(f"[SERIAL] Unexpected error: {e}")
                break

        ser.close()
        log(f"[SERIAL] {port_name} closed")
        
        if mqtt_client:
            mqtt_client.publish("aegisnet/bridge/status",
                json.dumps({"status": "disconnected", "port": port_name}), qos=1)

    except serial.SerialException as e:
        log(f"[SERIAL] Cannot open {port_name}: {e}")

# --- Entry Point -------------------------------------------------------------
def main():
    global running, mqtt_client

    print()
    print("=" * 60)
    print("  AegisNet ESP32 Serial Bridge v1.0")
    print("  Auto-detects ESP32/Arduino and streams sensor data")
    print("=" * 60)
    print()

    # Connect MQTT
    log("[START] Connecting to MQTT broker...")
    client = connect_mqtt()
    if client is None:
        log("[WARN] MQTT not available — will retry in background")
    
    time.sleep(1)

    # Start publish thread
    pub_thread = threading.Thread(target=publish_loop, daemon=True)
    pub_thread.start()
    log("[START] Publish loop started (every 2 seconds)")

    # Main serial scan loop — auto reconnect
    while running:
        log("[SCAN] Scanning for ESP32/Arduino on COM ports...")
        ports_all = [p.device for p in serial.tools.list_ports.comports()]
        log(f"[SCAN] Available ports: {ports_all if ports_all else 'none'}")
        
        port = find_esp32_port()
        
        if port:
            log(f"[CONNECT] Connecting to {port}...")
            read_serial(port)  # blocks until disconnect
            log(f"[DISCONNECT] Lost connection to {port}")
        else:
            log("[WAIT] No ESP32 found. Plug in your ESP32 and wait...")
        
        # Wait before rescanning
        for i in range(RECONNECT_DELAY, 0, -1):
            if not running:
                break
            print(f"  Retrying in {i}s...", end='\r')
            time.sleep(1)
        print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        running = False
        print()
        log("[STOP] Bridge stopped by user. Goodbye!")
        sys.exit(0)
