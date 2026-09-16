#!/usr/bin/env python3
"""
AegisNet Node Simulator

Simulates sensor nodes publishing telemetry + alerts via MQTT,
so the full pipeline (sensor → AI → alert → dashboard) can be
demoed without physical hardware.

Usage:
  python node_simulator.py                          # all nodes, normal mode
  python node_simulator.py --scenario flood --node NODE-01
  python node_simulator.py --interval 2 --broker mqtt://localhost:1883
"""
import argparse
import json
import os
import random
import sys
import time
from pathlib import Path

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Install paho-mqtt: pip install paho-mqtt")
    sys.exit(1)

# ─── Node definitions (match seed.sql) ────────────────────────────────────────
DEMO_NODES = [
    {"node_id": "NODE-01", "name": "Upstream",         "lat": 26.1445, "lng": 91.7362, "battery": 87},
    {"node_id": "NODE-02", "name": "River Side",       "lat": 26.1389, "lng": 91.7501, "battery": 72},
    {"node_id": "NODE-03", "name": "Forest/High Risk", "lat": 26.1521, "lng": 91.7619, "battery": 65},
    {"node_id": "NODE-04", "name": "Lowland",          "lat": 26.1298, "lng": 91.7440, "battery": 91},
]

# Alert thresholds (default, must match seed.sql)
THRESHOLDS = {"flood": 50, "fire": 45, "pollution": 40}


# ─── Node state (random-walk accumulators) ────────────────────────────────────
class NodeState:
    def __init__(self, node):
        self.node_id       = node["node_id"]
        self.battery       = node["battery"]
        self.water_level   = random.uniform(30, 60)
        self.smoke_aqi     = random.uniform(20, 45)
        self.temperature   = random.uniform(26, 32)
        self.humidity      = random.uniform(60, 75)
        self.soil_moisture = random.uniform(30, 50)
        self.flame         = False
        self.water_history = [self.water_level] * 5
        self.aqi_history   = [self.smoke_aqi] * 5
        self.rssi          = random.randint(-85, -60)

    def step(self, overrides=None):
        """Advance one step with random walk + optional override values."""
        overrides = overrides or {}

        self.water_level   = overrides.get("water_level_cm",
            max(0, self.water_level + random.gauss(0, 2)))
        self.smoke_aqi     = overrides.get("smoke_aqi",
            max(0, self.smoke_aqi + random.gauss(0, 3)))
        self.temperature   = overrides.get("temperature_c",
            max(15, min(50, self.temperature + random.gauss(0, 0.3))))
        self.humidity      = overrides.get("humidity_pct",
            max(20, min(100, self.humidity + random.gauss(0, 0.5))))
        self.soil_moisture = overrides.get("soil_moisture",
            max(0, min(100, self.soil_moisture + random.gauss(0, 0.5))))
        self.flame         = overrides.get("flame_detected", random.random() > 0.995)
        self.rssi          = max(-95, min(-50, self.rssi + random.randint(-3, 3)))
        self.battery       = max(0, min(100, self.battery - random.uniform(0, 0.02)))

        self.water_history.append(self.water_level)
        self.water_history = self.water_history[-10:]
        self.aqi_history.append(self.smoke_aqi)
        self.aqi_history = self.aqi_history[-10:]

        return self._compute_risks(overrides)

    def _rate_of_change(self, history):
        """Rate-of-change per PRD §6.1 edge-AI logic (mirrors ESP32 firmware)."""
        if len(history) < 2:
            return 0
        diffs = [history[i + 1] - history[i] for i in range(len(history) - 1)]
        return sum(diffs) / len(diffs)

    def _compute_risks(self, overrides):
        """Compute 0-100 risk scores using rate-of-change logic."""
        # Flood risk: water level + rate of rise
        water_roc  = self._rate_of_change(self.water_history)
        flood_base = min(self.water_level / 1.5, 80)
        risk_flood = int(min(100, max(0, flood_base + max(0, water_roc * 8))))

        # Fire risk: AQI + flame + temperature
        aqi_roc   = self._rate_of_change(self.aqi_history)
        fire_base = min(self.smoke_aqi / 2.5, 60)
        fire_temp = max(0, (self.temperature - 30) * 2)
        fire_flame = 35 if self.flame else 0
        risk_fire = int(min(100, max(0, fire_base + fire_temp + fire_flame + max(0, aqi_roc * 3))))

        # Pollution risk: AQI-driven
        risk_pollution = int(min(100, max(0, self.smoke_aqi / 2.0)))

        # Direct scenario overrides
        if "risk_flood"     in overrides: risk_flood     = int(overrides["risk_flood"])
        if "risk_fire"      in overrides: risk_fire      = int(overrides["risk_fire"])
        if "risk_pollution" in overrides: risk_pollution = int(overrides["risk_pollution"])

        return risk_flood, risk_fire, risk_pollution


def load_scenario(name):
    path = Path(__file__).parent / "scenarios" / f"{name}.json"
    if not path.exists():
        print(f"Scenario file not found: {path}")
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def interpolate_scenario(scenario, step):
    """Linear interpolation between scenario ramp keyframes."""
    ramp = scenario["ramp"]
    if step <= ramp[0]["step"]:
        return {k: v for k, v in ramp[0].items() if k != "step"}
    if step >= ramp[-1]["step"]:
        return {k: v for k, v in ramp[-1].items() if k != "step"}
    for i in range(len(ramp) - 1):
        a, b = ramp[i], ramp[i + 1]
        if a["step"] <= step <= b["step"]:
            t = (step - a["step"]) / (b["step"] - a["step"])
            result = {}
            for k in a:
                if k == "step":
                    continue
                if isinstance(a[k], bool):
                    result[k] = b[k] if t >= 0.5 else a[k]
                else:
                    result[k] = a[k] + t * (b[k] - a[k])
            return result
    return {}


def main():
    parser = argparse.ArgumentParser(description="AegisNet Node Simulator")
    parser.add_argument("--broker",   default=os.environ.get("MQTT_BROKER_URL", "mqtt://localhost:1883"))
    parser.add_argument("--interval", type=float, default=5.0, help="Seconds between readings")
    parser.add_argument("--scenario", choices=["flood", "fire", "pollution"])
    parser.add_argument("--node",     help="Target node ID for scenario (e.g. NODE-01)")
    args = parser.parse_args()

    broker_url = args.broker.replace("mqtt://", "").replace("mqtts://", "")
    host, _, port = broker_url.partition(":")
    port = int(port) if port else 1883

    mqttc = mqtt.Client(client_id=f"aegisnet-simulator-{random.randint(1000, 9999)}")
    mqttc.on_connect    = lambda c, u, f, rc: print(f"[MQTT] Connected to {host}:{port} (rc={rc})")
    mqttc.on_disconnect = lambda c, u, rc:    print(f"[MQTT] Disconnected (rc={rc})")

    print(f"[Simulator] Connecting to {host}:{port}...")
    mqttc.connect(host, port, 60)
    mqttc.loop_start()

    scenario = None
    scenario_target = None
    if args.scenario:
        scenario = load_scenario(args.scenario)
        scenario_target = args.node or scenario.get("target_node")
        print(f"[Simulator] Running scenario: {scenario['name']} on {scenario_target}")

    states = {n["node_id"]: NodeState(n) for n in DEMO_NODES}
    step   = 0

    print(f"[Simulator] Publishing every {args.interval}s. Ctrl+C to stop.")

    try:
        while True:
            for node in DEMO_NODES:
                nid   = node["node_id"]
                state = states[nid]

                overrides = {}
                if scenario and scenario_target == nid:
                    if step <= scenario["duration_steps"]:
                        overrides = interpolate_scenario(scenario, step)

                risk_flood, risk_fire, risk_pollution = state.step(overrides)

                payload = {
                    "node_id":        nid,
                    "water_level_cm": round(state.water_level, 2),
                    "flame_detected": state.flame,
                    "smoke_aqi":      round(state.smoke_aqi, 2),
                    "temperature_c":  round(state.temperature, 2),
                    "humidity_pct":   round(state.humidity, 2),
                    "soil_moisture":  round(state.soil_moisture, 2),
                    "risk_flood":     risk_flood,
                    "risk_fire":      risk_fire,
                    "risk_pollution": risk_pollution,
                    "battery_pct":    round(state.battery),
                    "rssi":           state.rssi,
                    "solar_charging": True,
                    "timestamp":      time.time(),
                }

                mqttc.publish(f"aegisnet/{nid}/telemetry", json.dumps(payload), qos=1)
                print(f"[{nid}] flood={risk_flood} fire={risk_fire} poll={risk_pollution}"
                      f" water={payload['water_level_cm']}cm bat={payload['battery_pct']}%")

                for hazard, threshold in THRESHOLDS.items():
                    score = {"flood": risk_flood, "fire": risk_fire, "pollution": risk_pollution}[hazard]
                    if score >= threshold:
                        alert_payload = {
                            "node_id":    nid,
                            "hazard":     hazard,
                            "risk_score": score,
                            "message":    f"{hazard.upper()} alert from {nid}: score={score}",
                        }
                        mqttc.publish(f"aegisnet/{nid}/alert", json.dumps(alert_payload), qos=1)
                        print(f"  ⚠️  ALERT: {hazard} score={score}")

            step += 1
            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\n[Simulator] Stopped.")
        mqttc.loop_stop()
        mqttc.disconnect()


if __name__ == "__main__":
    main()
