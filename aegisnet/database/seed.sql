-- =============================================================================
-- AegisNet Seed Data
-- 4 demo nodes matching the PRD poster layout
-- =============================================================================

-- Demo nodes (lat/lng in Assam/Kerala river delta region for realism)
INSERT INTO nodes (node_id, name, latitude, longitude, location_desc, is_gateway, battery_pct, solar_charging, rssi, last_seen_at, status)
VALUES
  ('NODE-01', 'Node 1 — Upstream',          26.1445, 91.7362, 'Upstream river monitoring point',     FALSE, 87, TRUE,  -68, now(), 'online'),
  ('NODE-02', 'Node 2 — River Side',         26.1389, 91.7501, 'River bank sensor cluster',           FALSE, 72, TRUE,  -74, now(), 'online'),
  ('NODE-03', 'Node 3 — Forest / High Risk', 26.1521, 91.7619, 'Forest edge, elevated fire risk',     FALSE, 65, FALSE, -81, now(), 'online'),
  ('NODE-04', 'Node 4 — Lowland',            26.1298, 91.7440, 'Low-lying flood-prone residential',   TRUE,  91, TRUE,  -62, now(), 'online');

-- Default thresholds
INSERT INTO thresholds (hazard, warn_score, danger_score) VALUES
  ('flood',     50, 75),
  ('fire',      45, 70),
  ('pollution', 40, 65);

-- Demo authority user (password: demo1234)
-- bcrypt hash of 'demo1234' with salt rounds=10
INSERT INTO users (name, email, phone, password_hash, role) VALUES
  ('Demo Authority', 'authority@aegisnet.local', '+910000000001',
   '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FIlmjMO5n8UpGj7i3SgMLFBrJqnR.0a', 'authority'),
  ('Admin',          'admin@aegisnet.local',     '+910000000002',
   '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FIlmjMO5n8UpGj7i3SgMLFBrJqnR.0a', 'admin');

-- Demo notification contacts
INSERT INTO notification_contacts (label, phone, hazard_filter) VALUES
  ('Village Authority',  '+910000000001', NULL),
  ('Fire Station',       '+910000000003', 'fire'),
  ('Flood Control Room', '+910000000004', 'flood');

-- Seed some historical readings so charts are not empty on first load
DO $$
DECLARE
  n      TEXT;
  i      INT;
  ts     TIMESTAMPTZ;
BEGIN
  FOREACH n IN ARRAY ARRAY['NODE-01','NODE-02','NODE-03','NODE-04'] LOOP
    FOR i IN 0..287 LOOP   -- 24h @ 5-min intervals
      ts := now() - (i * INTERVAL '5 minutes');
      INSERT INTO sensor_readings
        (node_id, recorded_at, water_level_cm, flame_detected, smoke_aqi,
         temperature_c, humidity_pct, soil_moisture, risk_flood, risk_fire, risk_pollution)
      VALUES (
        n,
        ts,
        CASE n
          WHEN 'NODE-01' THEN 45 + random()*15 + CASE WHEN i < 30 THEN i*0.5 ELSE 0 END
          WHEN 'NODE-02' THEN 38 + random()*12
          WHEN 'NODE-03' THEN 22 + random()*8
          WHEN 'NODE-04' THEN 55 + random()*20
        END,
        CASE WHEN n='NODE-03' AND random()>0.97 THEN TRUE ELSE FALSE END,
        CASE n
          WHEN 'NODE-03' THEN 60 + random()*40
          ELSE 20 + random()*25
        END,
        28 + random()*6,
        65 + random()*20,
        CASE n WHEN 'NODE-04' THEN 55 + random()*30 ELSE 30 + random()*25 END,
        -- risk scores
        GREATEST(0, LEAST(100, CAST(
          CASE n
            WHEN 'NODE-01' THEN 30 + random()*25 + CASE WHEN i < 20 THEN i*1.5 ELSE 0 END
            WHEN 'NODE-04' THEN 40 + random()*30
            ELSE 15 + random()*20
          END AS SMALLINT))),
        GREATEST(0, LEAST(100, CAST(
          CASE n WHEN 'NODE-03' THEN 35 + random()*40 ELSE 5 + random()*15 END
        AS SMALLINT))),
        GREATEST(0, LEAST(100, CAST(20 + random()*35 AS SMALLINT)))
      );
    END LOOP;
  END LOOP;
END $$;
