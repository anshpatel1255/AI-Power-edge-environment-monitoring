#!/usr/bin/env python3
"""
scripts/com7_bridge.py — High-Performance COM7 Serial Bridge for AegisNet
Connects to ESP32 Gateway on COM7 @ 115200 baud.
Receives multi-node telemetry from the 3 field sensor ESP32s (Flood, Fire, Pollution).
Serves real-time SSE / WebSocket / HTTP telemetry stream directly to the AegisNet frontend.
Includes seamless automatic fallback telemetry while waiting for physical hardware attachment.
"""

import sys
import time
import json
import math
import random
import threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

# Ensure Windows console uses UTF-8 without charmap encoding crashes
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("[ERROR] pyserial is required. Run: pip install pyserial")
    sys.exit(1)

TARGET_PORT = "COM7"
BAUD_RATE = 115200
HTTP_PORT = 4001

# In-memory latest telemetry state and client queues
latest_nodes = {}
subscribers = []
raw_logs = []
lock = threading.Lock()
is_physical_connected = False
active_serial_port = None


class TelemetryHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress standard HTTP request logging to keep terminal clean
        pass

    def end_headers(self):
        # Enable CORS for frontend on port 3000 / 3001
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        global is_physical_connected, active_serial_port
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            with lock:
                res = {
                    "connected": is_physical_connected,
                    "target_port": TARGET_PORT,
                    "active_port": active_serial_port or TARGET_PORT,
                    "baud": BAUD_RATE,
                    "active_nodes": len(latest_nodes),
                    "nodes": list(latest_nodes.values()),
                    "recent_logs": raw_logs[-120:]
                }
            self.wfile.write(json.dumps(res).encode('utf-8'))

        elif self.path == '/api/stream':
            # Server-Sent Events (SSE) stream to push live packets instantly to frontend
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()

            queue = []
            with lock:
                subscribers.append(queue)

            try:
                # Send initial snapshot of all 3 sensor nodes
                with lock:
                    for node in latest_nodes.values():
                        self.wfile.write(f"data: {json.dumps(node)}\n\n".encode('utf-8'))
                    self.wfile.flush()

                while True:
                    time.sleep(0.05)
                    items_to_send = []
                    with lock:
                        if queue:
                            items_to_send = queue.copy()
                            queue.clear()
                    for item in items_to_send:
                        self.wfile.write(f"data: {json.dumps(item)}\n\n".encode('utf-8'))
                    if items_to_send:
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                with lock:
                    if queue in subscribers:
                        subscribers.remove(queue)
        else:
            self.send_response(404)
            self.end_headers()


def forward_to_backend(payload):
    """Asynchronously forwards physical ESP32 gateway readings to the Node.js backend API."""
    import urllib.request
    try:
        url = "http://localhost:4000/api/sensor-data"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req, timeout=1.0)
    except Exception:
        pass


def broadcast_and_forward(data, is_sim=False):
    """Updates latest_nodes cache, notifies SSE subscribers, and forwards to backend API."""
    global is_physical_connected, latest_nodes
    node_id = str(data.get('node_id') or data.get('id') or data.get('node') or 'ESP32-NODE').upper()
    if 'FLOOD' in node_id:
        std_node = 'FLOOD'
        std_id = 'ESP32-FLOOD'
    elif 'CO' in node_id or 'TEMP' in node_id or 'FIRE' in node_id:
        std_node = 'CO_TEMP'
        std_id = 'ESP32-COTEMP'
    elif 'POLLUTION' in node_id or 'AIR' in node_id:
        std_node = 'POLLUTION'
        std_id = 'ESP32-POLLUTION'
    else:
        std_node = node_id
        std_id = node_id

    data['node'] = std_node
    data['node_id'] = std_id
    data['is_live_hw'] = not is_sim

    with lock:
        clean_data = {k: v for k, v in data.items() if v is not None}
        if std_id in latest_nodes:
            merged = {**latest_nodes[std_id], **clean_data}
        else:
            merged = data
        latest_nodes[std_id] = merged
        for q in subscribers:
            q.append(merged)

    if not is_sim:
        threading.Thread(target=forward_to_backend, args=(data,), daemon=True).start()
        print(f"[{time.strftime('%H:%M:%S')}] [{active_serial_port}] Telemetry broadcast: {std_id} -> {data}")


class MultiLineStreamParser:
    """Stateful parser across multi-line serial outputs from ESP32 Master Gateway."""
    def __init__(self):
        self.section = None
        self.flood_buf = {}
        self.cotemp_buf = {}
        self.pol_buf = {}
        import re
        self.re = re

    def feed_line(self, raw_line, is_sim=False):
        re = self.re
        line = re.sub(r'^\[(?:COM\d+|SIM)\]\s*', '', raw_line).strip()
        if not line:
            return

        lower = line.lower()

        # Section header transitions
        if 'mq-135' in lower:
            self.section = 'MQ135'
            return
        elif 'mq-4' in lower:
            self.section = 'MQ4'
            return
        elif 'mq-7' in lower:
            self.section = 'MQ7'
            return
        elif 'pms5003' in lower or 'particulate' in lower:
            self.section = 'PMS5003'
            return
        elif 'overall pollution' in lower:
            self.section = 'POLLUTION_STATUS'
            return
        elif 'final node status' in lower:
            self.section = 'FINAL_STATUS'
            return
        elif 'co + temperature' in lower or 'cotemp' in lower:
            if self.section != 'FINAL_STATUS':
                self.section = 'CO_TEMP'
                return
        elif 'flood' in lower and ('node' in lower or 'monitoring' in lower or 'corridor' in lower):
            if self.section != 'FINAL_STATUS':
                self.section = 'FLOOD'
                return

        # 1. PARTICULATE MATTER - PMS5003 Laser Particle Readings (Strictly Exact Physical Sensor µg/m³)
        m_pm1 = re.search(r'PM1[\._]0\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_pm1:
            self.pol_buf['PM1_0'] = float(m_pm1.group(1))

        m_pm25 = re.search(r'PM2[\._]5\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_pm25:
            self.pol_buf['PM2_5'] = float(m_pm25.group(1))

        m_pm10 = re.search(r'PM10\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_pm10:
            self.pol_buf['PM10'] = float(m_pm10.group(1))

        # 2. MQ SENSORS (Relative strength %, raw ADC, voltage, digital alarm)
        m_str = re.search(r'Strength\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_str:
            val = float(m_str.group(1))
            if self.section == 'MQ135': self.pol_buf['mq135_strength'] = val
            elif self.section == 'MQ4': self.pol_buf['mq4_strength'] = val
            elif self.section == 'MQ7': self.pol_buf['mq7_strength'] = val

        m_adc = re.search(r'ADC\s*[:=]?\s*(\d+)', line, re.I)
        if m_adc:
            val = int(m_adc.group(1))
            if self.section == 'MQ135': self.pol_buf['mq135_raw'] = val
            elif self.section == 'MQ4': self.pol_buf['mq4_raw'] = val
            elif self.section == 'MQ7': self.pol_buf['mq7_raw'] = val

        m_volt = re.search(r'Voltage\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_volt:
            val = float(m_volt.group(1))
            if self.section == 'MQ135': self.pol_buf['mq135_voltage'] = val
            elif self.section == 'MQ4': self.pol_buf['mq4_voltage'] = val
            elif self.section == 'MQ7': self.pol_buf['mq7_voltage'] = val

        m_alarm = re.search(r'Digital Alarm\s*[:=]?\s*(\w+)', line, re.I)
        if m_alarm:
            is_alarm = m_alarm.group(1).upper() in ['DETECTED', 'ALARM', 'HIGH', '1', 'TRUE']
            if self.section == 'MQ135': self.pol_buf['mq135_alarm'] = is_alarm
            elif self.section == 'MQ4': self.pol_buf['mq4_alarm'] = is_alarm
            elif self.section == 'MQ7': self.pol_buf['mq7_alarm'] = is_alarm

        # 3. FLOOD SENSOR (Ultrasonic Distance cm + Soil Moisture %)
        m_dist = re.search(r'(?:water(?:\s*distance|\s*level)?|distance|dist|depth|hcsr04)\s*[:=]?\s*([\d\.]+)', line, re.I)
        if not m_dist and ('flood' in (self.section or '').lower() or self.section == 'FLOOD'):
            m_dist = re.search(r'([\d\.]+)\s*cm\b', line, re.I)
        if m_dist:
            val = float(m_dist.group(1))
            self.flood_buf['distance'] = val
            self.flood_buf['water_level_cm'] = val

        m_soil = re.search(r'(?:soil(?:\s*moisture)?|moisture)\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_soil:
            val = float(m_soil.group(1))
            self.flood_buf['soilMoisture'] = val
            self.flood_buf['soil_moisture'] = val

        # 4. CO + TEMPERATURE (DHT11, DS18B20, ZE07-CO ppm, Flame)
        m_dht = re.search(r'(?:dht(?:11)?(?:\s*temp(?:erature)?)?|ambient(?:\s*temp(?:erature)?)?)\s*[:=]?\s*(-?[\d\.]+)', line, re.I)
        if m_dht:
            val = float(m_dht.group(1))
            self.cotemp_buf['dhtTemperature'] = val
            self.cotemp_buf['temperature_c'] = val

        m_ds = re.search(r'(?:ds18b20(?:\s*temp(?:erature)?)?|pipe(?:\s*temp(?:erature)?)?)\s*[:=]?\s*(-?[\d\.]+)', line, re.I)
        if m_ds:
            self.cotemp_buf['ds18b20Temperature'] = float(m_ds.group(1))

        m_hum = re.search(r'(?:humidity|hum|rh)\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_hum:
            val = float(m_hum.group(1))
            self.cotemp_buf['humidity'] = val
            self.cotemp_buf['humidity_pct'] = val

        m_co = re.search(r'(?:co(?:\s*gas)?(?:\s*\([^)]+\))?|ze07(?:-co)?)\s*[:=]?\s*([\d\.]+)', line, re.I)
        if m_co:
            val = float(m_co.group(1))
            self.cotemp_buf['coPPM'] = val
            self.cotemp_buf['co_ppm'] = val
            self.cotemp_buf['gas_ppm'] = val

        if 'flame' in lower:
            self.cotemp_buf['flame_detected'] = any(w in lower for w in ['yes', 'true', 'detected', 'high', '1'])

        # 5. FINAL NODE STATUS BLOCK
        m_fl_st = re.search(r'Flood Node\s*[:=]\s*(ONLINE|OFFLINE)', line, re.I)
        if m_fl_st:
            st = m_fl_st.group(1).upper()
            if st == 'ONLINE':
                if self.flood_buf.get('distance') is not None or self.flood_buf.get('soilMoisture') is not None:
                    self.flush_flood(status='ONLINE', is_sim=is_sim)
                else:
                    broadcast_and_forward({'node': 'FLOOD', 'status': 'ONLINE'}, is_sim=is_sim)
            else:
                broadcast_and_forward({'node': 'FLOOD', 'status': 'OFFLINE'}, is_sim=is_sim)

        m_co_st = re.search(r'CO\s*\+\s*Temperature\s*[:=]\s*(ONLINE|OFFLINE)', line, re.I)
        if m_co_st:
            st = m_co_st.group(1).upper()
            if st == 'ONLINE':
                if any(self.cotemp_buf.get(k) is not None for k in ['coPPM', 'dhtTemperature', 'humidity', 'ds18b20Temperature']):
                    self.flush_cotemp(status='ONLINE', is_sim=is_sim)
                else:
                    broadcast_and_forward({'node': 'CO_TEMP', 'status': 'ONLINE'}, is_sim=is_sim)
            else:
                broadcast_and_forward({'node': 'CO_TEMP', 'status': 'OFFLINE'}, is_sim=is_sim)

        m_pol_st = re.search(r'Pollution Node\s*[:=]\s*(ONLINE|OFFLINE)', line, re.I)
        if m_pol_st:
            st = m_pol_st.group(1).upper()
            if st == 'ONLINE':
                if any(self.pol_buf.get(k) is not None for k in ['PM2_5', 'PM10', 'PM1_0', 'mq135_strength', 'mq4_strength']):
                    self.flush_pollution(status='ONLINE', is_sim=is_sim)
                else:
                    broadcast_and_forward({'node': 'POLLUTION', 'status': 'ONLINE'}, is_sim=is_sim)
            else:
                broadcast_and_forward({'node': 'POLLUTION', 'status': 'OFFLINE'}, is_sim=is_sim)

        # Flush on section boundaries
        if '===' in line or '###' in line:
            if self.section in ['PMS5003', 'POLLUTION_STATUS'] and any(self.pol_buf.get(k) is not None for k in ['PM2_5', 'PM10', 'PM1_0', 'mq135_strength']):
                self.flush_pollution(status='ONLINE', is_sim=is_sim)
            elif self.section == 'FLOOD' and (self.flood_buf.get('distance') is not None or self.flood_buf.get('soilMoisture') is not None):
                self.flush_flood(status='ONLINE', is_sim=is_sim)
            elif self.section == 'CO_TEMP' and (self.cotemp_buf.get('temperature_c') is not None or self.cotemp_buf.get('coPPM') is not None):
                self.flush_cotemp(status='ONLINE', is_sim=is_sim)

    def flush_pollution(self, status='ONLINE', is_sim=False):
        if not self.pol_buf:
            return
        pkt = {
            'node': 'POLLUTION',
            'node_id': 'ESP32-POLLUTION',
            'status': status,
        }
        for k, v in self.pol_buf.items():
            if v is not None:
                pkt[k] = v
        self.pol_buf = {}
        broadcast_and_forward(pkt, is_sim=is_sim)

    def flush_flood(self, status='ONLINE', is_sim=False):
        dist = self.flood_buf.get('distance')
        soil = self.flood_buf.get('soilMoisture')
        if dist is None and soil is None and status == 'ONLINE':
            return
        # Reject ultrasonic glitch / timeout / blind spot (< 2.0 cm)
        if dist is not None and dist < 2.0:
            dist = None

        pkt = {
            'node': 'FLOOD',
            'node_id': 'ESP32-FLOOD',
            'status': status,
        }
        if dist is not None:
            pkt['distance'] = dist
            pkt['water_level_cm'] = dist
        if soil is not None and soil > 0:
            pkt['soilMoisture'] = soil
            pkt['soil_moisture'] = soil

        self.flood_buf = {}
        broadcast_and_forward(pkt, is_sim=is_sim)

    def flush_cotemp(self, status='ONLINE', is_sim=False):
        pkt = {
            'node': 'CO_TEMP',
            'node_id': 'ESP32-COTEMP',
            'status': status,
        }
        co = self.cotemp_buf.get('coPPM')
        temp = self.cotemp_buf.get('dhtTemperature')
        hum = self.cotemp_buf.get('humidity')
        ds = self.cotemp_buf.get('ds18b20Temperature')
        flame = self.cotemp_buf.get('flame_detected')

        if co is not None:
            pkt['coPPM'] = co
            pkt['co_ppm'] = co
            pkt['gas_ppm'] = co
        if temp is not None:
            pkt['dhtTemperature'] = temp
            pkt['temperature_c'] = temp
        if hum is not None:
            pkt['humidity'] = hum
            pkt['humidity_pct'] = hum
        if ds is not None:
            pkt['ds18b20Temperature'] = ds
        if flame is not None:
            pkt['flame_detected'] = flame

        self.cotemp_buf = {}
        broadcast_and_forward(pkt, is_sim=is_sim)


stream_parser = MultiLineStreamParser()


def process_packet(raw_line, is_sim=False):
    global is_physical_connected, latest_nodes
    line = str(raw_line).strip()
    if not line:
        return

    with lock:
        now_str = time.strftime("%H:%M:%S")
        port_label = active_serial_port or TARGET_PORT
        prefix = "[SIM]" if is_sim else f"[{port_label}]"
        raw_logs.append({"time": now_str, "line": f"{prefix} {line}"})
        if len(raw_logs) > 120:
            raw_logs.pop(0)

    # 1. Check if line is single-line JSON packet
    data = None
    try:
        data = json.loads(line)
    except json.JSONDecodeError:
        import re
        m = re.search(r'\{.*\}', line)
        if m:
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                data = None

    if data and isinstance(data, dict):
        broadcast_and_forward(data, is_sim=is_sim)
        return

    # 2. Feed to stateful multi-line block parser
    stream_parser.feed_line(line, is_sim=is_sim)


def find_available_esp32_port():
    """Scans system for COM8 / COM7 or any CP210x / CH340 ESP32 USB serial device."""
    ports = list(serial.tools.list_ports.comports())
    
    # 1. Look for CP210x (like Silicon Labs VID:10C4 PID:EA60) or CH340
    for p in ports:
        desc = (p.description or '').lower()
        hwid = (p.hwid or '').lower()
        if '10c4:ea60' in hwid or 'cp210' in desc or 'ch340' in desc or 'uart' in desc or 'esp32' in desc:
            return p.device

    # 2. Look specifically for COM8 or COM7
    for p in ports:
        if p.device.upper() in ['COM8', 'COM7']:
            return p.device

    # 3. Fallback to first available COM port
    if ports:
        return ports[0].device

    return None


def serial_reader_loop():
    global is_physical_connected, active_serial_port
    last_waiting_msg = 0
    was_connected = None
    while True:
        port_to_try = find_available_esp32_port()
        active_serial_port = port_to_try

        if not port_to_try:
            if was_connected is not False:
                is_physical_connected = False
                was_connected = False
                forward_to_backend({'node': 'MASTER', 'status': 'OFFLINE'})
            now = time.time()
            if now - last_waiting_msg > 10:
                print("[COM Bridge] Waiting for ESP32 USB Gateway to be plugged into USB...", flush=True)
                last_waiting_msg = now
            time.sleep(2)
            continue

        try:
            with serial.Serial(port_to_try, BAUD_RATE, timeout=1) as ser:
                is_physical_connected = True
                was_connected = True
                forward_to_backend({'node': 'MASTER', 'status': 'ONLINE'})
                print(f"[COM Bridge] [OK] CONNECTED to physical port {port_to_try} @ {BAUD_RATE} baud!", flush=True)
                print(f"[COM Bridge] Listening for incoming ESP32 serial telemetry on {port_to_try}...", flush=True)

                while True:
                    line = ser.readline().decode('utf-8', errors='replace')
                    if line:
                        process_packet(line, is_sim=False)
        except serial.SerialException as e:
            is_physical_connected = False
            was_connected = False
            forward_to_backend({'node': 'MASTER', 'status': 'OFFLINE'})
            now = time.time()
            if now - last_waiting_msg > 10:
                print(f"[COM Bridge] Port {port_to_try} waiting for device/busy ({e}). Retrying...", flush=True)
                last_waiting_msg = now
            time.sleep(2)
        except Exception as e:
            is_physical_connected = False
            was_connected = False
            forward_to_backend({'node': 'MASTER', 'status': 'OFFLINE'})
            print(f"[COM Bridge] Unexpected error on {port_to_try}: {e}", flush=True)
            time.sleep(2)


def fallback_generator_loop():
    """Strictly physical hardware — no fake simulated data per user architecture mandate."""
    while True:
        time.sleep(10.0)


def main():
    print("=" * 65)
    print("  AegisNet ESP32 Hardware Bridge")
    print(f"  Target: {TARGET_PORT} @ {BAUD_RATE} baud")
    print(f"  Live Stream Endpoint: http://localhost:{HTTP_PORT}/api/stream")
    print("=" * 65)

    # 1. Start Serial Background Reader Thread
    serial_thread = threading.Thread(target=serial_reader_loop, daemon=True)
    serial_thread.start()

    # 2. Start Continuous Telemetry Fallback Thread
    fallback_thread = threading.Thread(target=fallback_generator_loop, daemon=True)
    fallback_thread.start()

    # 3. Start HTTP / SSE Telemetry Server
    server_address = ('', HTTP_PORT)
    httpd = ThreadingHTTPServer(server_address, TelemetryHandler)
    print(f"[COM7 Bridge] Telemetry server running on port {HTTP_PORT}. Streaming live data.")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[COM7 Bridge] Stopped.")


if __name__ == '__main__':
    main()
