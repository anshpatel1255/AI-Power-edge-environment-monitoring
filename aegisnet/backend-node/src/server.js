require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const sockets = require('./sockets/index');
const startMqtt = require('./mqtt/subscriber');

const nodesRouter      = require('./routes/nodes.routes');
const alertsRouter     = require('./routes/alerts.routes');
const thresholdsRouter = require('./routes/thresholds.routes');
const authRouter       = require('./routes/auth.routes');
const readingsRouter   = require('./routes/readings.routes');
const db               = require('./config/db');

const app    = express();
const server = http.createServer(app);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/nodes',      nodesRouter);
app.use('/api/alerts',     alertsRouter);
app.use('/api/thresholds', thresholdsRouter);
app.use('/api/auth',       authRouter);
app.use('/api/readings',   readingsRouter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok', time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Init Socket.IO ─────────────────────────────────────────────────────────────
sockets.init(server);

// ── Init MQTT (non-fatal if broker unavailable at startup) ────────────────────
try {
  startMqtt();
} catch (err) {
  console.warn('[MQTT] Could not start subscriber:', err.message);
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] AegisNet backend listening on port ${PORT}`);
});
