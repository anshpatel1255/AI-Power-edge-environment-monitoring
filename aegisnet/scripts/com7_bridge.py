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
                    "recent_logs": raw_logs[-20:]
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


def process_packet(raw_line, is_sim=False):
    global is_physical_connected
    line = str(raw_line).strip()
    if not line:
        return

    with lock:
        now_str = time.strftime("%H:%M:%S")
        prefix = "[SIM]" if is_sim else f"[{active_serial_port or TARGET_PORT}]"
        raw_logs.append({"time": now_str, "line": f"{prefix} {line}"})
        if len(raw_logs) > 120:
            raw_logs.pop(0)

    data = None
    try:
        data = json.loads(line)
    except json.JSONDecodeError:
        # Fallback: parse Key-Value or CSV line
        data = {}
        for pair in line.split(','):
            if ':' in pair:
                k, v = pair.split(':', 1)
                k = k.strip().lower()
                v = v.strip()
                try:
                    data[k] = float(v)
                except ValueError:
                    data[k] = v

    if not data or not any(k in data for k in ['node_id', 'id', 'node']):
        return

    node_id = str(data.get('node_id') or data.get('id') or data.get('node')).upper()
    data['node_id'] = node_id

    # Broadcast to all active frontend subscribers
    with lock:
        latest_nodes[node_id] = data
        for q in subscribers:
            q.append(data)

    if not is_sim:
        print(f"[{time.strftime('%H:%M:%S')}] [{active_serial_port}] Ingested physical packet from {node_id}")


def find_available_esp32_port():
    """Scans system for COM7 first, or any other ESP32 USB serial device."""
    ports = list(serial.tools.list_ports.comports())
    
    # 1. Look specifically for COM7 first
    for p in ports:
        if p.device.upper() == TARGET_PORT.upper():
            return p.device

    # 2. Look for common ESP32 USB UART bridges (CP210x, CH340, CH343, FTDI)
    for p in ports:
        desc = (p.description or '').lower()
        if 'ch340' in desc or 'cp210' in desc or 'uart' in desc or 'serial' in desc or 'esp32' in desc:
            return p.device

    # 3. If COM ports exist, return the first one as candidate
    if ports:
        return ports[0].device

    return None


def serial_reader_loop():
    global is_physical_connected, active_serial_port
    while True:
        port_to_try = find_available_esp32_port() or TARGET_PORT
        active_serial_port = port_to_try

        try:
            with serial.Serial(port_to_try, BAUD_RATE, timeout=1) as ser:
                is_physical_connected = True
                print(f"[COM7 Bridge] ✓ CONNECTED to physical port {port_to_try} @ {BAUD_RATE} baud!")
                print("[COM7 Bridge] Listening for incoming 3-node ESP32 telemetry packets...")

                while True:
                    line = ser.readline().decode('utf-8', errors='replace')
                    if line:
                        process_packet(line, is_sim=False)
        except serial.SerialException:
            is_physical_connected = False
            # Physical port not plugged in or busy; wait 2s and retry
            time.sleep(2)
        except Exception:
            is_physical_connected = False
            time.sleep(2)


def fallback_generator_loop():
    """Generates continuous live telemetry while waiting for physical USB hardware."""
    global is_physical_connected
    cycle = 0

    while True:
        time.sleep(1.5)
        if is_physical_connected:
            continue  # Physical hardware is active; don't emit simulated packets

        cycle += 1
        c = cycle

        # 1. Flood Node
        water = round(44.0 + 5.2 * math.sin(c * 0.45) + (random.random() * 1.0 - 0.5), 1)
        soil = round(65.0 + 5.5 * math.sin(c * 0.3) + (random.random() * 0.8 - 0.4), 1)
        flood_pkt = {
            "node_id": "ESP32-FLOOD",
            "name": "ESP32 Flood & Water Sentinel",
            "category": "flood",
            "sensor_type": "Flood & Water Level",
            "location": "Sant Sarovar Dam, Sabarmati, Gandhinagar",
            "water_level_cm": water,
            "soil_moisture": soil,
            "battery_pct": 98,
            "rssi": -58
        }
        process_packet(json.dumps(flood_pkt), is_sim=True)

        # 2. Fire & CO-Thermal Node
        temp = round(29.5 + 1.8 * math.sin(c * 0.25) + (random.random() * 0.4 - 0.2), 1)
        hum = round(58.0 - 4.0 * math.sin(c * 0.25) + (random.random() * 0.8 - 0.4), 1)
        co = round(max(0.8, 2.5 + 1.1 * math.sin(c * 0.4) + (random.random() * 0.3 - 0.15)), 2)
        fire_pkt = {
            "node_id": "ESP32-COTEMP",
            "name": "ESP32 Fire & CO-Thermal Sentinel",
            "category": "fire",
            "sensor_type": "Fire & Thermal IR",
            "location": "Indroda Nature Park Perimeter, Gandhinagar",
            "temperature_c": temp,
            "humidity_pct": hum,
            "gas_ppm": co,
            "flame_detected": (c % 28 == 0),
            "battery_pct": 95,
            "rssi": -64
        }
        process_packet(json.dumps(fire_pkt), is_sim=True)

        # 3. Air Quality & Pollution Node
        aqi = max(25, min(200, round(52 + 13 * math.sin(c * 0.35) + (random.random() * 4 - 2))))
        nh3 = round(30.0 + 7.5 * math.sin(c * 0.3) + (random.random() * 1.0 - 0.5), 1)
        air_pkt = {
            "node_id": "ESP32-POLLUTION",
            "name": "ESP32 Air Quality & Toxic Gas Sentinel",
            "category": "air",
            "sensor_type": "Air Quality (AQI)",
            "location": "Narol-Vatva GIDC Industrial Corridor, Ahmedabad",
            "smoke_aqi": aqi,
            "pm10": round(aqi * 1.32),
            "mq135_strength": nh3,
            "mq4_strength": round(nh3 * 0.45, 1),
            "battery_pct": 92,
            "rssi": -71
        }
        process_packet(json.dumps(air_pkt), is_sim=True)


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
