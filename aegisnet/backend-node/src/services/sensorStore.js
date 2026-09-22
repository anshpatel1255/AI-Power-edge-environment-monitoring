// services/sensorStore.js — Persistent Hardware Time-Series Store for AegisNet Master ESP32 Gateway
// Stores REAL physical sensor data with Asia/Kolkata timestamps.
// File-backed persistence (sensor_store.json) with dual-write to PostgreSQL if connected.

const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const STORE_PATH = path.join(__dirname, '../../../../database/sensor_store.json');
const MAX_READINGS = 50000;
const NODE_TIMEOUT_MS = 30000; // 30 seconds timeout for node OFFLINE status

class SensorStore {
  constructor() {
    this.readings = [];
    this.alerts = [];
    this.latest = {
      FLOOD: null,
      CO_TEMP: null,
      POLLUTION: null,
    };
    this.lastMasterSeen = null;
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        this.readings = Array.isArray(parsed.readings) ? parsed.readings : [];
        this.alerts = Array.isArray(parsed.alerts) ? parsed.alerts : [];
        if (parsed.latest) {
          this.latest = parsed.latest;
        }
        if (parsed.lastMasterSeen) {
          this.lastMasterSeen = parsed.lastMasterSeen;
        }
        console.log(`[SensorStore] Loaded ${this.readings.length} historical readings from ${STORE_PATH}`);
      }
    } catch (err) {
      console.warn('[SensorStore] Could not load historical data from disk, starting fresh:', err.message);
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        lastMasterSeen: this.lastMasterSeen,
        latest: this.latest,
        alerts: this.alerts.slice(-100),
        readings: this.readings.slice(-MAX_READINGS),
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[SensorStore] Error writing to disk:', err.message);
    }
  }

  getIndianTime(date = new Date()) {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  saveReading(payload) {
    if (!payload || !payload.node) {
      throw new Error('Payload must include "node" identifier (FLOOD, CO_TEMP, or POLLUTION)');
    }

    const nodeKey = String(payload.node).trim().toUpperCase();
    const now = new Date();
    const epochMs = now.getTime();
    const isoTimestamp = now.toISOString();
    const istTime = this.getIndianTime(now);

    if (nodeKey === 'MASTER' || nodeKey.includes('MASTER')) {
      if (payload.status === 'ONLINE') {
        this.lastMasterSeen = epochMs;
      } else {
        this.lastMasterSeen = 0;
      }
      return { node: 'MASTER', status: payload.status };
    }

    if (payload.status === 'OFFLINE') {
      const target = (nodeKey.includes('FLOOD')) ? 'FLOOD'
        : (nodeKey.includes('CO') || nodeKey.includes('TEMP') || nodeKey.includes('FIRE')) ? 'CO_TEMP'
        : (nodeKey.includes('POLLUTION') || nodeKey.includes('AIR')) ? 'POLLUTION'
        : nodeKey;
      if (this.latest[target]) {
        this.latest[target] = {
          ...this.latest[target],
          status: 'OFFLINE',
        };
      }
      return { node: target, status: 'OFFLINE' };
    }

    // Only active valid hardware packets update lastMasterSeen
    this.lastMasterSeen = epochMs;

    let record = {
      id: `${nodeKey}-${epochMs}-${Math.random().toString(36).substring(2, 7)}`,
      node: nodeKey,
      timestamp: isoTimestamp,
      ist_time: istTime,
      epoch_ms: epochMs,
    };

    if (nodeKey === 'FLOOD' || nodeKey.includes('FLOOD')) {
      record.node = 'FLOOD';
      const prev = this.latest.FLOOD || {};
      const rawDist = payload.distance ?? payload.distance_cm ?? payload.water_level_cm;
      // Filter out blind-spot echo glitches (< 2.0 cm)
      const validDist = (rawDist !== undefined && rawDist !== null && !isNaN(rawDist) && Number(rawDist) >= 2.0)
        ? Number(rawDist)
        : (prev.distance != null ? prev.distance : null);
      record.distance = validDist;
      record.distance_cm = validDist;
      record.water_level_cm = validDist;

      const rawSoil = payload.soilMoisture ?? payload.soil_moisture ?? payload.soil_moisture_percent ?? payload.soil;
      const validSoil = (rawSoil !== undefined && rawSoil !== null && !isNaN(rawSoil) && Number(rawSoil) > 0)
        ? Number(rawSoil)
        : (prev.soilMoisture != null && prev.soilMoisture > 0 ? prev.soilMoisture : null);
      record.soilMoisture = validSoil;
      record.soil_moisture = validSoil;
      record.soil_moisture_percent = validSoil;
    } else if (nodeKey === 'CO_TEMP' || nodeKey.includes('CO') || nodeKey.includes('TEMP')) {
      record.node = 'CO_TEMP';
      const prev = this.latest.CO_TEMP || {};
      const rawCo = payload.coPPM ?? payload.co_ppm ?? payload.gas_ppm ?? payload.co;
      record.coPPM = (rawCo !== undefined && rawCo !== null && !isNaN(rawCo) && Number(rawCo) >= 0)
        ? Number(rawCo)
        : (prev.coPPM != null ? prev.coPPM : null);
      record.co_ppm = record.coPPM;

      const rawDht = payload.dhtTemperature ?? payload.temperature_c ?? payload.temp ?? payload.dht_temp;
      record.dhtTemperature = (rawDht !== undefined && rawDht !== null && !isNaN(rawDht) && Number(rawDht) > 0)
        ? Number(rawDht)
        : (prev.dhtTemperature != null ? prev.dhtTemperature : null);
      record.temperature_c = record.dhtTemperature;

      const rawHum = payload.humidity ?? payload.humidity_pct ?? payload.hum;
      record.humidity = (rawHum !== undefined && rawHum !== null && !isNaN(rawHum) && Number(rawHum) > 0)
        ? Number(rawHum)
        : (prev.humidity != null ? prev.humidity : null);
      record.humidity_pct = record.humidity;

      const rawDs = payload.ds18b20Temperature ?? payload.ds18b20_temp ?? payload.temp_ds18b20 ?? payload.ds18b20;
      record.ds18b20Temperature = (rawDs !== undefined && rawDs !== null && !isNaN(rawDs) && Number(rawDs) > 0)
        ? Number(rawDs)
        : (prev.ds18b20Temperature != null ? prev.ds18b20Temperature : null);
      record.ds18b20_temp = record.ds18b20Temperature;

      const rawFlame = payload.flame_detected !== undefined ? payload.flame_detected : payload.flame;
      record.flame_detected = rawFlame !== undefined ? Boolean(rawFlame) : Boolean(prev.flame_detected);
    } else if (nodeKey === 'POLLUTION' || nodeKey.includes('POLLUTION') || nodeKey.includes('AIR')) {
      record.node = 'POLLUTION';
      const prev = this.latest.POLLUTION || {};

      // MQ-135 (relative gas strength + digital alarm — DO NOT convert to ppm)
      record.mq135_raw = payload.mq135_raw !== undefined && payload.mq135_raw !== null ? Number(payload.mq135_raw) : (prev.mq135_raw ?? null);
      record.mq135_voltage = payload.mq135_voltage !== undefined && payload.mq135_voltage !== null ? Number(payload.mq135_voltage) : (prev.mq135_voltage ?? null);
      record.mq135_strength = payload.mq135_strength !== undefined && payload.mq135_strength !== null ? Number(payload.mq135_strength) : (prev.mq135_strength ?? null);
      record.mq135_alarm = payload.mq135_alarm !== undefined ? Boolean(payload.mq135_alarm) : Boolean(prev.mq135_alarm);

      // MQ-7 (relative gas strength + digital alarm — DO NOT convert to ppm)
      record.mq7_raw = payload.mq7_raw !== undefined && payload.mq7_raw !== null ? Number(payload.mq7_raw) : (prev.mq7_raw ?? null);
      record.mq7_voltage = payload.mq7_voltage !== undefined && payload.mq7_voltage !== null ? Number(payload.mq7_voltage) : (prev.mq7_voltage ?? null);
      record.mq7_strength = payload.mq7_strength !== undefined && payload.mq7_strength !== null ? Number(payload.mq7_strength) : (prev.mq7_strength ?? null);
      record.mq7_alarm = payload.mq7_alarm !== undefined ? Boolean(payload.mq7_alarm) : Boolean(prev.mq7_alarm);

      // MQ-4 (relative gas strength + digital alarm — DO NOT convert to ppm)
      record.mq4_raw = payload.mq4_raw !== undefined && payload.mq4_raw !== null ? Number(payload.mq4_raw) : (prev.mq4_raw ?? null);
      record.mq4_voltage = payload.mq4_voltage !== undefined && payload.mq4_voltage !== null ? Number(payload.mq4_voltage) : (prev.mq4_voltage ?? null);
      record.mq4_strength = payload.mq4_strength !== undefined && payload.mq4_strength !== null ? Number(payload.mq4_strength) : (prev.mq4_strength ?? null);
      record.mq4_alarm = payload.mq4_alarm !== undefined ? Boolean(payload.mq4_alarm) : Boolean(prev.mq4_alarm);

      // PMS5003 Laser Particulate Matter (µg/m³)
      const p1 = payload.PM1_0 ?? payload.pm1_0 ?? payload.pm1;
      record.PM1_0 = (p1 !== undefined && p1 !== null && !isNaN(p1) && Number(p1) > 0) ? Number(p1) : (prev.PM1_0 ?? null);
      record.pm1_0 = record.PM1_0;

      const p25 = payload.PM2_5 ?? payload.pm2_5 ?? payload.pm25 ?? payload.smoke_aqi;
      record.PM2_5 = (p25 !== undefined && p25 !== null && !isNaN(p25) && Number(p25) > 0) ? Number(p25) : (prev.PM2_5 ?? null);
      record.pm2_5 = record.PM2_5;

      const p10 = payload.PM10 ?? payload.pm10;
      record.PM10 = (p10 !== undefined && p10 !== null && !isNaN(p10) && Number(p10) > 0) ? Number(p10) : (prev.PM10 ?? null);
      record.pm10 = record.PM10;

      // Overall gas alarm status: ALARM if any MQ sensor digital alarm is triggered
      record.gas_status = (record.mq135_alarm || record.mq7_alarm || record.mq4_alarm) ? 'ALARM' : 'SAFE';
    }

    record.status = 'ONLINE';

    // Update latest reading cache
    this.latest[record.node] = record;

    // Append to historical ring buffer
    this.readings.push(record);
    if (this.readings.length > MAX_READINGS) {
      this.readings.shift();
    }

    // Check alerts
    this.evaluateAlerts(record);

    // Save to disk asynchronously
    this.scheduleDiskSave();

    // Dual-write to PostgreSQL if available
    this.dualWritePostgres(record);

    return record;
  }

  evaluateAlerts(record) {
    if (record.node === 'POLLUTION') {
      if (record.mq135_alarm) {
        this.addAlert({
          type: 'GAS_ALERT',
          sensor: 'MQ-135 / NH3',
          node: 'POLLUTION',
          status: 'DETECTED',
          message: `Toxic Gas Alert: MQ-135 threshold triggered (Strength: ${record.mq135_strength ?? 'N/A'}%)`,
          timestamp: record.timestamp,
          ist_time: record.ist_time,
        });
      }
      if (record.mq7_alarm) {
        this.addAlert({
          type: 'GAS_ALERT',
          sensor: 'MQ-7 / CO',
          node: 'POLLUTION',
          status: 'DETECTED',
          message: `Gas Alert: MQ-7 relative CO threshold triggered (Strength: ${record.mq7_strength ?? 'N/A'}%)`,
          timestamp: record.timestamp,
          ist_time: record.ist_time,
        });
      }
      if (record.mq4_alarm) {
        this.addAlert({
          type: 'GAS_ALERT',
          sensor: 'MQ-4 / CH4',
          node: 'POLLUTION',
          status: 'DETECTED',
          message: `Combustible Gas Alert: MQ-4 methane threshold triggered (Strength: ${record.mq4_strength ?? 'N/A'}%)`,
          timestamp: record.timestamp,
          ist_time: record.ist_time,
        });
      }
    }
  }

  addAlert(alertData) {
    const newAlert = {
      id: `ALERT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...alertData,
      created_at: Date.now(),
    };
    // Deduplicate if identical alert within last 10 seconds
    const recent = this.alerts.slice(-5);
    const isDup = recent.some(
      (a) => a.sensor === newAlert.sensor && a.status === newAlert.status && (Date.now() - a.created_at < 10000)
    );
    if (!isDup) {
      this.alerts.unshift(newAlert);
      if (this.alerts.length > 200) this.alerts.pop();
    }
  }

  scheduleDiskSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this.saveToDisk();
    }, 1500);
  }

  async dualWritePostgres(record) {
    try {
      if (!db || !db.query) return;
      const query = `
        INSERT INTO sensor_readings (node_id, recorded_at, water_level_cm, soil_moisture, temperature_c, humidity_pct, raw_payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING;
      `;
      const water = record.distance !== undefined ? record.distance : null;
      const soil = record.soilMoisture !== undefined ? record.soilMoisture : null;
      const temp = record.dhtTemperature || record.ds18b20Temperature || null;
      const hum = record.humidity !== undefined ? record.humidity : null;
      await db.query(query, [
        `ESP32-${record.node}`,
        record.timestamp,
        water,
        soil,
        temp,
        hum,
        JSON.stringify(record),
      ]);
    } catch {
      // Non-fatal: PostgreSQL pool is optional when running standalone
    }
  }

  getLatest() {
    const now = Date.now();
    const isMasterOnline = this.lastMasterSeen ? (now - this.lastMasterSeen < NODE_TIMEOUT_MS) : false;

    const getNodeStatus = (nodeKey) => {
      const reading = this.latest[nodeKey];
      if (!reading || !reading.epoch_ms || reading.status === 'OFFLINE') return 'OFFLINE';
      return (now - reading.epoch_ms < NODE_TIMEOUT_MS) ? 'ONLINE' : 'OFFLINE';
    };

    return {
      master: {
        status: isMasterOnline ? 'ONLINE' : 'OFFLINE',
        lastSeen: this.lastMasterSeen ? this.getIndianTime(new Date(this.lastMasterSeen)) : null,
        lastSeenEpoch: this.lastMasterSeen,
        communication: 'ESP-NOW + Wi-Fi',
      },
      nodes: {
        FLOOD: {
          status: getNodeStatus('FLOOD'),
          latest: this.latest.FLOOD,
          lastSeen: this.latest.FLOOD ? this.latest.FLOOD.ist_time : null,
        },
        CO_TEMP: {
          status: getNodeStatus('CO_TEMP'),
          latest: this.latest.CO_TEMP,
          lastSeen: this.latest.CO_TEMP ? this.latest.CO_TEMP.ist_time : null,
        },
        POLLUTION: {
          status: getNodeStatus('POLLUTION'),
          latest: this.latest.POLLUTION,
          lastSeen: this.latest.POLLUTION ? this.latest.POLLUTION.ist_time : null,
        },
      },
      timestamp: new Date().toISOString(),
      ist_time: this.getIndianTime(),
    };
  }

  getHistory(nodeFilter = null, range = '1h') {
    const now = Date.now();
    const SPANS = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    const spanMs = SPANS[range] || SPANS['1h'];
    const cutoff = now - spanMs;

    let filtered = this.readings.filter((r) => r.epoch_ms >= cutoff);

    if (nodeFilter) {
      const normalizedFilter = String(nodeFilter).trim().toUpperCase();
      filtered = filtered.filter((r) => r.node === normalizedFilter);
    }

    return filtered;
  }

  getAlerts() {
    return this.alerts;
  }

  getSystemStatus() {
    const now = Date.now();
    const isMasterOnline = this.lastMasterSeen ? (now - this.lastMasterSeen < NODE_TIMEOUT_MS) : false;

    return {
      master: {
        status: isMasterOnline ? 'ONLINE' : 'OFFLINE',
        lastSeen: this.lastMasterSeen ? this.getIndianTime(new Date(this.lastMasterSeen)) : null,
      },
      floodNode: {
        status: (this.latest.FLOOD && this.latest.FLOOD.status !== 'OFFLINE' && this.latest.FLOOD.epoch_ms > 0 && now - this.latest.FLOOD.epoch_ms < NODE_TIMEOUT_MS) ? 'ONLINE' : 'OFFLINE',
        lastSeen: this.latest.FLOOD ? this.latest.FLOOD.ist_time : null,
      },
      coTempNode: {
        status: (this.latest.CO_TEMP && this.latest.CO_TEMP.status !== 'OFFLINE' && this.latest.CO_TEMP.epoch_ms > 0 && now - this.latest.CO_TEMP.epoch_ms < NODE_TIMEOUT_MS) ? 'ONLINE' : 'OFFLINE',
        lastSeen: this.latest.CO_TEMP ? this.latest.CO_TEMP.ist_time : null,
      },
      pollutionNode: {
        status: (this.latest.POLLUTION && this.latest.POLLUTION.status !== 'OFFLINE' && this.latest.POLLUTION.epoch_ms > 0 && now - this.latest.POLLUTION.epoch_ms < NODE_TIMEOUT_MS) ? 'ONLINE' : 'OFFLINE',
        lastSeen: this.latest.POLLUTION ? this.latest.POLLUTION.ist_time : null,
      },
      espNow: isMasterOnline ? 'CONNECTED' : 'NOT RECEIVING',
      backend: 'CONNECTED',
      database: 'CONNECTED',
      databaseEngine: 'File-backed Time-Series Store (sensor_store.json)',
      serverTimeIST: this.getIndianTime(),
    };
  }
}

const sensorStore = new SensorStore();
module.exports = sensorStore;
