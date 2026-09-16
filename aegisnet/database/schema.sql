-- =============================================================================
-- AegisNet Database Schema — PostgreSQL 16
-- =============================================================================

-- Custom ENUM types
CREATE TYPE hazard_type   AS ENUM ('flood', 'fire', 'pollution');
CREATE TYPE user_role     AS ENUM ('public', 'authority', 'admin');
CREATE TYPE alert_status  AS ENUM ('open', 'confirmed', 'false_positive', 'resolved');

-- =============================================================================
-- nodes — one row per physical sensor node
-- =============================================================================
CREATE TABLE nodes (
    node_id         VARCHAR(20)  PRIMARY KEY,          -- e.g. 'NODE-01'
    name            VARCHAR(100) NOT NULL,
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    location_desc   VARCHAR(255),
    is_gateway      BOOLEAN          DEFAULT FALSE,
    battery_pct     SMALLINT,
    solar_charging  BOOLEAN,
    rssi            SMALLINT,
    last_seen_at    TIMESTAMPTZ,
    status          VARCHAR(20)      DEFAULT 'offline', -- online | offline | degraded
    created_at      TIMESTAMPTZ      DEFAULT now()
);

-- =============================================================================
-- sensor_readings — time-series readings from each node
-- =============================================================================
CREATE TABLE sensor_readings (
    id              BIGSERIAL    PRIMARY KEY,
    node_id         VARCHAR(20)  REFERENCES nodes(node_id) ON DELETE CASCADE,
    recorded_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    water_level_cm  REAL,
    flame_detected  BOOLEAN,
    smoke_aqi       REAL,
    temperature_c   REAL,
    humidity_pct    REAL,
    soil_moisture   REAL,
    risk_flood      SMALLINT,         -- 0-100
    risk_fire       SMALLINT,
    risk_pollution  SMALLINT,
    raw_payload     JSONB             -- original MQTT packet for audit/debug
);
CREATE INDEX idx_readings_node_time ON sensor_readings (node_id, recorded_at DESC);

-- =============================================================================
-- alerts — triggered when any risk score crosses a threshold
-- =============================================================================
CREATE TABLE alerts (
    id               BIGSERIAL    PRIMARY KEY,
    node_id          VARCHAR(20)  REFERENCES nodes(node_id) ON DELETE CASCADE,
    hazard           hazard_type  NOT NULL,
    risk_score       SMALLINT     NOT NULL,
    status           alert_status DEFAULT 'open',
    area_probability REAL,              -- cross-node Flood Probability Index (AI service)
    message          TEXT,
    triggered_at     TIMESTAMPTZ  DEFAULT now(),
    resolved_at      TIMESTAMPTZ,
    notified_sms     BOOLEAN      DEFAULT FALSE,
    notified_push    BOOLEAN      DEFAULT FALSE
);
CREATE INDEX idx_alerts_status ON alerts (status, triggered_at DESC);
CREATE INDEX idx_alerts_node   ON alerts (node_id, triggered_at DESC);

-- =============================================================================
-- thresholds — per-hazard configurable warn/danger scores
-- =============================================================================
CREATE TABLE thresholds (
    hazard       hazard_type PRIMARY KEY,
    warn_score   SMALLINT    DEFAULT 50,
    danger_score SMALLINT    DEFAULT 75,
    updated_by   VARCHAR(100),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- users — authority / admin accounts; public users are anonymous
-- =============================================================================
CREATE TABLE users (
    id            SERIAL       PRIMARY KEY,
    name          VARCHAR(100),
    email         VARCHAR(150) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    password_hash TEXT         NOT NULL,
    role          user_role    DEFAULT 'public',
    created_at    TIMESTAMPTZ  DEFAULT now()
);

-- =============================================================================
-- notification_contacts — who to SMS/push on alerts
-- =============================================================================
CREATE TABLE notification_contacts (
    id            SERIAL      PRIMARY KEY,
    label         VARCHAR(100),
    phone         VARCHAR(20),
    hazard_filter hazard_type          -- NULL = all hazards
);
