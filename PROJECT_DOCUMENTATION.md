# 🌍 AegisNet (EcoMonitor) — Complete Project Documentation v2.0

> **AI-Powered Edge Environmental Monitoring & Disaster Warning Network**  
> *Floods · Forest Fires · Air & Chemical Pollution — Real-Time Early Detection, Edge-AI Correlation, Multi-Agency Automated Dispatch*  
> **Track:** SIH26178 | Qualcomm Hardware & Edge-AI / Smart Automation Track  
> **Target Region:** Gujarat State Grid (Gandhinagar, Ahmedabad, Surat, Vadodara) linked to GSDMA  
> **Theme:** Light, high-contrast "Command Center" UI — built for judges to understand the value in under 60 seconds

---

## 📑 Table of Contents
1. [Project Overview & Executive Summary](#1-project-overview--executive-summary)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Hardware & Edge-AI Simulation Layer](#3-hardware--edge-ai-simulation-layer)
4. [Design System (Light UI Foundations)](#4-design-system-light-ui-foundations)
5. [Comprehensive UI & Page-by-Page Specifications](#5-comprehensive-ui--page-by-page-specifications)
   - [5.1 Global Navigation & Header](#51-global-navigation--header)
   - [5.2 Global Footer](#52-global-footer)
   - [5.3 Page 1: Dashboard (`/` or `/dashboard`)](#53-page-1-dashboard--or-dashboard)
   - [5.4 Page 2: Geographic Monitoring Map (`/map`)](#54-page-2-geographic-monitoring-map-map)
   - [5.5 Page 3: Reading History & Reports (`/history`)](#55-page-3-reading-history--reports-history)
   - [5.6 Page 4: AI Environmental Analysis (`/analysis`)](#56-page-4-ai-environmental-analysis-analysis)
   - [5.7 Page 5: Immediate Warnings & Alerts (`/alerts`)](#57-page-5-immediate-warnings--alerts-alerts)
   - [5.8 Page 6: Individual Node Telemetry Detail (`/nodes/:id`)](#58-page-6-individual-node-telemetry-detail-nodesid)
   - [5.9 Page 7: Authority Gateway & Authentication (`/login`)](#59-page-7-authority-gateway--authentication-login)
   - [5.10 Page 8: Agency Command Console (`/console`) — NEW](#510-page-8-agency-command-console-console--new)
   - [5.11 Page 9: Public Citizen Portal (`/public`) — NEW](#511-page-9-public-citizen-portal-public--new)
   - [5.12 Page 10: Node Fleet & Provisioning (`/fleet`) — NEW](#512-page-10-node-fleet--provisioning-fleet--new)
   - [5.13 Page 11: Settings & Org Admin (`/settings`) — NEW](#513-page-11-settings--org-admin-settings--new)
   - [5.14 Global Modals & System Overlays](#514-global-modals--system-overlays)
6. [Sensor Types & Regional Landmark Auto-Detection](#6-sensor-types--regional-landmark-auto-detection)
7. [Emergency Dispatch & Multi-Agency Escalation Engine](#7-emergency-dispatch--multi-agency-escalation-engine)
8. [Scenario Simulation Controller](#8-scenario-simulation-controller)
9. [Backend Services & API Specifications](#9-backend-services--api-specifications)
10. [Database Schema & Data Models](#10-database-schema--data-models)
11. [AI/ML & Edge-Correlation Pipeline](#11-aiml--edge-correlation-pipeline)
12. [Security, Reliability & Offline-First Design](#12-security-reliability--offline-first-design)
13. [Setup, Execution & Deployment Guide](#13-setup-execution--deployment-guide)
14. [Demo Script & Judging-Criteria Alignment](#14-demo-script--judging-criteria-alignment)

---

## 1. Project Overview & Executive Summary

### 1.1 The Problem
Traditional environmental monitoring and disaster detection networks suffer from critical flaws:
- **High Latency & Cloud Dependency:** Standard IoT nodes stream raw telemetry to remote cloud servers. When networks fail during storms, floods, or rural infrastructure collapse, detection ceases exactly when it's needed most.
- **Fixed Threshold False Alarms:** Static threshold alerts trigger repeatedly on transient spikes (a splash, campfire smoke), desensitizing emergency personnel to real warnings ("alert fatigue").
- **Delayed Disaster Warning:** Upstream river surges and smoke plumes often take hours to register downstream before emergency personnel can initiate evacuations.
- **Disjointed Agency Communications:** Fire, flood, and pollution emergencies require manual phone calls and separate communication chains between municipal corporations, state disaster management authorities, police, and hospitals.
- **No Citizen-Facing Layer:** Existing systems are agency-only; the public has no early, verified, hyper-local channel to know when to evacuate or shelter.

### 1.2 The Solution — AegisNet
AegisNet is an edge-AI-first environmental sentinel mesh. Each physical node (built on Qualcomm edge-AI hardware, e.g., a Dragonwing/RB-class SoC) runs a lightweight on-device correlation model that fuses multiple sensor channels locally — so a node can classify "this is smoke, not steam" or "this is a flash-flood surge, not a passing boat wake" without waiting on the cloud. Only classified events (not raw streams) are pushed upstream, which:
- Cuts bandwidth by ~90%
- Keeps working over degraded/offline links (LoRa/mesh fallback)
- Cuts false-positive dispatches dramatically
- Enables sub-5-second local alarm triggering (siren/relay) even with zero connectivity

Verified events are then correlated across nodes (spatial + temporal correlation) in a regional aggregation layer, auto-classified by severity, and routed through a multi-agency escalation engine that opens the correct communication channel (Fire, GSDMA, Municipal Corporation, Police, Hospital) automatically — with a human-in-the-loop confirmation step before irreversible actions (like a public siren or citizen evacuation advisory) fire.

### 1.3 Core Differentiators
| # | Feature | Why It Wins |
|---|---------|-------------|
| 1 | **On-device Edge-AI correlation** | Works with zero network; near-zero latency |
| 2 | **Cross-node spatial correlation** | Kills false positives; confirms real disasters fast |
| 3 | **Auto multi-agency dispatch with audit trail** | Removes the human bottleneck of phone-tree escalation |
| 4 | **Citizen-facing public portal** | Public trust + last-mile awareness |
| 5 | **Full offline-first mesh (LoRa fallback)** | Survives exactly the infrastructure collapse it's meant to detect |
| 6 | **Scenario Simulator** | Live, convincing demo for judges without needing real sensors |
| 7 | **GSDMA-aligned data model** | Deployment-ready, not just a hackathon toy |

### 1.4 Target Users
- State/District Disaster Management Officers (GSDMA, District Collectorate)
- Municipal Corporation Environmental Cells (AMC, SMC, VMC)
- Fire & Emergency Services
- Police Control Rooms
- Hospitals / Emergency Medical Response
- General Public (read-only public safety portal)

---

## 2. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EDGE LAYER — QUALCOMM EDGE-AI NODES                      │
│                                                                             │
│  [Water Level & Flow]   [Smoke, Thermal, Flame]  [AQI: PM2.5, NO2, CO, SO2] │
│  [Chemical VOC/Gas]     [Seismic Vibration]     [Local Siren & Relay Trigger]│
│                                   │                                         │
│                      On-Device Edge-AI Model (TFLite/QNN)                    │
│                      Instant Local Siren (<5s on WAN failure)               │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ Primary: WiFi / 4G / 5G
                                    │ Fallback: LoRa Mesh (SX1262)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REGIONAL AGGREGATION & BACKEND                        │
│                                                                             │
│  [Regional Gateway Node] ──▶ [API Gateway / REST + WebSocket]               │
│                                      │                                      │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │ Cross-Node Correlation Engine • GSDMA Severity Classifier            │  │
│  │ Multi-Agency Dispatch Engine • Redis Pub/Sub • PostGIS / TimescaleDB  │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐           ┌─────────────────────────────────┐
│     EMERGENCY AGENCIES        │           │      CLIENT APPLICATIONS        │
│ • GSDMA / Collectorate        │           │ • Authority Dashboard           │
│ • Fire Department             │           │ • Agency Command Console        │
│ • Municipal Corporation       │           │ • Public Citizen Portal         │
│ • Police Control Room         │           │ • Field Responder PWA           │
│ • Hospitals & EMS (108)       │           │ • Node Fleet & Provisioning     │
└───────────────────────────────┘           └─────────────────────────────────┘
```

### 2.1 Data Flow Summary
1. **Sense:** Multi-channel sensors sample continuously at the node.
2. **Classify (Edge):** On-device model fuses channels into an event class + confidence score, fully offline-capable.
3. **Act Local:** If confidence exceeds the local safety threshold, the node fires its own siren/relay instantly — disaster response never waits on the network.
4. **Transmit:** A compact event payload (not raw telemetry) is sent via WiFi/4G, falling back to LoRa mesh through neighboring nodes/gateways.
5. **Correlate (Cloud):** The aggregation layer checks if nearby/upstream nodes reported correlated events within a time window, boosting or discounting confidence.
6. **Classify Severity:** Advisory / Watch / Warning / Emergency, per GSDMA-style tiers.
7. **Dispatch:** Rules engine matches event type + severity + geography to the correct agency contact tree; auto-drafts (and for high severity, auto-sends) notifications, with every action logged to an immutable audit trail.
8. **Inform:** Dashboards update live via WebSocket; the public portal surfaces a simplified, verified advisory for the affected zone.

---

## 3. Hardware & Edge-AI Simulation Layer

### 3.1 Reference Hardware (Real Deployment)
| Component | Spec | Purpose |
|-----------|------|---------|
| **Compute** | Qualcomm Dragonwing / RB-class SoC (edge-AI NPU) | On-device inference |
| **Connectivity** | WiFi 6 + 4G/5G modem + LoRa (SX1262) | Primary + mesh fallback |
| **Power** | Solar panel + LiFePO4 battery + charge controller | Off-grid resilience |
| **Enclosure** | IP67-rated weatherproof housing | Flood/fire site survivability |
| **Sensors** | Modular sensor bay (Water, Smoke/Flame, AQI, Gas, Seismic) | Swappable per deployment site |

### 3.2 Hackathon Simulation Layer
- Spins up virtual nodes with realistic GPS coordinates across Gandhinagar, Ahmedabad, Surat, and Vadodara.
- Generates baseline "noise" telemetry (normal ranges) continuously.
- Accepts Scenario Injections from the Scenario Simulation Controller to simulate a flood surge, fire outbreak, gas leak, or transient noise with realistic sensor curves.
- Runs the same edge-AI classification logic packaged in the frontend/backend services.
- Exposes a "Hardware Mode" toggle in Settings so judges see this is architected for real Qualcomm hardware.

---

## 4. Design System (Light UI Foundations)

Optimized for daylight control-room clarity and high-contrast projector readability:

### 4.1 Color Tokens
```css
:root {
  /* Base */
  --bg-app: #F7F9FB;
  --bg-surface: #FFFFFF;
  --bg-surface-raised: #FFFFFF;
  --bg-muted: #EEF2F6;
  --border-subtle: #E3E8EF;
  --border-strong: #CBD5E1;

  /* Text */
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;

  /* Brand */
  --brand-primary: #0B6E4F;      /* Deep Forest Green — Environment */
  --brand-primary-hover: #08573F;
  --brand-accent: #0B84C9;       /* Water / Sky Blue */

  /* Severity Scale (GSDMA-style) */
  --sev-advisory: #2E7D32;       /* Green */
  --sev-watch: #B58900;          /* Amber */
  --sev-warning: #E0621A;        /* Orange */
  --sev-emergency: #C62828;      /* Red */
  --sev-emergency-bg: #FDECEC;

  /* Sensor Category Accents */
  --sensor-flood: #0B84C9;
  --sensor-fire: #E0621A;
  --sensor-air: #6B4FA0;
  --sensor-chem: #B58900;
  --sensor-seismic: #475569;
}
```

### 4.2 Typography & Layout
- **Headings:** Inter / Manrope (600–700 weight).
- **Body:** Inter (400–500 weight).
- **Data / Monospace:** IBM Plex Mono / JetBrains Mono (readings, node IDs, coordinates, timestamps).
- **Layout:** Sticky 64px top header, persistent 240px (collapsible to 64px) left sidebar, 12-column responsive grid (max width 1440px), 8px spatial rhythm, 12px card border radius, clean subtle borders.

---

## 5. Comprehensive UI & Page-by-Page Specifications

### 5.1 Global Navigation & Header
- **Top Header (sticky, 64px, white background, 1px bottom border):**
  - **Left:** AegisNet logo mark + wordmark (click $\to$ `/dashboard`).
  - **Center-left:** Regional filter dropdown (Gandhinagar / Ahmedabad / Surat / Vadodara / All Gujarat).
  - **Center-right:** Global search bar (shortcut `Ctrl+K` / `⌘K`).
  - **Right cluster:**
    - System Health Indicator (pulsing green dot + `142/148 nodes online`).
    - Live Alert Bell with unread badge counter.
    - **Simulation Mode Badge:** Visible when scenario active (`🧪 SIMULATION ACTIVE` in bright amber).
    - User menu (avatar, role badge e.g. "GSDMA Officer", Settings, Logout).
- **Left Sidebar (240px, collapsible to 64px icon rail):**
  - `🏠 Dashboard` (`/dashboard`)
  - `🗺️ Live Map` (`/map`)
  - `📜 History & Reports` (`/history`)
  - `🧠 AI Analysis` (`/analysis`)
  - `🚨 Alerts` (`/alerts` — with active badge count)
  - `🎛️ Command Console` (`/console` — agency incident control)
  - `🌐 Public Portal` (`/public` — citizen safety view)
  - `🛰️ Node Fleet` (`/fleet` — hardware provisioning)
  - `⚙️ Settings` (`/settings` — thresholds & dispatch rules)
  - Divider $\to$ `🧪 Scenario Simulator` (demo trigger drawer)

### 5.2 Global Footer
- **Left:** `© 2026 AegisNet · SIH26178 · Built for GSDMA Integration`
- **Center:** `Backend: Connected · Last sync: 2s ago · Mesh fallback: Standby`
- **Right:** `Docs · API Status · v2.0.0`

### 5.3 Page 1: Dashboard (`/` or `/dashboard`)
- **Hero Stat Row:** Active Nodes Online, Active Alerts (with mini severity breakdown bar), Regions Monitored, Avg. Detection-to-Dispatch Time (<5s).
- **Live Regional Map (Compact):** Embedded GIS overview with click-through to full map.
- **Two-Column Split:**
  - *Left:* Live Event Timeline — classified event stream with category icon, node name, location, severity pill, and timestamp.
  - *Right:* Active Emergencies Panel — Warning & Emergency tier cards with one-click "Open in Command Console" action.
- **Sensor Category Health Grid:** 5 category tiles (Flood, Fire, Air Quality, Chemical, Seismic) showing active node counts and mini trend indicators.
- **Recent Dispatch Log:** Compact table showing last 10 agency dispatches with delivery status (`✅ Delivered`, `⏳ Pending`, `❌ Retrying`).

### 5.4 Page 2: Geographic Monitoring Map (`/map`)
- Full-bleed interactive map with light "Positron" CartoDB basemap.
- Floating Layer Toggles: Node Pins, River/Flood Zones, Forest Reserves, Industrial GIDC Corridors, Population Density, Wind Direction Vector.
- Node Pins color-coded by severity; shapes by sensor category (drop=flood, triangle=fire, circle=air, hexagon=chemical, diamond=seismic).
- **Cross-Node Correlation Rings:** Visual dashed rings connecting correlated nodes with confidence percentage.
- **Drift Prediction Cone:** Directional plume rendering for smoke and chemical leaks based on live wind vector.
- **Time Scrubber:** 24-hour spatial event replay slider at bottom-left.

### 5.5 Page 3: Reading History & Reports (`/history`)
- Comprehensive audit filters: Date range, Sensor category, Region, Severity, Agency notified, free-text search.
- Dual View: Interactive Recharts time-series with shaded threshold bands OR paginated data grid.
- **Generate Incident Report:** One-click automated PDF / CSV export for official GSDMA compliance filing.

### 5.6 Page 4: AI Environmental Analysis (`/analysis`)
- **Model Confidence Explainer:** Deconstructs sensor feature weights (e.g. *Water level +0.31, Flow rate +0.22, Upstream rainfall +0.19 $\to$ 0.82 Flood confidence*).
- **Cross-Node Correlation Graph:** Node-link visual showing multi-hop corroboration and time-lag.
- **False-Positive Suppression Log:** Live log of transient sensor spikes suppressed by the on-device edge model (e.g., vehicle exhaust transient suppressed).
- **Trend Forecasting:** 1-6 hour projected trajectory with confidence bands.

### 5.7 Page 5: Immediate Warnings & Alerts (`/alerts`)
- Triage queue filtered by GSDMA tiers: All, Advisory, Watch, Warning, Emergency, Resolved.
- Emergency alerts pinned to the top with red accent and subtle pulse animation.
- Acknowledgment audit dialog requiring officer confirmation, recording officer ID and timestamp.
- Real-time Agency Dispatch Tracker on each incident card.

### 5.8 Page 6: Individual Node Telemetry Detail (`/nodes/:id`)
- Deep-dive diagnostic view: Node ID, GPS location, mini-map, battery/solar charge %, firmware version, LoRa RSSI.
- Live Sensor Grid: Current value, sparkline, distance-to-threshold gauge per attached sensor.
- Node Maintenance Actions: Mute Node (maintenance mode) and Simulate Event on Node.

### 5.9 Page 7: Authority Gateway & Authentication (`/login`)
- Clean split-screen layout with Gujarat live monitoring ticker (`142 nodes actively monitoring Gujarat`).
- Server-determined RBAC authentication (GSDMA Officer, Municipal Officer, Fire Dept, Police, Hospital, Super Admin).
- **1-Click "Enter 3-Node Room Demo Mode":** Instant access for judging demonstrations.

### 5.10 Page 8: Agency Command Console (`/console`) — NEW
- **Incident Header:** Emergency type, affected geography, confidence %, active duration.
- **Multi-Agency Dispatch Board (Kanban):** Columns for *Not Notified $\to$ Notified $\to$ Acknowledged $\to$ Responding $\to$ On Scene* across GSDMA, Fire, Municipal, Police, and EMS.
- **Public Advisory Composer:** Pre-filled draft advisory reviewed by an authorized officer and pushed live to the Public Portal with 1 click.
- **Shared Incident Notes Log:** Real-time inter-agency operational log.

### 5.11 Page 9: Public Citizen Portal (`/public`) — NEW
- High-contrast, mobile-first, no login required.
- Regional Status Banner: `✅ Normal`, `⚠️ Watch Issued`, or `🚨 Emergency — Evacuate [Zone]`.
- Verified, officer-approved advisories only (zero raw panic data).
- "What should I do?" plain-language safety instructions per severity tier.
- SMS / Push alert subscription by locality.
- Language Switcher: **English / ગુજરાતી (Gujarati) / हिन्दी (Hindi)**.

### 5.12 Page 10: Node Fleet & Provisioning (`/fleet`) — NEW
- Fleet inventory table with battery, firmware version, connectivity mode, and sensor bay configuration.
- Add Node Wizard with interactive map coordinate picker and modular sensor bay selection.
- Bulk Actions: simulated OTA firmware upgrade, maintenance mute, CSV export.

### 5.13 Page 11: Settings & Org Admin (`/settings`) — NEW
- Threshold & Sensitivity tuning across the 5 sensor categories.
- Dispatch Rules Engine matrix (Event Type $\times$ Severity $\to$ Agencies + SLA).
- Hardware Mode switch: **Simulated Fleet** vs. **Live Qualcomm Hardware Ingestion**.
- Platform Audit Log: Immutable record of privileged user actions.

### 5.14 Global Modals & System Overlays
- **Emergency Confirmation Modal:** Prevents accidental public sirens or mass citizen advisories.
- **Command Palette (`Ctrl+K`):** Quick jump to any node, page, or active incident.
- **Scenario Simulator Drawer:** Global slide-out controller with 5 live demo scenarios.

---

## 6. Sensor Types & Regional Landmark Auto-Detection

### 6.1 Modular Sensor Bays
| Category | Sensors | Key Metrics | Typical Placement |
|----------|---------|-------------|-------------------|
| 🌊 **Flood** | Ultrasonic depth, flow rate, rain gauge | cm level, m³/s flow, mm/hr rain | Riverbanks, canals, low-lying catchments |
| 🔥 **Fire** | Thermal IR, smoke particulate, flame sensor | °C, smoke density, flame index | Forest reserves, scrublands, industrial buffers |
| 🌫️ **Air Quality** | PM2.5, PM10, CO, NO2, SO2, O3 | µg/m³, ppm | Urban intersections, industrial corridors |
| ☣️ **Chemical/Gas**| VOC, LPG/CH4, H2S, ammonia | ppm | Petrochemical plants, chemical GIDCs |
| 🌐 **Seismic** | MEMS accelerometer / vibration | magnitude proxy, mm/s² | Dam abutments, bridges, structural pillars |

### 6.2 Gujarat Regional Landmark Auto-Detection
Nodes reverse-match coordinates within 3.5 km against major Gujarat assets:
- *Rivers & Dams:* Sabarmati Riverfront, Vasna Barrage, Sant Sarovar Dam, Tapi River Weir, Narmada Canal.
- *Lakes & Wetlands:* Kankaria Lake, Vastrapur Lake, Chandola Lake, Thol Lake Sanctuary.
- *Forests & Parks:* Indroda Nature Park, Punit Van Botanical Reserve.
- *Industrial Corridors:* Narol-Vatva GIDC, Sector 24 GIDC, Nandesari Petrochemical Estate, Hazira Belt.

---

## 7. Emergency Dispatch & Multi-Agency Escalation Engine

### 7.1 GSDMA-Aligned Severity Tiers
| Tier | Color | Trigger Logic | Action |
|------|-------|---------------|--------|
| **Advisory** | Green (`#2E7D32`) | Single-node minor deviation | Logged, visible on dashboard |
| **Watch** | Amber (`#B58900`) | Sustained single-node or low-confidence multi-node | In-app + email to officer |
| **Warning** | Orange (`#E0621A`) | Multi-node correlated event, high confidence | SMS + email to agencies, Command Console auto-opens |
| **Emergency** | Red (`#C62828`) | High-confidence rapid-onset catastrophe | Instant multi-agency notify + local siren + public advisory draft |

### 7.2 Dispatch Rules & SLA Matrix
- `Flood + Warning` $\to$ GSDMA (SMS/call), Municipal (SMS), Police (SMS) | SLA: 5 min
- `Flood + Emergency` $\to$ GSDMA, Municipal, Police, Fire, Hospitals (call all) | SLA: 2 min
- `Fire + Warning` $\to$ Fire Dept (SMS/call), Forest Dept (SMS) | SLA: 5 min
- `Fire + Emergency` $\to$ Fire, Police, Hospitals, GSDMA (call all) | SLA: 2 min
- `Chemical + Warning+` $\to$ Fire (HAZMAT), Hospitals, Police, GSDMA (call all) | SLA: 2 min
- `AirQuality + Warning` $\to$ Municipal Health Cell (SMS) | SLA: 30 min

---

## 8. Scenario Simulation Controller

Accessed via the floating `🧪 Simulate` button or global sidebar:
1. **Flash Flood — Sabarmati Upstream Surge:** Ramps water level at 3 upstream nodes over 90s; downstream nodes receive early correlated warnings before local threshold breaches.
2. **Forest Fire Outbreak:** Thermal & smoke ramp at Indroda Forest nodes; generates live wind drift cone on map.
3. **Industrial Gas Leak:** Chemical sensor spike at Narol-Vatva with adjacent AQI correlation; triggers HAZMAT dispatch path.
4. **False Positive Test:** Single transient spike on one node without correlation; demonstrates on-device suppression without triggering alert dispatches.
5. **Network Degradation Drill:** Forces nodes into simulated LoRa-fallback mode; proves local sirens fire in <5s despite zero internet connectivity.

---

## 9. Backend Services & API Specifications

| Service | Port | Key Endpoints | Description |
|---------|------|---------------|-------------|
| **`backend-node`** | 4000 | `/api/nodes`, `/api/alerts`, `/api/incidents`, `/api/thresholds`, `/api/auth` | Express 4, Socket.IO, PostgreSQL pool, dispatch engine |
| **`backend-ai`** | 8000 | `/correlate`, `/forecast`, `/health` | FastAPI, spatial distance-decay, linear & LSTM projections |
| **`mosquitto`** | 1883 | Topics: `aegisnet/+/telemetry`, `aegisnet/+/alerts` | MQTT v2 broker for LoRa/cellular telemetry |

---

## 10. Database Schema & Data Models
- Core tables in PostgreSQL 16: `nodes`, `readings` (TimescaleDB hypertable), `events`, `incidents`, `incident_events`, `dispatches`, `users`, `advisories`, `audit_log`.

---

## 11. AI/ML & Edge-Correlation Pipeline
- **Edge Model:** Lightweight gradient-boosted / small NN classifier exportable to TFLite / Qualcomm QNN runtime.
- **Cloud Correlation:** Sliding 10-minute spatial join:
  $$\text{Confidence}_{\text{final}} = \text{Confidence}_{\text{base}} + \text{Bonus}(\text{neighbors}, \text{avg\_confidence}, \Delta t)$$
- **Explainability:** Contributing factors stored per event for full transparency in the AI Analysis view.

---

## 12. Security, Reliability & Offline-First Design
- Server-enforced RBAC with JWT auth.
- Immutable audit log for every privileged action.
- Offline-first: sub-5s local siren trigger on WAN failure; store-and-forward queue on LoRa mesh fallback.
- Read-only, sanitized public portal preventing unverified panic.

---

## 13. Setup, Execution & Deployment Guide
- **Standalone Demo Mode:**
  ```bash
  cd aegisnet/frontend
  npm install
  npm run dev
  # Open http://localhost:3000 -> Click Authority Login -> Enter 3-Node Room Demo Mode
  ```
- **Full Stack Docker Compose:**
  ```bash
  cd aegisnet
  cp .env.example .env
  docker compose up --build
  ```

---

## 14. Demo Script & Judging-Criteria Alignment
- **(0:00 - 0:20) Dashboard:** Show live grid health across 142 nodes in Gujarat.
- **(0:20 - 1:00) Trigger Flash Flood Scenario:** Show local siren fire instantly on upstream node before cloud dispatch.
- **(1:00 - 1:40) Map View:** Correlation ring connects 3 nodes, confidence climbs, drift vector updates.
- **(1:40 - 2:10) AI Analysis:** Walk through the confidence breakdown and show the separate False-Positive-Suppression log entry.
- **(2:10 - 2:50) Command Console:** Show dispatch Kanban moving agencies from Notified $\to$ Acknowledged; officer approves public advisory with 1 click.
- **(2:50 - 3:00) Public Portal:** Show published citizen advisory live in English, Gujarati, and Hindi.
