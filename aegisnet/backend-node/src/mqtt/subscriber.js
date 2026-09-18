const mqtt = require('mqtt');
const db = require('../config/db');
const sockets = require('../sockets/index');
const axios = require('axios');
const notify = require('../services/notify.service');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

module.exports = function startMqtt() {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

  client.on('connect', () => {
    console.log('[MQTT] Connected to broker');
    client.subscribe('aegisnet/+/telemetry', (err) => {
      if (err) console.error('[MQTT] Subscribe error (telemetry):', err);
    });
    client.subscribe('aegisnet/+/alert', (err) => {
      if (err) console.error('[MQTT] Subscribe error (alert):', err);
    });
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err));

  client.on('message', async (topic, payload) => {
    try {
      const parts = topic.split('/');
      const nodeId = parts[1];
      const msgType = parts[2]; // telemetry | alert
      const data = JSON.parse(payload.toString());

      if (msgType === 'telemetry') {
        await handleTelemetry(nodeId, data);
      } else if (msgType === 'alert') {
        await handleAlert(nodeId, data);
      }
    } catch (err) {
      console.error('[MQTT] Message processing error:', err);
    }
  });

  return client;
};

// Map ESP32 node_id prefix to human-readable name and category
function resolveNodeMeta(nodeId, data) {
  const id = nodeId.toUpperCase();
  if (id.includes('FLOOD'))      return { name: 'ESP32 Flood Sensor Node', category: 'flood',     lat: 23.0300, lng: 72.5800 };
  if (id.includes('COTEMP'))     return { name: 'ESP32 CO+Temperature Node', category: 'fire',    lat: 23.0310, lng: 72.5810 };
  if (id.includes('POLLUTION'))  return { name: 'ESP32 Pollution Monitor',   category: 'air',     lat: 23.0320, lng: 72.5820 };
  return { name: `ESP32 Node (${nodeId})`, category: 'flood', lat: 23.0300, lng: 72.5800 };
}

async function handleTelemetry(nodeId, data) {
  const {
    water_level_cm, flame_detected, smoke_aqi,
    temperature_c, humidity_pct, soil_moisture,
    risk_flood, risk_fire, risk_pollution,
    battery_pct, rssi, solar_charging,
  } = data;

  // ── AUTO-REGISTER node if it doesn't exist yet (ESP32 hot-plug) ──────────
  try {
    const meta = resolveNodeMeta(nodeId, data);
    await db.query(
      `INSERT INTO nodes (node_id, name, latitude, longitude, category, status, last_seen_at, battery_pct, rssi, solar_charging)
       VALUES ($1, $2, $3, $4, $5, 'online', now(), $6, $7, $8)
       ON CONFLICT (node_id) DO UPDATE
         SET last_seen_at   = now(),
             status         = 'online',
             battery_pct    = COALESCE(EXCLUDED.battery_pct, nodes.battery_pct),
             rssi           = COALESCE(EXCLUDED.rssi, nodes.rssi),
             solar_charging = COALESCE(EXCLUDED.solar_charging, nodes.solar_charging)`,
      [nodeId, meta.name, meta.lat, meta.lng, meta.category,
       battery_pct ?? 100, rssi ?? -65, solar_charging ?? false]
    );
  } catch (upsertErr) {
    console.warn('[MQTT] Node upsert skipped (no DB?):', upsertErr.message);
  }

  // ── Insert sensor reading ─────────────────────────────────────────────────
  let result = null;
  try {
    result = await db.query(
      `INSERT INTO sensor_readings
         (node_id, water_level_cm, flame_detected, smoke_aqi,
          temperature_c, humidity_pct, soil_moisture,
          risk_flood, risk_fire, risk_pollution, raw_payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [nodeId, water_level_cm, flame_detected ?? false, smoke_aqi,
       temperature_c, humidity_pct, soil_moisture,
       risk_flood ?? 0, risk_fire ?? 0, risk_pollution ?? 0, data]
    );
  } catch (dbErr) {
    console.warn('[MQTT] DB insert skipped (no DB?):', dbErr.message);
  }

  // ── Always emit to Socket.IO (even if DB is unavailable) ─────────────────
  const liveNode = {
    node_id:        nodeId,
    ...resolveNodeMeta(nodeId, data),
    status:         'online',
    battery_pct:    battery_pct ?? 100,
    rssi:           rssi ?? -65,
    solar_charging: solar_charging ?? false,
    water_level_cm, flame_detected, smoke_aqi,
    temperature_c, humidity_pct, soil_moisture,
    risk_flood:      risk_flood ?? 0,
    risk_fire:       risk_fire ?? 0,
    risk_pollution:  risk_pollution ?? 0,
    // Pass through all raw ESP32 fields for the UI
    gas_ppm:         data.gas_ppm,
    pm10:            data.pm10,
    mq135_strength:  data.mq135_strength,
    mq135_status:    data.mq135_status,
    mq7_strength:    data.mq7_strength,
    mq7_status:      data.mq7_status,
    mq4_strength:    data.mq4_strength,
    mq4_status:      data.mq4_status,
    node_type:       data.node_type,
    last_seen_at:    new Date().toISOString(),
    last_update:     'Just now',
  };

  try {
    const dbNode = (await db.query('SELECT * FROM nodes WHERE node_id=$1', [nodeId])).rows[0];
    sockets.emit('node:update', dbNode || liveNode);
  } catch {
    sockets.emit('node:update', liveNode);
  }

  if (result?.rows?.[0]) {
    sockets.emit('reading:new', result.rows[0]);
  } else {
    sockets.emit('reading:new', { node_id: nodeId, ...data, recorded_at: new Date().toISOString() });
  }

  await checkThresholds(nodeId, data, liveNode);
}

async function checkThresholds(nodeId, data, node) {
  const thresholds = (await db.query('SELECT * FROM thresholds')).rows;
  const hazardRiskMap = {
    flood: data.risk_flood,
    fire: data.risk_fire,
    pollution: data.risk_pollution,
  };

  for (const t of thresholds) {
    const score = hazardRiskMap[t.hazard];
    if (score >= t.warn_score) {
      const existing = await db.query(
        `SELECT id FROM alerts WHERE node_id=$1 AND hazard=$2 AND status='open' LIMIT 1`,
        [nodeId, t.hazard]
      );
      if (existing.rows.length === 0) {
        await createAlert(nodeId, t.hazard, score, node);
      }
    }
  }
}

async function handleAlert(nodeId, data) {
  const { hazard, risk_score, message } = data;
  const node = (await db.query('SELECT * FROM nodes WHERE node_id=$1', [nodeId])).rows[0];
  await createAlert(nodeId, hazard, risk_score, node, message);
}

async function createAlert(nodeId, hazard, riskScore, node, message) {
  let areaProbability = null;
  try {
    const aiRes = await axios.post(`${AI_URL}/correlate`, {
      node_id: nodeId,
      hazard,
      risk_score: riskScore,
      lat: node?.latitude,
      lng: node?.longitude,
    }, { timeout: 5000 });
    areaProbability = aiRes.data.area_probability;
  } catch (e) {
    console.warn('[AI] Correlation service unavailable:', e.message);
  }

  const alertMsg = message || `${hazard.toUpperCase()} risk score ${riskScore} at ${node?.name || nodeId}`;
  const alertRow = await db.query(
    `INSERT INTO alerts (node_id, hazard, risk_score, area_probability, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nodeId, hazard, riskScore, areaProbability, alertMsg]
  );
  const alert = alertRow.rows[0];

  sockets.emit('alert:new', alert);

  const contacts = (await db.query(
    `SELECT * FROM notification_contacts WHERE hazard_filter IS NULL OR hazard_filter=$1`,
    [hazard]
  )).rows;

  for (const contact of contacts) {
    if (contact.phone) {
      await notify.sendSms(contact.phone, alertMsg);
    }
  }
  await notify.sendPush(`aegisnet_${hazard}`, `AegisNet Alert: ${hazard}`, alertMsg);

  await db.query(
    `UPDATE alerts SET notified_sms=true, notified_push=true WHERE id=$1`,
    [alert.id]
  );
}
