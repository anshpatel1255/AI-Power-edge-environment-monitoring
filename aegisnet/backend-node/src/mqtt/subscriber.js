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

async function handleTelemetry(nodeId, data) {
  const {
    water_level_cm, flame_detected, smoke_aqi,
    temperature_c, humidity_pct, soil_moisture,
    risk_flood, risk_fire, risk_pollution,
    battery_pct, rssi, solar_charging,
  } = data;

  const result = await db.query(
    `INSERT INTO sensor_readings
       (node_id, water_level_cm, flame_detected, smoke_aqi,
        temperature_c, humidity_pct, soil_moisture,
        risk_flood, risk_fire, risk_pollution, raw_payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [nodeId, water_level_cm, flame_detected, smoke_aqi,
     temperature_c, humidity_pct, soil_moisture,
     risk_flood, risk_fire, risk_pollution, data]
  );

  await db.query(
    `UPDATE nodes SET last_seen_at=now(), status='online',
       battery_pct=COALESCE($2,battery_pct),
       rssi=COALESCE($3,rssi),
       solar_charging=COALESCE($4,solar_charging)
     WHERE node_id=$1`,
    [nodeId, battery_pct, rssi, solar_charging]
  );

  const node = (await db.query('SELECT * FROM nodes WHERE node_id=$1', [nodeId])).rows[0];
  sockets.emit('node:update', node);
  sockets.emit('reading:new', result.rows[0]);

  await checkThresholds(nodeId, data, node);
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
