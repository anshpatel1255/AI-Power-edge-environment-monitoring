#!/usr/bin/env python3
"""
AegisNet Gateway Simulator

Simulates a Raspberry Pi / ESP32 gateway that:
- Subscribes to all node telemetry
- Aggregates and re-publishes to aegisnet/gateway/aggregate every 30s
- Adds gateway metadata (WiFi uplink status, buffer count)
"""
import json
import os
import random
import time
import sys

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Install paho-mqtt: pip install paho-mqtt")
    sys.exit(1)

BROKER = os.environ.get("MQTT_BROKER_URL", "mqtt://localhost:1883").replace("mqtt://", "")
HOST, _, PORT = BROKER.partition(":")
PORT = int(PORT) if PORT else 1883

_buffer = []


def on_connect(client, userdata, flags, rc):
    print(f"[Gateway] Connected rc={rc}")
    client.subscribe("aegisnet/+/telemetry")


def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload)
        _buffer.append(data)
        print(f"[Gateway] Buffered from {msg.topic}: node={data.get('node_id')}")
    except Exception as e:
        print(f"[Gateway] Parse error: {e}")


def main():
    client = mqtt.Client(client_id="aegisnet-gateway")
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(HOST, PORT, 60)
    client.loop_start()

    print(f"[Gateway] Running. Aggregating every 30s.")
    try:
        while True:
            time.sleep(30)
            if _buffer:
                aggregate = {
                    "gateway_id":    "GATEWAY-01",
                    "uplink":        "wifi",
                    "buffered_count": len(_buffer),
                    "readings":      _buffer.copy(),
                    "timestamp":     time.time(),
                    "rssi_uplink":   random.randint(-70, -45),
                }
                client.publish("aegisnet/gateway/aggregate", json.dumps(aggregate), qos=1)
                print(f"[Gateway] Aggregated {len(_buffer)} readings → published")
                _buffer.clear()
    except KeyboardInterrupt:
        print("[Gateway] Stopped.")
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
