# AegisNet README

## AI-Powered Environmental Monitoring Network
**Floods · Fires · Pollution — Early Detection, Smart Alerts, Safer Communities**

---

## Quick Start — Demo Mode (no backend needed)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
# Click "Authority Login" → "Enter Demo Mode"
```

The frontend runs completely standalone with **simulated live data** — no PostgreSQL, MQTT, or backend required for the demo.

---

## Full Stack Start

### Prerequisites
- Docker Desktop (recommended) OR Node.js 20, Python 3.11, PostgreSQL 16, Mosquitto

### Option A — Docker Compose (recommended)
```bash
cp .env.example .env
docker-compose up --build
```
Services:
| URL | Service |
|-----|---------|
| http://localhost:3000 | React Dashboard |
| http://localhost:4000 | Node.js API |
| http://localhost:8000/docs | Python AI Service (Swagger) |
| localhost:1883 | MQTT Broker |
| localhost:5432 | PostgreSQL |

### Option B — Manual (development)
```bash
# 1. PostgreSQL
psql -U postgres -c "CREATE DATABASE aegisnet;"
psql -U postgres -d aegisnet -f database/schema.sql
psql -U postgres -d aegisnet -f database/seed.sql

# 2. Node backend
cd backend-node && cp ../.env.example .env && npm install && npm run dev

# 3. Python AI service
cd backend-ai && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Frontend
cd frontend && npm install && npm run dev

# 5. Simulator (optional — produces live sensor data)
cd simulator && pip install -r requirements.txt
python node_simulator.py --scenario flood --node NODE-01
```

---

## Demo Scenarios (PRD §13 live demo)

```bash
# Flood alert chain (NODE-01 → NODE-04)
python simulator/node_simulator.py --scenario flood --node NODE-01 --interval 3

# Fire alert (NODE-03 forest fire)
python simulator/node_simulator.py --scenario fire --node NODE-03 --interval 3

# Pollution spike (NODE-02)
python simulator/node_simulator.py --scenario pollution --node NODE-02 --interval 3
```

Alerts appear on the dashboard within **<10 seconds** (PRD §7.3 target).

---

## Auth Credentials (demo)
| Email | Password | Role |
|-------|----------|------|
| authority@aegisnet.local | demo1234 | authority |
| admin@aegisnet.local | demo1234 | admin |

---

## Architecture

```
Sensor Nodes (ESP32 + LoRa)
    ↓ MQTT (aegisnet/+/telemetry)
Mosquitto Broker
    ↓
Node.js Backend (Express + Socket.IO)
    ├── REST API  → React Dashboard
    ├── Socket.IO → live push to all clients
    └── POST /correlate → Python FastAPI AI service
                           └── distance-decay area probability
React Dashboard
    ├── Public Risk Map (Leaflet, no auth)
    ├── Authority Dashboard (JWT)
    │   ├── Live AlertFeed
    │   ├── Node Health Table
    │   └── Threshold Editor
    └── Node Detail (Recharts: water / AQI / temp / humidity)
```

---

## Repository Structure
```
aegisnet/
├── docker-compose.yml
├── .env.example
├── mosquitto.conf
├── database/          # schema.sql + seed.sql
├── backend-node/      # Express + Socket.IO + MQTT
├── backend-ai/        # FastAPI correlation + forecasting
├── simulator/         # Python node/gateway simulator + scenarios
└── frontend/          # React + Vite + Tailwind
```
