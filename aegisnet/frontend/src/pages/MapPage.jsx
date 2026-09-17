// pages/MapPage.jsx — Tactical GIS Sensor Grid & Live Inspection Flyout (Photo 3)

import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

export default function MapPage() {
  const [flyoutOpen, setFlyoutOpen] = useState(true)
  const [selectedSensor, setSelectedSensor] = useState({
    id: 'S-001',
    name: 'Multi-Probe Alpha',
    status: 'WARNING',
    zone: 'ZONE 1 NORTH RIDGE',
    deviceTag: '#ENV-S001',
    temp: '32',
    tempDiff: '+2.4° vs baseline',
    humidity: '68',
    humidityState: 'Normal Range',
    aqi: '142',
    aqiState: 'Unhealthy Sensitive',
    water: '1.2',
    waterMargin: 'Crest Margin: +1.6m',
    battery: '88',
    batteryState: 'Solar Trickle ON',
    signal: '-72 dBm',
    signalState: 'LoRaWAN SF7 (Reliable)',
    lastUpdate: '10 sec ago',
    badgeBg: 'bg-secondary',
    badgeText: 'text-secondary',
  })

  // Layer toggles
  const [layers, setLayers] = useState({
    topography: true,
    heatmap: true,
    mesh: true,
    basins: true,
  })

  // Filter state
  const [threatFilter, setThreatFilter] = useState('ALL') // ALL | FLOOD | FIRE | POLLUTION
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectSensor = (sensor) => {
    setSelectedSensor(sensor)
    setFlyoutOpen(true)
  }

  const sensorList = [
    {
      id: 'S-014',
      name: 'Multi-Probe Gamma',
      status: 'CRITICAL',
      zone: 'ZONE 3 RIVER BASIN',
      deviceTag: '#ENV-S014',
      temp: '38.4',
      tempDiff: '+8.2° vs baseline',
      humidity: '92',
      humidityState: 'Saturated',
      aqi: '264',
      aqiState: 'Severe Hazardous',
      water: '2.84',
      waterMargin: 'SURGE BREACH +0.34m',
      battery: '76',
      batteryState: 'Battery Draw High',
      signal: '-91 dBm',
      signalState: 'LoRaWAN SF10 (Weak)',
      lastUpdate: '2 sec ago',
      badgeBg: 'bg-error',
      badgeText: 'text-error',
      left: '38%',
      top: '48%',
      label: 'SURGE LEVEL: CRITICAL',
      isCritical: true,
    },
    {
      id: 'S-001',
      name: 'Multi-Probe Alpha',
      status: 'WARNING',
      zone: 'ZONE 1 NORTH RIDGE',
      deviceTag: '#ENV-S001',
      temp: '32',
      tempDiff: '+2.4° vs baseline',
      humidity: '68',
      humidityState: 'Normal Range',
      aqi: '142',
      aqiState: 'Unhealthy Sensitive',
      water: '1.2',
      waterMargin: 'Crest Margin: +1.6m',
      battery: '88',
      batteryState: 'Solar Trickle ON',
      signal: '-72 dBm',
      signalState: 'LoRaWAN SF7 (Reliable)',
      lastUpdate: '10 sec ago',
      badgeBg: 'bg-secondary',
      badgeText: 'text-secondary',
      left: '24%',
      top: '40%',
      label: 'AQI 142 • NORTH RIDGE',
      isWarning: true,
    },
    {
      id: 'S-007',
      name: 'Gas Sentinel Beta',
      status: 'WARNING',
      zone: 'INDUSTRIAL EAST BELT',
      deviceTag: '#ENV-S007',
      temp: '29.5',
      tempDiff: '+1.1° vs baseline',
      humidity: '54',
      humidityState: 'Moderate',
      aqi: '158',
      aqiState: 'Unhealthy Spike',
      water: '0.4',
      waterMargin: 'Normal Basin',
      battery: '79',
      batteryState: 'Solar Trickle ON',
      signal: '-68 dBm',
      signalState: 'LoRaWAN SF7 (Reliable)',
      lastUpdate: '14 sec ago',
      badgeBg: 'bg-secondary',
      badgeText: 'text-secondary',
      left: '74%',
      top: '34%',
      label: 'AQI 158 • INDUSTRIAL',
      isWarning: true,
    },
    {
      id: 'S-011',
      name: 'Thermal Sentry V3',
      status: 'WARNING',
      zone: 'RIDGE PASS OUTPOST',
      deviceTag: '#ENV-S011',
      temp: '35.1',
      tempDiff: '+5.7° vs baseline',
      humidity: '41',
      humidityState: 'Dry Brush Warning',
      aqi: '136',
      aqiState: 'Elevated Haze',
      water: '0.2',
      waterMargin: 'Dry Runoff',
      battery: '94',
      batteryState: 'Solar Nominal',
      signal: '-80 dBm',
      signalState: 'LoRaWAN SF8',
      lastUpdate: '22 sec ago',
      badgeBg: 'bg-secondary',
      badgeText: 'text-secondary',
      left: '65%',
      top: '25%',
      label: 'THERMAL 35.1°C',
      isWarning: true,
    },
    {
      id: 'S-004',
      name: 'Hydro Node Delta',
      status: 'SAFE',
      zone: 'WEST VALLEY CREEK',
      deviceTag: '#ENV-S004',
      temp: '21.4',
      tempDiff: 'Normal',
      humidity: '72',
      humidityState: 'Nominal',
      aqi: '45',
      aqiState: 'Good',
      water: '0.9',
      waterMargin: 'Stable Flow',
      battery: '96',
      batteryState: 'Full Capacity',
      signal: '-61 dBm',
      signalState: 'LoRaWAN SF7 (Strong)',
      lastUpdate: '8 sec ago',
      badgeBg: 'bg-primary',
      badgeText: 'text-primary',
      left: '16%',
      top: '62%',
      label: 'NORMAL FLOW',
      isSafe: true,
    },
    {
      id: 'S-009',
      name: 'EcoSense Standard',
      status: 'SAFE',
      zone: 'PINE CREST BASE',
      deviceTag: '#ENV-S009',
      temp: '19.8',
      tempDiff: 'Normal',
      humidity: '65',
      humidityState: 'Nominal',
      aqi: '38',
      aqiState: 'Good',
      water: '0.6',
      waterMargin: 'Stable Creek',
      battery: '82',
      batteryState: 'Solar Trickle ON',
      signal: '-74 dBm',
      signalState: 'LoRaWAN SF7',
      lastUpdate: '19 sec ago',
      badgeBg: 'bg-primary',
      badgeText: 'text-primary',
      left: '52%',
      top: '30%',
      label: 'SAFE PINE CREST',
      isSafe: true,
    },
    {
      id: 'S-015',
      name: 'Atmospheric Barometer',
      status: 'SAFE',
      zone: 'SOUTHERN GRASSLANDS',
      deviceTag: '#ENV-S015',
      temp: '23.0',
      tempDiff: 'Normal',
      humidity: '59',
      humidityState: 'Nominal',
      aqi: '51',
      aqiState: 'Moderate',
      water: '0.5',
      waterMargin: 'Stable',
      battery: '90',
      batteryState: 'Solar Trickle ON',
      signal: '-69 dBm',
      signalState: 'LoRaWAN SF7',
      lastUpdate: '31 sec ago',
      badgeBg: 'bg-primary',
      badgeText: 'text-primary',
      left: '55%',
      top: '70%',
      label: 'SAFE GRASSLANDS',
      isSafe: true,
    },
    {
      id: 'S-022',
      name: 'Surface Hydrology',
      status: 'SAFE',
      zone: 'UPPER RESERVOIR',
      deviceTag: '#ENV-S022',
      temp: '18.2',
      tempDiff: 'Normal',
      humidity: '78',
      humidityState: 'High Humidity',
      aqi: '32',
      aqiState: 'Good',
      water: '1.8',
      waterMargin: 'Nominal Reservoir',
      battery: '91',
      batteryState: 'Solar Trickle ON',
      signal: '-65 dBm',
      signalState: 'LoRaWAN SF7',
      lastUpdate: '40 sec ago',
      badgeBg: 'bg-primary',
      badgeText: 'text-primary',
      left: '82%',
      top: '68%',
      label: 'SAFE RESERVOIR',
      isSafe: true,
    },
    {
      id: 'S-031',
      name: 'Submersible Logger',
      status: 'OFFLINE',
      zone: 'DELTA MARSH SECTOR 9',
      deviceTag: '#ENV-S031',
      temp: '--',
      tempDiff: '--',
      humidity: '--',
      humidityState: '--',
      aqi: '--',
      aqiState: '--',
      water: '--',
      waterMargin: '--',
      battery: '0',
      batteryState: 'Exhausted',
      signal: 'NO SIGNAL',
      signalState: 'Link Terminated',
      lastUpdate: '18 hrs ago',
      badgeBg: 'bg-outline',
      badgeText: 'text-surface-container-lowest',
      left: '12%',
      top: '31%',
      label: 'OFFLINE (DELTA)',
      isOffline: true,
    },
  ]

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-surface-container-lowest overflow-hidden flex flex-col select-none">
      {/* ─── Top Tactical Filter Bar ────────────────────────────────────────── */}
      <div className="h-12 border-b border-[#1a261d] bg-surface-container-low/95 backdrop-blur-md px-space-lg flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center gap-space-md flex-1">
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-outline">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Sensor ID, Zone (e.g. S-014), or GPS coordinate..."
              className="w-full bg-surface-container rounded pl-8 pr-2 py-1 font-telemetry-sm text-telemetry-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-high border border-[#1a261d]"
            />
          </div>

          <div className="h-4 w-px bg-[#1a261d] hidden md:block"></div>

          {/* Quick status count indicators */}
          <div className="hidden lg:flex items-center gap-space-md font-telemetry-sm text-telemetry-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-outline uppercase font-label-caps">Normal</span>
              <span className="font-bold text-on-surface">112</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-outline uppercase font-label-caps">Warning</span>
              <span className="font-bold text-secondary">27</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span className="text-outline uppercase font-label-caps">Critical</span>
              <span className="font-bold text-error">1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-outline"></span>
              <span className="text-outline uppercase font-label-caps">Offline</span>
              <span className="font-bold text-outline">8</span>
            </div>
          </div>
        </div>

        {/* Hazard filter categories */}
        <div className="flex items-center gap-space-xs">
          <button
            onClick={() => setThreatFilter('ALL')}
            className={clsx(
              'px-space-sm py-0.5 rounded font-label-caps text-label-caps transition-colors',
              threatFilter === 'ALL'
                ? 'bg-primary-container text-primary font-bold'
                : 'text-outline hover:text-on-surface'
            )}
          >
            ALL THREATS
          </button>
          <button
            onClick={() => setThreatFilter('FLOOD')}
            className={clsx(
              'px-space-sm py-0.5 rounded font-label-caps text-label-caps transition-colors flex items-center gap-1',
              threatFilter === 'FLOOD'
                ? 'bg-tertiary-container text-tertiary font-bold'
                : 'text-outline hover:text-on-surface'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            FLOOD
          </button>
          <button
            onClick={() => setThreatFilter('FIRE')}
            className={clsx(
              'px-space-sm py-0.5 rounded font-label-caps text-label-caps transition-colors flex items-center gap-1',
              threatFilter === 'FIRE'
                ? 'bg-secondary-container text-secondary font-bold'
                : 'text-outline hover:text-on-surface'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            FIRE / SMOKE
          </button>
          <button
            onClick={() => setThreatFilter('POLLUTION')}
            className={clsx(
              'px-space-sm py-0.5 rounded font-label-caps text-label-caps transition-colors flex items-center gap-1',
              threatFilter === 'POLLUTION'
                ? 'bg-surface-container-highest text-on-surface font-bold'
                : 'text-outline hover:text-on-surface'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></span>
            POLLUTION
          </button>
        </div>
      </div>

      {/* ─── Main Tactical GIS Canvas & Vector Overlays ──────────────────────── */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#101713]">
        {/* SVG Tactical Vector Map Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tacGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <circle cx="60" cy="0" r="1.5" fill="rgba(150, 213, 163, 0.2)" />
            </pattern>
            <linearGradient id="floodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00524b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#6bd8cb" stopOpacity="0.15" />
            </linearGradient>
            <radialGradient id="smokePlume" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb77d" stopOpacity="0.48" />
              <stop offset="60%" stopColor="#d97707" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#d97707" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Tactical Grid */}
          <rect width="100%" height="100%" fill="url(#tacGrid)" />

          {/* Topographic Contour Lines (River and Slopes) */}
          {layers.topography && (
            <g stroke="rgba(150, 213, 163, 0.08)" strokeWidth="1.5" fill="none">
              <path d="M -50 150 Q 200 120 450 180 T 950 130 T 1400 200" />
              <path d="M -50 250 Q 250 210 500 290 T 1000 220 T 1400 310" />
              <path d="M -50 380 Q 300 350 600 420 T 1100 360 T 1400 450" />
              <path d="M -50 520 Q 350 490 700 560 T 1200 500 T 1400 600" />
            </g>
          )}

          {/* River Basin Vector Stream */}
          <path
            d="M 120,220 Q 280,240 360,330 T 580,420 T 800,560"
            fill="none"
            stroke="#6bd8cb"
            strokeOpacity="0.65"
            strokeWidth="3.5"
          />

          {/* Hazard Overlay A: Flood Risk Contour Polygon */}
          {layers.basins && (
            <g className="transition-opacity duration-300">
              <polygon
                points="220,160 380,140 510,240 460,390 320,440 180,360 140,240"
                fill="url(#floodGrad)"
                stroke="#6bd8cb"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                className="animate-pulse"
              />
              <text
                x="210"
                y="200"
                fill="#6bd8cb"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="10"
                fontWeight="700"
                letterSpacing="1"
              >
                ZONE 3 CATCHMENT FLOOD DELTA (THREAT ELEVATED)
              </text>
            </g>
          )}

          {/* Hazard Overlay B: Fire/Smoke Plume Heatmap */}
          {layers.heatmap && (
            <g className="transition-opacity duration-300">
              <circle cx="72%" cy="38%" r="170" fill="url(#smokePlume)" />
              <ellipse cx="76%" cy="35%" rx="90" ry="60" fill="rgba(217, 119, 7, 0.28)" />
              <text
                x="68%"
                y="28%"
                fill="#ffb77d"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="10"
                fontWeight="700"
                letterSpacing="1"
              >
                WILDFIRE SMOKE PLUME - RIDGE PASS
              </text>
            </g>
          )}

          {/* Mesh Topology Link Rays */}
          {layers.mesh && (
            <path
              d="M 280,290 L 440,320 M 440,320 L 590,210 M 280,290 L 190,460 M 740,270 L 610,340 M 610,340 L 440,320"
              stroke="rgba(150, 213, 163, 0.25)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          )}
        </svg>

        {/* Tactical Geographic Place Labels */}
        <div className="absolute left-[68%] top-[16%] text-outline/50 font-label-caps text-[16px] tracking-widest pointer-events-none font-bold">
          Piedra
        </div>
        <div className="absolute left-[58%] top-[45%] text-outline/50 font-label-caps text-[16px] tracking-widest pointer-events-none font-bold">
          Avocado
        </div>
        <div className="absolute left-[55%] top-[60%] text-outline/50 font-label-caps text-[16px] tracking-widest pointer-events-none font-bold">
          Gravesboro
        </div>
        <div className="absolute left-[66%] top-[70%] text-outline/50 font-label-caps text-[16px] tracking-widest pointer-events-none font-bold flex items-center gap-1">
          <span>Clark valley</span>
          <span className="material-symbols-outlined text-[16px] text-outline/40">castle</span>
        </div>
        <div className="absolute left-[17%] top-[74%] text-outline/50 font-label-caps text-[18px] tracking-widest pointer-events-none font-bold">
          Riverbend
        </div>
        <div className="absolute left-[27%] top-[80%] text-outline/50 font-label-caps text-[14px] tracking-widest pointer-events-none font-bold">
          ELK
        </div>
        <div className="absolute left-[45%] top-[86%] text-outline/40 font-label-caps text-[13px] tracking-widest pointer-events-none font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-outline/40">park</span>
          <span>Sherwood Forest Golf Club</span>
        </div>
        <div className="absolute left-[42%] top-[64%] -rotate-45 text-tertiary/40 font-label-caps text-[11px] tracking-widest pointer-events-none font-bold">
          Kings River
        </div>

        {/* ─── Interactive Tactical Node Markers ───────────────────────────── */}
        {sensorList.map((sensor) => (
          <div
            key={sensor.id}
            onClick={() => handleSelectSensor(sensor)}
            style={{ left: sensor.left, top: sensor.top }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
          >
            <div className="relative flex items-center justify-center">
              {sensor.isCritical && (
                <>
                  <span className="absolute w-12 h-12 rounded-full bg-error/30 animate-ping"></span>
                  <span className="absolute w-8 h-8 rounded-full bg-error-container/60 animate-pulse"></span>
                </>
              )}
              {sensor.isWarning && (
                <span className="absolute w-7 h-7 rounded-full bg-secondary/20 group-hover:animate-ping"></span>
              )}

              <div
                className={clsx(
                  'relative px-2 py-1 rounded shadow-lg flex items-center gap-1.5 transform group-hover:scale-110 transition-transform',
                  sensor.isCritical
                    ? 'bg-error text-error'
                    : sensor.isOffline
                    ? 'bg-surface-container-low border border-outline text-outline opacity-80'
                    : 'bg-surface-container-high border border-[#1a261d] text-on-surface'
                )}
              >
                {sensor.isCritical ? (
                  <span className="material-symbols-outlined text-[14px] animate-bounce">priority_high</span>
                ) : (
                  <span
                    className={clsx(
                      'w-2 h-2 rounded-full',
                      sensor.isWarning ? 'bg-secondary' : sensor.isSafe ? 'bg-primary' : 'bg-outline'
                    )}
                  ></span>
                )}
                <span className="font-telemetry-sm text-telemetry-sm font-bold tracking-wider">
                  {sensor.id}
                </span>
              </div>
            </div>

            {/* Micro Badge Label below pin */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm pointer-events-none border border-[#1a261d]">
              <span
                className={clsx(
                  'font-label-caps text-label-caps font-bold',
                  sensor.isCritical
                    ? 'text-error'
                    : sensor.isWarning
                    ? 'text-secondary'
                    : sensor.isOffline
                    ? 'text-outline'
                    : 'text-primary'
                )}
              >
                {sensor.label}
              </span>
            </div>
          </div>
        ))}

        {/* ─── Floating Layer Stack Dock (Top Left) ────────────────────────── */}
        <div className="absolute top-space-lg left-space-lg z-30 flex flex-col gap-space-xs bg-surface-container-low/95 backdrop-blur-md p-space-sm rounded-xl shadow-xl border border-[#1a261d]">
          <div className="flex items-center justify-between pb-1 px-1 border-b border-[#1a261d]">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Layer Stack</span>
            <span className="material-symbols-outlined text-[16px] text-primary">layers</span>
          </div>

          <label className="flex items-center justify-between gap-space-lg px-2 py-1 rounded hover:bg-surface-container cursor-pointer">
            <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">terrain</span>
              Topography
            </span>
            <input
              type="checkbox"
              checked={layers.topography}
              onChange={(e) => setLayers({ ...layers, topography: e.target.checked })}
              className="accent-primary h-3.5 w-3.5 rounded bg-surface-container-highest cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between gap-space-lg px-2 py-1 rounded hover:bg-surface-container cursor-pointer">
            <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary">local_fire_department</span>
              Hazard Heatmap
            </span>
            <input
              type="checkbox"
              checked={layers.heatmap}
              onChange={(e) => setLayers({ ...layers, heatmap: e.target.checked })}
              className="accent-primary h-3.5 w-3.5 rounded bg-surface-container-highest cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between gap-space-lg px-2 py-1 rounded hover:bg-surface-container cursor-pointer">
            <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-tertiary">hub</span>
              Sensor Mesh
            </span>
            <input
              type="checkbox"
              checked={layers.mesh}
              onChange={(e) => setLayers({ ...layers, mesh: e.target.checked })}
              className="accent-primary h-3.5 w-3.5 rounded bg-surface-container-highest cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between gap-space-lg px-2 py-1 rounded hover:bg-surface-container cursor-pointer">
            <span className="font-body-sm text-body-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-tertiary">waves</span>
              Catchment Basins
            </span>
            <input
              type="checkbox"
              checked={layers.basins}
              onChange={(e) => setLayers({ ...layers, basins: e.target.checked })}
              className="accent-primary h-3.5 w-3.5 rounded bg-surface-container-highest cursor-pointer"
            />
          </label>
        </div>

        {/* ─── Zoom & Scale Controls (Bottom Left) ─────────────────────────── */}
        <div className="absolute bottom-space-lg left-space-lg z-30 flex items-center gap-space-xs bg-surface-container-low/95 backdrop-blur-md p-1.5 rounded-lg shadow-lg border border-[#1a261d]">
          <button className="p-1 rounded hover:bg-surface-container-high text-on-surface transition-colors" title="Zoom In">
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <button className="p-1 rounded hover:bg-surface-container-high text-on-surface transition-colors" title="Zoom Out">
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <div className="h-4 w-px bg-[#1a261d] mx-1"></div>
          <button className="p-1 rounded hover:bg-surface-container-high text-primary transition-colors" title="Recenter Viewport">
            <span className="material-symbols-outlined text-[18px]">my_location</span>
          </button>
          <span className="font-telemetry-sm text-telemetry-sm text-outline px-2">1:25,000 MESH</span>
        </div>

        {/* ─── Collapsible Live Telemetry Stream Flyout Drawer (Right) ─────── */}
        <div
          className={clsx(
            'absolute top-0 right-0 bottom-0 w-96 bg-surface-container-low/95 backdrop-blur-xl border-l border-[#1a261d] z-40 flex flex-col shadow-2xl transition-transform duration-300',
            flyoutOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Drawer Header */}
          <div className="p-space-md border-b border-[#1a261d] flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[20px] text-primary animate-pulse">
                sensors
              </span>
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {selectedSensor.id}
                </span>
                <span className={clsx('px-space-xs py-0.5 rounded font-label-caps text-label-caps font-bold', selectedSensor.badgeBg, selectedSensor.badgeText)}>
                  {selectedSensor.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => setFlyoutOpen(false)}
              className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
              title="Close Panel"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Subheader */}
          <div className="px-space-md py-1 bg-surface-container-high/40 flex items-center justify-between text-on-surface-variant font-telemetry-sm text-telemetry-sm border-b border-[#1a261d]">
            <span className="font-label-caps text-label-caps uppercase">{selectedSensor.zone}</span>
            <span className="text-outline">{selectedSensor.deviceTag}</span>
          </div>

          {/* Live telemetry content */}
          <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-space-md">
            {/* Live indicator banner */}
            <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-highest/60 border border-[#1a261d]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-caps text-label-caps text-primary uppercase font-bold">
                  Live Telemetry Stream
                </span>
              </div>
              <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                {selectedSensor.lastUpdate}
              </span>
            </div>

            {/* 2x3 Metric Grid */}
            <div className="grid grid-cols-2 gap-space-sm">
              {/* Temperature */}
              <div className="bg-surface-container p-space-sm rounded-lg flex flex-col justify-between border border-[#1a261d]">
                <div className="flex items-center justify-between text-outline">
                  <span className="font-label-caps text-label-caps uppercase">Ambient Temp</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">thermostat</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">
                    {selectedSensor.temp}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">°C</span>
                </div>
                <span className="font-label-caps text-label-caps text-secondary mt-1">
                  {selectedSensor.tempDiff}
                </span>
              </div>

              {/* Humidity */}
              <div className="bg-surface-container p-space-sm rounded-lg flex flex-col justify-between border border-[#1a261d]">
                <div className="flex items-center justify-between text-outline">
                  <span className="font-label-caps text-label-caps uppercase">Rel Humidity</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary">water_drop</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">
                    {selectedSensor.humidity}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">%</span>
                </div>
                <span className="font-label-caps text-label-caps text-outline mt-1">
                  {selectedSensor.humidityState}
                </span>
              </div>

              {/* AQI */}
              <div className="bg-surface-container p-space-sm rounded-lg flex flex-col justify-between border border-[#1a261d]">
                <div className="flex items-center justify-between text-outline">
                  <span className="font-label-caps text-label-caps uppercase">AQI (PM2.5)</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">air</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">
                    {selectedSensor.aqi}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">AQI</span>
                </div>
                <span className="font-label-caps text-label-caps text-secondary mt-1">
                  {selectedSensor.aqiState}
                </span>
              </div>

              {/* Water Level */}
              <div className="bg-surface-container p-space-sm rounded-lg flex flex-col justify-between border border-[#1a261d]">
                <div className="flex items-center justify-between text-outline">
                  <span className="font-label-caps text-label-caps uppercase">Water Level</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary">waves</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">
                    {selectedSensor.water}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">m</span>
                </div>
                <span className="font-label-caps text-label-caps text-primary mt-1">
                  {selectedSensor.waterMargin}
                </span>
              </div>

              {/* Battery */}
              <div className="bg-surface-container p-space-sm rounded-lg flex flex-col justify-between border border-[#1a261d]">
                <div className="flex items-center justify-between text-outline">
                  <span className="font-label-caps text-label-caps uppercase">Battery</span>
                  <span className="material-symbols-outlined text-[16px] text-primary">solar_power</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">
                    {selectedSensor.battery}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">%</span>
                </div>
                <span className="font-label-caps text-label-caps text-primary mt-1">
                  {selectedSensor.batteryState}
                </span>
              </div>

              {/* RF Uplink */}
              <div className="bg-surface-container p-space-sm rounded-lg flex flex-col justify-between border border-[#1a261d]">
                <div className="flex items-center justify-between text-outline">
                  <span className="font-label-caps text-label-caps uppercase">RF Uplink</span>
                  <span className="material-symbols-outlined text-[16px] text-primary">cell_tower</span>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="font-telemetry-md text-telemetry-md text-on-surface font-bold">
                    {selectedSensor.signal}
                  </span>
                </div>
                <span className="font-label-caps text-label-caps text-primary mt-1">
                  {selectedSensor.signalState}
                </span>
              </div>
            </div>

            {/* 6-Hour Trend Curve */}
            <div className="bg-surface-container p-space-md rounded-lg flex flex-col gap-2 border border-[#1a261d]">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                  6-Hour Trend Curve
                </span>
                <span className="font-label-caps text-label-caps text-primary font-bold">
                  AQI / WATER DELTA
                </span>
              </div>
              <svg className="w-full h-16" preserveAspectRatio="none" viewBox="0 0 240 60">
                <defs>
                  <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb77d" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ffb77d" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,42 Q 40,38 80,48 T 140,24 T 190,32 T 240,12 L 240,60 L 0,60 Z"
                  fill="url(#sparklineGradient)"
                />
                <path
                  d="M 0,42 Q 40,38 80,48 T 140,24 T 190,32 T 240,12"
                  fill="none"
                  stroke="#ffb77d"
                  strokeWidth="2"
                />
                <circle cx="240" cy="12" r="3" fill="#ffb77d" />
              </svg>
              <div className="flex items-center justify-between font-label-caps text-label-caps text-outline">
                <span>T -6h (08:30)</span>
                <span>T -3h (11:30)</span>
                <span className="text-secondary font-bold">NOW (14:32)</span>
              </div>
            </div>

            {/* Field Operational Dispatch Actions */}
            <div className="flex flex-col gap-2 mt-auto pt-2">
              <button className="w-full py-2 px-space-md rounded bg-primary-container hover:bg-surface-container-highest text-primary font-body-sm text-body-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-primary/30">
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Recalibrate Sensor Node
              </button>
              <button className="w-full py-2 px-space-md rounded bg-error-container hover:bg-error/30 text-error font-body-sm text-body-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-error/30">
                <span className="material-symbols-outlined text-[18px]">emergency_share</span>
                Dispatch Inspection Team
              </button>
              <Link
                to={`/nodes/${selectedSensor.id}`}
                className="w-full py-2 px-space-md rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm font-medium transition-colors flex items-center justify-center gap-2 border border-[#1a261d]"
              >
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                Full Historical Diagnostics
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer reopen toggle button if closed */}
        {!flyoutOpen && (
          <button
            onClick={() => setFlyoutOpen(true)}
            className="absolute top-space-lg right-space-lg z-30 px-space-md py-space-xs rounded-lg bg-surface-container-low/90 backdrop-blur border border-[#1a261d] text-on-surface hover:text-primary flex items-center gap-1.5 font-telemetry-sm text-telemetry-sm shadow-xl transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">dock_to_left</span>
            <span>Open Telemetry Dock</span>
          </button>
        )}
      </div>
    </div>
  )
}
