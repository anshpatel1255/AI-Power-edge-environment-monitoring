// store/useStore.js — Zustand global state: Gujarat Network, AI Sensor Suggestions & Multi-Agency Emergency Escalation

import { create } from 'zustand'

// ─── 6 Environmental Sensor Types Definition ─────────────────────────────────
export const SENSOR_TYPES = [
  {
    id: 'water',
    type: 'Water Level / Flood',
    label: '🌊 Water / Flood',
    badge: 'WATER',
    desc: 'Ultrasonic depth sensor (Lakes, Dams, Riverfront, Canals)',
    metric: 'Water Depth',
    unit: 'm',
    defaultVal: '0.45 m',
    color: '#0D9488',
  },
  {
    id: 'air',
    type: 'Air Quality / AQI',
    label: '🌫 Air Quality / AQI',
    badge: 'AIR AQI',
    desc: 'MQ-135 + PM2.5 cell (Smoke, Smog, Industrial Corridors)',
    metric: 'AQI Index',
    unit: 'AQI',
    defaultVal: '42 AQI',
    color: '#8B5CF6',
  },
  {
    id: 'fire',
    type: 'Thermal & Fire',
    label: '🔥 Thermal & Fire',
    badge: 'FIRE IR',
    desc: 'Infrared optical detector (Forests, Scrubland, Tree Belts)',
    metric: 'Flame & Heat',
    unit: 'IR Sensor',
    defaultVal: 'Normal (Safe)',
    color: '#F97316',
  },
  {
    id: 'temperature',
    type: 'Temperature',
    label: '🌡 Temperature',
    badge: 'THERMAL',
    desc: 'Precision DS18B20 thermistor (Urban Heat Islands & Microclimates)',
    metric: 'Ambient Temp',
    unit: '°C',
    defaultVal: '29.4°C',
    color: '#D97706',
  },
  {
    id: 'humidity',
    type: 'Humidity & Moisture',
    label: '💧 Humidity & Soil',
    badge: 'MOISTURE',
    desc: 'Soil capacitance probe (Wetlands, Waterlogging, Farmlands)',
    metric: 'Soil & RH',
    unit: '%',
    defaultVal: '68%',
    color: '#22C55E',
  },
  {
    id: 'gas',
    type: 'Gas & Chemical Pollution',
    label: '☁️ Gas & Chemicals',
    badge: 'TOXIC GAS',
    desc: 'Multi-gas VOC electrochemical cell (Chemical GIDCs & Dyes)',
    metric: 'Chemical VOC',
    unit: 'ppm',
    defaultVal: '36 ppm',
    color: '#EC4899',
  },
]

// ─── Known Gujarat Lakes & Vulnerable Landmarks for Auto-Detection ───────────
export const GUJARAT_LANDMARKS = [
  { name: 'Kankaria Lake Reservoir, Ahmedabad', type: 'lake', isLake: true, lat: 23.0063, lng: 72.6026 },
  { name: 'Vastrapur Lake, Ahmedabad', type: 'lake', isLake: true, lat: 23.0360, lng: 72.5290 },
  { name: 'Chandola Lake Basin, Ahmedabad', type: 'lake', isLake: true, lat: 22.9868, lng: 72.5892 },
  { name: 'Thol Lake Bird Sanctuary & Wetland', type: 'lake', isLake: true, lat: 23.1412, lng: 72.3980 },
  { name: 'Sant Sarovar Dam / Sabarmati, Gandhinagar', type: 'dam', isLake: false, lat: 23.2385, lng: 72.6710 },
  { name: 'Sabarmati Riverfront Promenade, Ahmedabad', type: 'river', isLake: false, lat: 23.0280, lng: 72.5730 },
  { name: 'Narmada Main Canal Siphon, Gandhinagar', type: 'canal', isLake: false, lat: 23.1670, lng: 72.6010 },
  { name: 'Gota Lake Catchment, Ahmedabad', type: 'lake', isLake: true, lat: 23.0970, lng: 72.5320 },
  { name: 'Ghodasar Lake, Ahmedabad', type: 'lake', isLake: true, lat: 22.9890, lng: 72.6100 },
  { name: 'Indroda Nature Park & Deer Forest, Gandhinagar', type: 'forest', isLake: false, lat: 23.1950, lng: 72.6520 },
  { name: 'Punit Van Botanical Park, Gandhinagar', type: 'forest', isLake: false, lat: 23.2100, lng: 72.6400 },
  { name: 'Narol-Vatva GIDC Industrial Corridor, Ahmedabad', type: 'industrial', isLake: false, lat: 22.9734, lng: 72.5898 },
  { name: 'Sector 24 GIDC Electronics Estate, Gandhinagar', type: 'industrial', isLake: false, lat: 23.2500, lng: 72.6300 },
  { name: 'Ahmedabad Urban Heat Island (Kalupur Core)', type: 'urban', isLake: false, lat: 23.0305, lng: 72.6000 },
  { name: 'Sabarmati Downstream Agricultural Basin', type: 'agricultural', isLake: false, lat: 22.9200, lng: 72.5100 },
  { name: 'Nandesari Petrochemical Belt, Vadodara', type: 'industrial', isLake: false, lat: 22.4110, lng: 73.0980 },
  { name: 'Tapi River Weir Causeway, Surat', type: 'water', isLake: false, lat: 21.1959, lng: 72.8302 },
]

export function detectGujaratLandmark(lat, lng) {
  let closest = null
  let minDistance = Infinity

  for (const lm of GUJARAT_LANDMARKS) {
    const dLat = (lat - lm.lat) * 111.0
    const dLng = (lng - lm.lng) * 111.0 * Math.cos((lat * Math.PI) / 180.0)
    const dist = Math.sqrt(dLat * dLat + dLng * dLng)
    if (dist < minDistance) {
      minDistance = dist
      closest = { ...lm, distanceKm: dist }
    }
  }

  if (closest && minDistance <= 3.5) {
    return {
      name: closest.name,
      isLake: closest.isLake,
      isNearby: true,
      distanceKm: closest.distanceKm,
      distanceText: `${(closest.distanceKm * 1000).toFixed(0)}m from ${closest.name}`,
    }
  }

  return {
    name: `Gujarat Zone (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
    isLake: false,
    isNearby: false,
    distanceKm: null,
    distanceText: 'Custom GPS Coordinates',
  }
}

// ─── AI Sensor Placement Recommendations for Gujarat (Lakes, Rivers, Forests, Industrial) ───
export const AI_HOTSPOT_SUGGESTIONS = [
  {
    id: 'HOTSPOT-LAKE-01',
    sensor_type: 'Water Level / Flood',
    recommended_for: 'water',
    name: 'Kankaria Lake Reservoir, Ahmedabad',
    city: 'Ahmedabad',
    lat: 23.0063,
    lng: 72.6026,
    gps: '23.0063° N, 72.6026° E',
    risk_level: 'High Public Urban Lake Catchment',
    ai_rationale: 'AI Lake Analysis: Major historical urban lake. Real-time water depth and runoff telemetry prevents overflow into surrounding Maninagar residential areas.',
  },
  {
    id: 'HOTSPOT-LAKE-02',
    sensor_type: 'Water Level / Flood',
    recommended_for: 'water',
    name: 'Thol Lake Bird Sanctuary & Wetland',
    city: 'Gandhinagar / Mehsana',
    lat: 23.1412,
    lng: 72.3980,
    gps: '23.1412° N, 72.3980° E',
    risk_level: 'Critical Ecological Wetland & Waterbody',
    ai_rationale: 'AI Lake Analysis: Ecological freshwater wetland. Monitors water depth fluctuations and soil saturation levels for flood management.',
  },
  {
    id: 'HOTSPOT-LAKE-03',
    sensor_type: 'Water Level / Flood',
    recommended_for: 'water',
    name: 'Chandola Lake Basin, Ahmedabad',
    city: 'Ahmedabad',
    lat: 22.9868,
    lng: 72.5892,
    gps: '22.9868° N, 72.5892° E',
    risk_level: 'Low-Lying Drainage Catchment',
    ai_rationale: 'AI Lake Analysis: Key storm runoff waterbody in South Ahmedabad. Prevents flash waterlogging in surrounding industrial wards.',
  },
  {
    id: 'HOTSPOT-LAKE-04',
    sensor_type: 'Water Level / Flood',
    recommended_for: 'water',
    name: 'Vastrapur Lake Catchment, Ahmedabad',
    city: 'Ahmedabad',
    lat: 23.0360,
    lng: 72.5290,
    gps: '23.0360° N, 72.5290° E',
    risk_level: 'Urban Stormwater Reservoir',
    ai_rationale: 'AI Lake Analysis: Key recreation & urban lake in West Ahmedabad. Prevents localized urban flooding during sudden cloudburst storms.',
  },
  {
    id: 'HOTSPOT-01',
    sensor_type: 'Water Level / Flood',
    recommended_for: 'water',
    name: 'Sant Sarovar Dam / Sabarmati Riverfront, Gandhinagar',
    city: 'Gandhinagar',
    lat: 23.2385,
    lng: 72.6710,
    gps: '23.2385° N, 72.6710° E',
    risk_level: 'High Flood Inundation Vulnerability',
    ai_rationale: 'AI Analysis: High monsoon discharge zone from Dharoi Dam. Installing ultrasonic water sensor provides 45+ min early evacuation warning for Gandhinagar lowlands.',
  },
  {
    id: 'HOTSPOT-02',
    sensor_type: 'Water Level / Flood',
    recommended_for: 'water',
    name: 'Sabarmati Riverfront & Vasna Barrage, Ahmedabad',
    city: 'Ahmedabad',
    lat: 22.9860,
    lng: 72.5510,
    gps: '22.9860° N, 72.5510° E',
    risk_level: 'Critical Sluice Gate Catchment',
    ai_rationale: 'AI Analysis: Major urban flood regulator. Real-time rate-of-rise sensing directly prevents inundation across Ahmedabad municipal wards.',
  },
  {
    id: 'HOTSPOT-03',
    sensor_type: 'Air Quality / AQI',
    recommended_for: 'air',
    name: 'Narol-Vatva GIDC Industrial Corridor, Ahmedabad',
    city: 'Ahmedabad',
    lat: 22.9734,
    lng: 72.5898,
    gps: '22.9734° N, 72.5898° E',
    risk_level: 'Severe Industrial Chemical AQI Exposure',
    ai_rationale: 'AI Analysis: Dense cluster of chemical, textile, and dye manufacturing. MQ-135 sensor recommended to alert GPCB of toxic gas spikes.',
  },
  {
    id: 'HOTSPOT-04',
    sensor_type: 'Air Quality / AQI',
    recommended_for: 'air',
    name: 'Sector 24 GIDC & Electronics Estate, Gandhinagar',
    city: 'Gandhinagar',
    lat: 23.2500,
    lng: 72.6300,
    gps: '23.2500° N, 72.6300° E',
    risk_level: 'Moderate Urban Ambient Exposure',
    ai_rationale: 'AI Analysis: Captures particulate cross-flow entering capital administrative quarters from northern highway bypass.',
  },
  {
    id: 'HOTSPOT-05',
    sensor_type: 'Thermal & Fire',
    recommended_for: 'fire',
    name: 'Indroda Nature Park & Deer Forest, Gandhinagar',
    city: 'Gandhinagar',
    lat: 23.1950,
    lng: 72.6520,
    gps: '23.1950° N, 72.6520° E',
    risk_level: 'High Dry Scrub Wildfire Risk',
    ai_rationale: 'AI Analysis: Extensive dry scrub vegetation along riverbank. Thermal IR flame sensor detects bushfire outbreaks before spreading to Infocity.',
  },
  {
    id: 'HOTSPOT-06',
    sensor_type: 'Temperature',
    recommended_for: 'temperature',
    name: 'Ahmedabad Urban Heat Island & Kalupur Junction',
    city: 'Ahmedabad',
    lat: 23.0305,
    lng: 72.6000,
    gps: '23.0305° N, 72.6000° E',
    risk_level: 'Extreme Heatwave Microclimate',
    ai_rationale: 'AI Analysis: High-density concrete core creates heat island anomalies exceeding +4°C above surrounding regions.',
  },
  {
    id: 'HOTSPOT-07',
    sensor_type: 'Humidity & Moisture',
    recommended_for: 'humidity',
    name: 'Sabarmati Downstream Agricultural Lowlands',
    city: 'Ahmedabad Rural',
    lat: 22.9200,
    lng: 72.5100,
    gps: '22.9200° N, 72.5100° E',
    risk_level: 'Soil Saturation & Crop Waterlogging Watch',
    ai_rationale: 'AI Analysis: River overflow causes agricultural crop waterlogging. Soil capacitance sensors track saturation thresholds.',
  },
  {
    id: 'HOTSPOT-08',
    sensor_type: 'Gas & Chemical Pollution',
    recommended_for: 'gas',
    name: 'Nandesari Petrochemical Belt, Vadodara',
    city: 'Vadodara',
    lat: 22.4110,
    lng: 73.0980,
    gps: '22.4110° N, 73.0980° E',
    risk_level: 'Critical Volatile Chemical Gas Watch',
    ai_rationale: 'AI Analysis: High risk of organic vapor dispersion. Multi-gas cell alerts GPCB & NDRF 6th Battalion in Jarod.',
  },
]

// ─── Initial Live Sensors in Gujarat (Gandhinagar, Ahmedabad, Surat, Vadodara) ─
const INITIAL_GUJARAT_NODES = [
  {
    node_id: 'S-001',
    code: 'NODE-AIR-AHD',
    name: 'Sensor S-001 (Air Sentinel)',
    type: 'Air Quality / Gas',
    city: 'Ahmedabad',
    location: 'Narol-Vatva Industrial Zone, Ahmedabad',
    gps: '22.9734° N, 72.5898° E',
    latitude: 22.9734,
    longitude: 72.5898,
    location_desc: 'Industrial chemical emissions & urban ambient AQI',
    is_gateway: false,
    battery_pct: 88,
    solar_charging: true,
    rssi: -68,
    connection: 'LoRa Mesh (GPS Sync)',
    status: 'online',
    risk_flood: 12,
    risk_fire: 14,
    risk_pollution: 34,
    water_level_cm: 20.0,
    temperature_c: 29.2,
    humidity_pct: 62,
    smoke_aqi: 42,
    gas_ppm: 48,
    flame_detected: false,
    last_update: '4 sec ago',
  },
  {
    node_id: 'S-002',
    code: 'NODE-WATER-GNR',
    name: 'Sensor S-002 (Water Sentinel)',
    type: 'Water Level / Flood',
    city: 'Gandhinagar',
    location: 'Sant Sarovar Dam / Sabarmati, Gandhinagar',
    gps: '23.2385° N, 72.6710° E',
    latitude: 23.2385,
    longitude: 72.6710,
    location_desc: 'Sant Sarovar reservoir & Sabarmati River flood gauge',
    is_gateway: false,
    battery_pct: 94,
    solar_charging: true,
    rssi: -71,
    connection: 'LoRa Mesh (GPS Sync)',
    status: 'online',
    risk_flood: 38,
    risk_fire: 6,
    risk_pollution: 16,
    water_level_cm: 45.0,
    temperature_c: 27.0,
    humidity_pct: 78,
    smoke_aqi: 24,
    gas_ppm: 26,
    flame_detected: false,
    last_update: '6 sec ago',
  },
  {
    node_id: 'S-003',
    code: 'NODE-FIRE-GNR',
    name: 'Sensor S-003 (Forest Sentinel)',
    type: 'Thermal & Flame',
    city: 'Gandhinagar',
    location: 'Indroda Nature Park & Green Belt, Gandhinagar',
    gps: '23.1950° N, 72.6520° E',
    latitude: 23.1950,
    longitude: 72.6520,
    location_desc: 'Dry scrub forest perimeter & thermal anomaly detector',
    is_gateway: false,
    battery_pct: 82,
    solar_charging: false,
    rssi: -79,
    connection: 'LoRa Multi-Hop (GPS Sync)',
    status: 'online',
    risk_flood: 8,
    risk_fire: 26,
    risk_pollution: 28,
    water_level_cm: 15.0,
    temperature_c: 32.5,
    humidity_pct: 48,
    smoke_aqi: 38,
    gas_ppm: 34,
    flame_detected: false,
    last_update: '10 sec ago',
  },
  {
    node_id: 'GW-001',
    code: 'GSDMA-GATEWAY',
    name: 'Gateway GW-001 (Gujarat Central Hub)',
    type: 'LoRa Gateway & Multi-Agency Uplink',
    city: 'Gandhinagar',
    location: 'GSDMA Disaster Management HQ, Gandhinagar',
    gps: '23.2230° N, 72.6492° E',
    latitude: 23.2230,
    longitude: 72.6492,
    location_desc: 'Central Command Uplink to Police (100), Fire (101) & 108 Ambulance',
    is_gateway: true,
    battery_pct: 98,
    solar_charging: true,
    rssi: -58,
    connection: 'Dual Fiber + 5G Gateway',
    status: 'online',
    risk_flood: 20,
    risk_fire: 12,
    risk_pollution: 24,
    water_level_cm: 25.0,
    temperature_c: 28.0,
    humidity_pct: 66,
    smoke_aqi: 30,
    gas_ppm: 32,
    flame_detected: false,
    last_update: 'Just now',
  },
  {
    node_id: 'S-004',
    code: 'NODE-WATER-SURAT',
    name: 'Sensor S-004 (Tapi Basin Sentinel)',
    type: 'Water Level / Flood',
    city: 'Surat',
    location: 'Tapi River Weir Causeway, Surat',
    gps: '21.1959° N, 72.8302° E',
    latitude: 21.1959,
    longitude: 72.8302,
    location_desc: 'Surat coastal & river tidal inundation monitor',
    is_gateway: false,
    battery_pct: 90,
    solar_charging: true,
    rssi: -74,
    connection: 'LoRa Mesh (GPS Sync)',
    status: 'online',
    risk_flood: 42,
    risk_fire: 5,
    risk_pollution: 22,
    water_level_cm: 52.0,
    temperature_c: 28.6,
    humidity_pct: 82,
    smoke_aqi: 26,
    gas_ppm: 29,
    flame_detected: false,
    last_update: '14 sec ago',
  },
  {
    node_id: 'S-005',
    code: 'NODE-AIR-VAD',
    name: 'Sensor S-005 (Petrochem Sentinel)',
    type: 'Air Quality / Gas',
    city: 'Vadodara',
    location: 'Nandesari Petrochemical Belt, Vadodara',
    gps: '22.4110° N, 73.0980° E',
    latitude: 22.4110,
    longitude: 73.0980,
    location_desc: 'Vadodara petrochemical corridor VOC gas monitoring',
    is_gateway: false,
    battery_pct: 86,
    solar_charging: true,
    rssi: -76,
    connection: 'LoRa Mesh (GPS Sync)',
    status: 'online',
    risk_flood: 10,
    risk_fire: 18,
    risk_pollution: 46,
    water_level_cm: 18.0,
    temperature_c: 30.1,
    humidity_pct: 58,
    smoke_aqi: 54,
    gas_ppm: 62,
    flame_detected: false,
    last_update: '18 sec ago',
  },
]

// ─── Active Emergency Alerts in Gujarat ───────────────────────────────────────
const INITIAL_GUJARAT_ALERTS = [
  {
    id: 101,
    severity: 'critical',
    hazard: 'fire',
    title: 'CRITICAL EMERGENCY — Forest Fire Surge',
    sensor_id: 'S-003',
    sensor_name: 'Sensor S-003 (Indroda Nature Park, Gandhinagar)',
    message: 'Active IR Flame detected. Temperature 48.2°C surging rapidly near Infocity green corridor.',
    location: 'Indroda Nature Park & Green Belt, Gandhinagar',
    city: 'Gandhinagar',
    time: '14:28',
    date: '2026-09-16',
    risk_score: 95,
    area_probability: 0.94,
    acknowledged: false,
    // Multi-Agency Emergency Call & Email Rules per user specification:
    callCops: '🚓 COPS DISPATCHED: Gandhinagar Police Control Room (Dial 100 / 112)',
    callFire: '🚒 FIRE BRIGADE DISPATCHED: Gandhinagar Fire & Emergency Station (Dial 101)',
    callAmbulance: '🚑 AMBULANCE EN ROUTE: 108 GVK-EMRI Gujarat Emergency Medical Service',
    mailRecipient: 'TO: gsdma@gujarat.gov.in, collector-gandhinagar@gujarat.gov.in, fire-station.gnr@gujarat.gov.in',
  },
  {
    id: 102,
    severity: 'critical',
    hazard: 'flood',
    title: 'CRITICAL EMERGENCY — Sabarmati River Overflow',
    sensor_id: 'S-002',
    sensor_name: 'Sensor S-002 (Sant Sarovar Dam, Gandhinagar)',
    message: 'Water level reached 1.48 m (+4.5cm/min rapid surge). Dharoi outflow imminent.',
    location: 'Sant Sarovar Dam / Sabarmati River, Gandhinagar',
    city: 'Gandhinagar',
    time: '14:32',
    date: '2026-09-16',
    risk_score: 91,
    area_probability: 0.89,
    acknowledged: false,
    callCops: '🚓 COPS EVACUATION CALL: Sabarmati River Patrol Police & SDRF Team (112)',
    callFire: '🚒 RESCUE TENDER: Gujarat Fire & Rescue Boat Division (101)',
    callAmbulance: '🚑 108 AMBULANCE DISPATCHED: High-Alert Riverfront Staging Units',
    mailRecipient: 'TO: flood-control.gujarat@gov.in, collector-ahmedabad@gujarat.gov.in, gsdma@gujarat.gov.in',
  },
  {
    id: 103,
    severity: 'warning',
    hazard: 'pollution',
    title: 'WARNING — Industrial Chemical AQI Surge',
    sensor_id: 'S-001',
    sensor_name: 'Sensor S-001 (Narol-Vatva, Ahmedabad)',
    message: 'AQI spiked to 192 ppm. Severe chemical hydrocarbon concentration detected.',
    location: 'Narol-Vatva Industrial Zone, Ahmedabad',
    city: 'Ahmedabad',
    time: '14:15',
    date: '2026-09-16',
    risk_score: 72,
    area_probability: 0.78,
    acknowledged: true,
    callCops: '🚓 Police Traffic Diversion Advisory Active (100)',
    callFire: '🚒 Hazmat Chemical Response Standby (101)',
    callAmbulance: '🚑 108 Industrial Medical Support Standby',
    mailRecipient: 'TO: gpcb-ahmedabad@gujarat.gov.in, health-dept.amc@ahmedabadcity.gov.in',
  },
]

// ─── Gujarat Historical Logs ──────────────────────────────────────────────────
const INITIAL_GUJARAT_HISTORY = [
  {
    id: 1,
    time: '14:32:10',
    date: '2026-09-16',
    sensor: 'S-002 (Sant Sarovar, Gandhinagar)',
    location: 'Sant Sarovar Dam / Sabarmati',
    city: 'Gandhinagar',
    temperature: 27.2,
    aqi: 24,
    water_level: '1.48 m',
    status: 'Critical',
    alert_type: 'Flood Overflow',
  },
  {
    id: 2,
    time: '14:28:00',
    date: '2026-09-16',
    sensor: 'S-003 (Indroda Park, Gandhinagar)',
    location: 'Indroda Nature Park & Green Belt',
    city: 'Gandhinagar',
    temperature: 48.2,
    aqi: 198,
    water_level: '0.15 m',
    status: 'Critical',
    alert_type: 'Forest Fire',
  },
  {
    id: 3,
    time: '14:15:30',
    date: '2026-09-16',
    sensor: 'S-001 (Narol-Vatva, Ahmedabad)',
    location: 'Narol-Vatva Industrial Zone',
    city: 'Ahmedabad',
    temperature: 29.5,
    aqi: 192,
    water_level: '0.20 m',
    status: 'Warning',
    alert_type: 'Chemical Gas Spike',
  },
  {
    id: 4,
    time: '13:45:00',
    date: '2026-09-16',
    sensor: 'S-004 (Tapi Basin, Surat)',
    location: 'Tapi River Weir Causeway',
    city: 'Surat',
    temperature: 28.8,
    aqi: 28,
    water_level: '0.52 m',
    status: 'Normal',
    alert_type: 'Routine Telemetry',
  },
  {
    id: 5,
    time: '13:20:00',
    date: '2026-09-16',
    sensor: 'S-005 (Nandesari, Vadodara)',
    location: 'Nandesari Petrochem Belt',
    city: 'Vadodara',
    temperature: 30.1,
    aqi: 54,
    water_level: '0.18 m',
    status: 'Normal',
    alert_type: 'Routine Telemetry',
  },
]

export const useStore = create((set, get) => ({
  nodes: INITIAL_GUJARAT_NODES,
  alerts: INITIAL_GUJARAT_ALERTS,
  history: INITIAL_GUJARAT_HISTORY,
  aiHotspots: AI_HOTSPOT_SUGGESTIONS,
  smsToasts: [],
  activeScenario: null,
  mockMode: true,
  connected: true,

  setNodes:     (nodes)    => set({ nodes }),
  setAlerts:    (alerts)   => set({ alerts }),
  mapPlacementMode: null, // { active: boolean, sensorType: string }
  setMapPlacementMode: (mode) => set({ mapPlacementMode: mode }),

  // Install a Sensor directly from UI, Leaflet Map Click, or AI Map Suggestion
  addSensor: (newSensor) => set((state) => {
    const nextId = newSensor.node_id || `S-00${state.nodes.length + 1}`
    const stype = newSensor.type || 'Water Level / Flood'

    let initWater = 20.0
    let initTemp = 28.5
    let initHum = 65
    let initAqi = 30
    let initGas = 25
    let initFlame = false
    let riskFlood = 10
    let riskFire = 8
    let riskPollution = 12

    if (stype.includes('Water')) {
      initWater = 45.0
      riskFlood = 24
      initHum = 76
    } else if (stype.includes('Air')) {
      initAqi = 52.0
      riskPollution = 32
      initGas = 35
    } else if (stype.includes('Thermal') || stype.includes('Fire')) {
      initTemp = 33.2
      riskFire = 22
      initHum = 44
    } else if (stype.includes('Temperature')) {
      initTemp = 36.4
      riskFire = 18
      initHum = 45
    } else if (stype.includes('Humidity')) {
      initHum = 82
      initWater = 32.0
      riskFlood = 20
    } else if (stype.includes('Gas')) {
      initGas = 65
      initAqi = 60
      riskPollution = 36
    }

    const createdNode = {
      node_id: nextId,
      code: nextId,
      name: newSensor.name || `Sensor ${nextId} (${stype.split('/')[0].trim()})`,
      type: stype,
      city: newSensor.city || 'Gujarat Grid',
      location: newSensor.location || 'Gujarat Monitored Area',
      gps: newSensor.gps || `${parseFloat(newSensor.latitude || 23.22).toFixed(4)}° N, ${parseFloat(newSensor.longitude || 72.65).toFixed(4)}° E`,
      latitude: parseFloat(newSensor.latitude) || 23.2200,
      longitude: parseFloat(newSensor.longitude) || 72.6500,
      location_desc: newSensor.location_desc || newSensor.location || 'Active IoT Environmental Sentinel',
      is_gateway: false,
      battery_pct: parseInt(newSensor.battery_pct, 10) || 100,
      solar_charging: true,
      rssi: -65,
      connection: newSensor.connection || 'LoRa Mesh (GPS Auto-Sync)',
      status: 'online',
      risk_flood: riskFlood,
      risk_fire: riskFire,
      risk_pollution: riskPollution,
      water_level_cm: initWater,
      temperature_c: initTemp,
      humidity_pct: initHum,
      smoke_aqi: initAqi,
      gas_ppm: initGas,
      flame_detected: initFlame,
      last_update: 'Just now (Live Tracking)',
    }

    return {
      nodes: [...state.nodes, createdNode],
      history: [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          date: new Date().toISOString().split('T')[0],
          sensor: createdNode.name,
          location: createdNode.location,
          city: createdNode.city,
          temperature: initTemp,
          aqi: initAqi,
          water_level: `${(initWater / 100).toFixed(2)} m`,
          status: 'Normal',
          alert_type: `${stype.split('/')[0].trim()} Deployed & Online`,
        },
        ...state.history,
      ],
    }
  }),

  // Acknowledge alert
  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true, status: 'resolved' } : a
    ),
  })),

  dismissToast: (id) => set((state) => ({
    smsToasts: state.smsToasts.filter((t) => t.id !== id),
  })),

  // Multi-Agency Emergency Call & Govt Notification Dispatcher
  addAlert: (alert) => {
    const isFire = alert.hazard === 'fire'
    const isWater = alert.hazard === 'flood'
    const toastId = Date.now() + Math.random()

    const newToast = {
      id: toastId,
      hazard: alert.hazard,
      risk_score: alert.risk_score,
      node_id: alert.node_id || alert.sensor_id,
      node_name: alert.node_name || alert.sensor_name,
      message: alert.message,
      area_probability: alert.area_probability ?? 0.91,
      // Full Cops, Fire, Ambulance & Govt Email escalation:
      callCops: '🚓 POLICE DIAL 100/112: Ahmedabad-Gandhinagar Commissionerate Squad Dispatched',
      callFire: isFire
        ? '🚒 FIRE BRIGADE DIAL 101: Emergency Fire Tender & Foam Units En Route'
        : '🚒 FIRE & RESCUE DIAL 101: Flood Rescue Boats Staged',
      callAmbulance: '🚑 AMBULANCE DIAL 108: GVK-EMRI Gujarat Emergency Medical Vehicle Dispatched',
      mailRecipient: isFire
        ? 'TO: gsdma@gujarat.gov.in, fire-station.emergency@gujarat.gov.in, collector-gandhinagar@gujarat.gov.in'
        : isWater
        ? 'TO: flood-control.gujarat@gov.in, collector-ahmedabad@gujarat.gov.in, gsdma@gujarat.gov.in'
        : 'TO: gpcb-ahmedabad@gujarat.gov.in, health-dept.amc@ahmedabadcity.gov.in',
      timestamp: new Date().toLocaleTimeString(),
      latency: '<1.1s (LoRa Mesh to GSDMA Hub)',
    }

    set((state) => ({
      alerts: [alert, ...state.alerts],
      smsToasts: [newToast, ...state.smsToasts].slice(0, 4),
      history: [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          date: new Date().toISOString().split('T')[0],
          sensor: alert.sensor_name || alert.node_name,
          location: alert.location || 'Gujarat Monitored Area',
          city: alert.city || 'Gandhinagar',
          temperature: isFire ? 48.2 : 28.0,
          aqi: alert.hazard === 'pollution' ? 192 : 35,
          water_level: isWater ? '1.48 m' : '0.35 m',
          status: alert.risk_score >= 70 ? 'Critical' : 'Warning',
          alert_type: alert.hazard?.toUpperCase(),
        },
        ...state.history,
      ],
    }))
  },

  // Interactive Scenario Trigger for Gujarat Network
  triggerScenario: (type) => {
    const state = get()
    if (type === 'normal') {
      set({
        activeScenario: null,
        nodes: state.nodes.map((n) => ({
          ...n,
          risk_flood: n.node_id === 'S-002' ? 35 : 12,
          risk_fire: n.node_id === 'S-003' ? 18 : 8,
          risk_pollution: n.node_id === 'S-001' ? 28 : 16,
          water_level_cm: n.node_id === 'S-002' ? 45.0 : 20.0,
          smoke_aqi: n.node_id === 'S-001' ? 42.0 : 25.0,
          temperature_c: 28.5,
          flame_detected: false,
        })),
      })
      return
    }

    set({ activeScenario: type })

    if (type === 'fire') {
      // Indroda Park, Gandhinagar Fire
      const updatedNodes = state.nodes.map((n) => {
        if (n.node_id === 'S-003') {
          return { ...n, smoke_aqi: 250.0, temperature_c: 49.2, flame_detected: true, risk_fire: 96 }
        }
        return n
      })
      set({ nodes: updatedNodes })
      state.addAlert({
        id: Date.now(),
        severity: 'critical',
        hazard: 'fire',
        title: 'CRITICAL EMERGENCY — Forest Fire at Indroda Park, Gandhinagar',
        sensor_id: 'S-003',
        sensor_name: 'Sensor S-003 (Indroda Nature Park, Gandhinagar)',
        message: 'Active IR Flame detected. Temperature 49.2°C surging rapidly near Infocity green corridor. Calling Cops (100), Fire (101) & Ambulance (108).',
        location: 'Indroda Nature Park & Green Belt, Gandhinagar',
        city: 'Gandhinagar',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        risk_score: 96,
        area_probability: 0.95,
        acknowledged: false,
      })
    } else if (type === 'flood') {
      // Sant Sarovar Dam, Gandhinagar / Sabarmati Flood
      const updatedNodes = state.nodes.map((n) => {
        if (n.node_id === 'S-002') {
          return { ...n, water_level_cm: 152.0, risk_flood: 93, humidity_pct: 95 }
        }
        return n
      })
      set({ nodes: updatedNodes })
      state.addAlert({
        id: Date.now(),
        severity: 'critical',
        hazard: 'flood',
        title: 'CRITICAL EMERGENCY — Sabarmati Dam Overflow (1.52m)',
        sensor_id: 'S-002',
        sensor_name: 'Sensor S-002 (Sant Sarovar Dam, Gandhinagar)',
        message: 'Water level rapidly increasing (+5.2cm/min). Sant Sarovar reservoir exceeded safe capacity. Emergency evacuation declared: Calling Police (100) & NDRF.',
        location: 'Sant Sarovar Dam / Sabarmati River, Gandhinagar',
        city: 'Gandhinagar',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        risk_score: 93,
        area_probability: 0.92,
        acknowledged: false,
      })
    } else if (type === 'pollution') {
      // Narol-Vatva, Ahmedabad Chemical AQI Spike
      const updatedNodes = state.nodes.map((n) => {
        if (n.node_id === 'S-001') {
          return { ...n, smoke_aqi: 205.0, risk_pollution: 90 }
        }
        return n
      })
      set({ nodes: updatedNodes })
      state.addAlert({
        id: Date.now(),
        severity: 'critical',
        hazard: 'pollution',
        title: 'CRITICAL WARNING — Hazardous Gas Spill in Narol-Vatva, Ahmedabad',
        sensor_id: 'S-001',
        sensor_name: 'Sensor S-001 (Narol-Vatva, Ahmedabad)',
        message: 'Hazardous VOC / Hydrocarbon gas concentration crossed 205 AQI. Emergency advisory to CPCB & AMC health units.',
        location: 'Narol-Vatva Industrial Zone, Ahmedabad',
        city: 'Ahmedabad',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        risk_score: 90,
        area_probability: 0.85,
        acknowledged: false,
      })
    }
  },

  // Subtle ticker
  tickMockData: () => set((state) => ({
    nodes: state.nodes.map((n) => ({
      ...n,
      risk_flood: Math.max(0, Math.min(100, Math.round(n.risk_flood + (Math.random() - 0.49) * 1.5))),
      risk_fire:  Math.max(0, Math.min(100, Math.round(n.risk_fire  + (Math.random() - 0.49) * 1.5))),
      risk_pollution: Math.max(0, Math.min(100, Math.round(n.risk_pollution + (Math.random() - 0.49) * 1.5))),
      water_level_cm: Math.max(0, parseFloat((n.water_level_cm + (Math.random() - 0.48) * 0.4).toFixed(1))),
      temperature_c:  parseFloat((n.temperature_c + (Math.random() - 0.5) * 0.1).toFixed(1)),
      humidity_pct:   Math.max(20, Math.min(100, Math.round(n.humidity_pct + (Math.random() - 0.5) * 0.3))),
      smoke_aqi:      Math.max(0, parseFloat((n.smoke_aqi + (Math.random() - 0.48) * 0.6).toFixed(1))),
      battery_pct:    Math.max(0, parseFloat((n.battery_pct - Math.random() * 0.002).toFixed(2))),
    })),
  })),
}))

export const useAuthStore = create((set) => ({
  token: 'demo-token',
  refreshToken: 'demo-refresh',
  user: { id: 1, email: 'authority@aegisnet.local', name: 'GSDMA Disaster Officer', role: 'authority' },
  setToken:   (token)        => set({ token }),
  setAuth:    (token, refreshToken, user) => set({ token, refreshToken, user }),
  logout:     ()             => set({ token: null, refreshToken: null, user: null }),
}))
