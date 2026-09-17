// pages/Dashboard.jsx — Tactical Command Console matching Photos 1 & 2

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

// ─── Modal for Provisioning Sensor Node ──────────────────────────────────────
function AddSensorModal({ onClose, onAdd }) {
  const [nodeTag, setNodeTag] = useState('')
  const [hardwareType, setHardwareType] = useState('Environmental Multi-Probe')
  const [operationalZone, setOperationalZone] = useState('Zone 1 North Ridge')
  const [lat, setLat] = useState('34.0522')
  const [lng, setLng] = useState('-118.2437')
  const [battery, setBattery] = useState(100)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nodeTag.trim()) return

    const newSensor = {
      id: nodeTag.toUpperCase(),
      type: hardwareType,
      zone: operationalZone,
      coords: `${parseFloat(lat).toFixed(4)}° N, ${Math.abs(parseFloat(lng)).toFixed(4)}° W`,
      link: 'Connected',
      battery: parseInt(battery) || 100,
      state: 'Normal',
      stateBadge: 'bg-primary-container text-primary border border-primary/20',
      critical: false,
    }

    onAdd(newSensor)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container border border-[#223326] rounded-2xl p-6 w-full max-w-md shadow-2xl text-on-surface font-mono">
        <div className="flex justify-between items-center mb-4 border-b border-[#1a261d] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
            <h3 className="font-bold text-base text-on-surface">Provision Tactical Sensor Node</h3>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-outline block mb-1 uppercase font-label-caps">Node Tag ID</label>
            <input
              type="text"
              placeholder="e.g. S-045"
              value={nodeTag}
              onChange={(e) => setNodeTag(e.target.value)}
              className="w-full bg-surface-container-lowest border border-[#1a261d] rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-outline block mb-1 uppercase font-label-caps">Hardware Subsystem Type</label>
            <select
              value={hardwareType}
              onChange={(e) => setHardwareType(e.target.value)}
              className="w-full bg-surface-container-lowest border border-[#1a261d] rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="Environmental Multi-Probe">Environmental Multi-Probe</option>
              <option value="Hydro-Sonic Water Gauge">Hydro-Sonic Water Gauge</option>
              <option value="Air Quality & Particulate">Air Quality & Particulate</option>
              <option value="Thermal Smoke & VOC">Thermal Smoke & VOC</option>
              <option value="Micro-Climate Node">Micro-Climate Node</option>
            </select>
          </div>

          <div>
            <label className="text-outline block mb-1 uppercase font-label-caps">Operational Zone</label>
            <input
              type="text"
              placeholder="e.g. Catchment Sector 4"
              value={operationalZone}
              onChange={(e) => setOperationalZone(e.target.value)}
              className="w-full bg-surface-container-lowest border border-[#1a261d] rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-outline block mb-1 uppercase font-label-caps">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-surface-container-lowest border border-[#1a261d] rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-outline block mb-1 uppercase font-label-caps">Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-surface-container-lowest border border-[#1a261d] rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-outline block mb-1 uppercase font-label-caps">Initial Battery Level (%)</label>
            <input
              type="number"
              value={battery}
              onChange={(e) => setBattery(parseInt(e.target.value) || 0)}
              className="w-full bg-surface-container-lowest border border-[#1a261d] rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-primary-container hover:bg-primary-container/80 text-primary font-bold py-2 rounded-lg border border-primary/30 transition-colors text-xs"
            >
              Deploy to Mesh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 bg-surface-container-lowest hover:bg-surface-container-high text-outline rounded-lg border border-[#1a261d] text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [alertSilenced, setAlertSilenced] = useState(false)
  const [zoneIsolated, setZoneIsolated] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const [roster, setRoster] = useState([
    {
      id: 'S-001',
      type: 'Environmental Multi-Probe',
      zone: 'Zone 1 North Ridge',
      coords: '34.0522° N, 118.2437° W',
      link: 'Connected',
      battery: 94,
      state: 'Normal',
      stateBadge: 'bg-primary-container text-primary border border-primary/20',
      critical: false,
    },
    {
      id: 'S-007',
      type: 'Air Quality & Particulate',
      zone: 'Industrial Sector 4',
      coords: '34.0480° N, 118.2568° W',
      link: 'Connected',
      battery: 81,
      state: 'WARNING AQI: 186',
      stateBadge: 'bg-secondary-container text-secondary border border-secondary/20',
      critical: false,
    },
    {
      id: 'S-014',
      type: 'Hydro-Sonic Water Gauge',
      zone: 'Catchment Zone 3',
      coords: '34.0390° N, 118.2390° W',
      link: 'Connected',
      battery: 76,
      state: 'CRITICAL 2.8M SURGE',
      stateBadge: 'bg-error-container text-error border border-error/20 font-bold animate-pulse',
      critical: true,
    },
    {
      id: 'S-022',
      type: 'Thermal Smoke & VOC',
      zone: 'Pine Valley Buffer',
      coords: '34.0610° N, 118.2200° W',
      link: 'Connected',
      battery: 89,
      state: 'Normal',
      stateBadge: 'bg-primary-container text-primary border border-primary/20',
      critical: false,
    },
    {
      id: 'S-031',
      type: 'Micro-Climate Node',
      zone: 'Delta Marsh East',
      coords: '34.0250° N, 118.2710° W',
      link: 'Offline',
      battery: 6,
      batteryLow: true,
      state: 'UNREACHABLE',
      stateBadge: 'bg-surface-container-highest text-outline border border-[#223326]',
      critical: false,
    },
  ])

  const handleAddSensor = (newSensor) => {
    setRoster(prev => [newSensor, ...prev])
  }

  const filteredRoster = roster.filter(
    (n) =>
      n.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      n.zone.toLowerCase().includes(searchFilter.toLowerCase()) ||
      n.type.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg select-none">
      {/* Top Tactical Alert Status Bar (Photo 2) */}
      <div className="w-full bg-surface-container-high rounded-xl p-space-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-md border border-[#223326]">
        <div className="flex items-center gap-space-md">
          <div className="w-3 h-3 rounded-full bg-error animate-ping"></div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-caps text-label-caps text-error tracking-wider uppercase font-bold">
                Hazard Condition Alert
              </span>
              <span className="font-telemetry-sm text-telemetry-sm text-outline">| EV-9021</span>
            </div>
            <span className="font-body-md text-body-md text-on-surface font-medium">
              Catchment Basin S-014 reports rapid hydrological delta (+0.4m within 18 mins).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm self-end md:self-auto">
          <button
            onClick={() => setAlertSilenced(!alertSilenced)}
            className={clsx(
              'px-space-md py-1.5 rounded font-telemetry-sm text-telemetry-sm transition-colors flex items-center gap-space-xs border border-[#1a261d]',
              alertSilenced
                ? 'bg-surface-bright text-primary font-bold'
                : 'bg-surface-container hover:bg-surface-bright text-on-surface'
            )}
          >
            <span className="material-symbols-outlined text-[16px]">
              {alertSilenced ? 'check' : 'notifications_paused'}
            </span>
            {alertSilenced ? 'Silenced (15m)' : 'Silence 15m'}
          </button>

          <button
            onClick={() => setZoneIsolated(!zoneIsolated)}
            className={clsx(
              'px-space-md py-1.5 rounded font-telemetry-sm text-telemetry-sm font-semibold transition-colors flex items-center gap-space-xs border border-error/30',
              zoneIsolated
                ? 'bg-error text-black font-bold'
                : 'bg-error-container hover:bg-error-container/80 text-error'
            )}
          >
            <span className="material-symbols-outlined text-[16px]">priority_high</span>
            {zoneIsolated ? '✓ Zone 3 Isolated' : '! Isolate Zone 3'}
          </button>
        </div>
      </div>

      {/* Section 1: KPI Summary Row (4 Fleet Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <div className="bg-surface-container rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container-high transition-colors border border-[#1a261d]">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
          <div className="flex items-center justify-between z-10">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Total Deployed Node Fleet</span>
            <span className="material-symbols-outlined text-[20px] text-primary">hub</span>
          </div>
          <div className="mt-space-md flex items-baseline gap-space-sm z-10">
            <span className="font-display-lg text-display-lg text-on-surface font-bold">148</span>
            <span className="font-telemetry-sm text-telemetry-sm text-primary flex items-center">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>+12 Q3
            </span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-on-surface-variant z-10 border-t border-[#1a261d]">
            <span>Target: 160 units</span>
            <span className="text-primary font-semibold">92.5% Installed</span>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container-high transition-colors border border-[#1a261d]">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
          <div className="flex items-center justify-between z-10">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Active Mesh Nodes</span>
            <span className="material-symbols-outlined text-[20px] text-primary">wifi_tethering</span>
          </div>
          <div className="mt-space-md flex items-baseline gap-space-sm z-10">
            <span className="font-display-lg text-display-lg text-on-surface font-bold">139</span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-on-surface-variant z-10 border-t border-[#1a261d]">
            <span className="text-primary">93.9% Operational</span>
            <span>Latency: 28ms</span>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container-high transition-colors border border-[#1a261d]">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors pointer-events-none"></div>
          <div className="flex items-center justify-between z-10">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Unreachable Fleet</span>
            <span className="material-symbols-outlined text-[20px] text-secondary">sensors_off</span>
          </div>
          <div className="mt-space-md flex items-baseline gap-space-sm z-10">
            <span className="font-display-lg text-display-lg text-on-surface font-bold">9</span>
            <span className="font-telemetry-sm text-telemetry-sm text-secondary">Requires Field Service</span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-on-surface-variant z-10 border-t border-[#1a261d]">
            <span>6 Scheduled Maint.</span>
            <span className="text-secondary font-semibold">3 Low Battery</span>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-space-lg flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container-high transition-colors border border-[#1a261d]">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors pointer-events-none"></div>
          <div className="flex items-center justify-between z-10">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Active Threat Indicators</span>
            <span className="material-symbols-outlined text-[20px] text-error">crisis_alert</span>
          </div>
          <div className="mt-space-md flex items-baseline gap-space-sm z-10">
            <span className="font-display-lg text-display-lg text-error font-bold">4</span>
            <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">Tripped Escorts</span>
          </div>
          <div className="mt-space-sm pt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-on-surface-variant z-10 border-t border-[#1a261d]">
            <span className="text-error font-semibold">1 Critical (S-014)</span>
            <span className="text-secondary">3 Warning</span>
          </div>
        </div>
      </div>

      {/* Section 2: Main Telemetry Streams & Integrity Profile (Bento 8 / 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left: 6 Telemetry Stream Cards (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Telemetry Streams</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-outline font-label-caps text-label-caps uppercase border border-[#1a261d]">
                REALTIME SYNC (1s)
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-outline font-telemetry-sm text-telemetry-sm">
              <span>Filter:</span>
              <span className="text-primary font-semibold">All Zones</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
            {/* 1: Temperature */}
            <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm hover:bg-surface-container-high transition-all border border-[#1a261d]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-primary">thermostat</span>
                    <span className="font-label-caps text-label-caps text-outline uppercase">Temperature</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps uppercase border border-primary/20">
                    Normal
                  </span>
                </div>
                <div className="mt-space-sm flex items-baseline justify-between">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">32.4</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">°C</span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-primary flex items-center">
                    <span className="material-symbols-outlined text-[14px]">north_east</span> ↗ 0.8°C/h
                  </span>
                </div>
                <div className="mt-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  Peak: 35.1°C | Low: 21.0°C
                </div>
              </div>
              <div className="mt-space-md">
                <svg className="w-full h-10 text-primary overflow-visible" fill="none" viewBox="0 0 120 30">
                  <path d="M0,22 Q15,20 30,18 T60,15 T90,8 T120,5" fill="none" stroke="#96d5a3" strokeWidth="2" />
                  <path d="M0,22 Q15,20 30,18 T60,15 T90,8 T120,5 L120,30 L0,30 Z" fill="#96d5a3" fillOpacity="0.12" />
                  <circle cx="120" cy="5" fill="#96d5a3" r="3" />
                </svg>
              </div>
            </div>

            {/* 2: Humidity */}
            <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm hover:bg-surface-container-high transition-all border border-[#1a261d]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">humidity_percentage</span>
                    <span className="font-label-caps text-label-caps text-outline uppercase">Relative Humidity</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-label-caps text-label-caps uppercase border border-secondary/20">
                    Elevated
                  </span>
                </div>
                <div className="mt-space-sm flex items-baseline justify-between">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">68</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">%</span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-outline flex items-center">
                    <span className="material-symbols-outlined text-[14px]">east</span> → Steady
                  </span>
                </div>
                <div className="mt-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  Dew Point: 22.4°C | Sat: 88%
                </div>
              </div>
              <div className="mt-space-md">
                <svg className="w-full h-10 text-tertiary overflow-visible" fill="none" viewBox="0 0 120 30">
                  <path d="M0,15 Q30,12 60,16 T120,14" fill="none" stroke="#6bd8cb" strokeWidth="2" />
                  <path d="M0,15 Q30,12 60,16 T120,14 L120,30 L0,30 Z" fill="#6bd8cb" fillOpacity="0.12" />
                  <circle cx="120" cy="14" fill="#6bd8cb" r="3" />
                </svg>
              </div>
            </div>

            {/* 3: AQI */}
            <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm hover:bg-surface-container-high transition-all border border-[#1a261d]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-secondary">air</span>
                    <span className="font-label-caps text-label-caps text-outline uppercase">AQI Index</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-secondary font-label-caps text-label-caps uppercase border border-secondary/20 font-bold">
                    Warning
                  </span>
                </div>
                <div className="mt-space-sm flex items-baseline justify-between">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">142</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">US AQI</span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-secondary font-medium">
                    Sensitive Unhealthy
                  </span>
                </div>
                <div className="mt-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  PM2.5: 58 µg/m³ | PM10: 92 µg/m³
                </div>
              </div>
              <div className="mt-space-md">
                <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden border border-[#1a261d]">
                  <div className="bg-gradient-to-r from-primary via-secondary to-error h-full rounded-full" style={{ width: '64%' }}></div>
                </div>
                <div className="flex justify-between font-label-caps text-label-caps text-outline pt-1">
                  <span>0</span>
                  <span className="text-secondary">Marker: 142</span>
                  <span>300</span>
                </div>
              </div>
            </div>

            {/* 4: Fire Risk */}
            <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm hover:bg-surface-container-high transition-all border border-[#1a261d]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-secondary">local_fire_department</span>
                    <span className="font-label-caps text-label-caps text-outline uppercase">Fire / Smoke Risk</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps uppercase border border-primary/20">
                    Safe
                  </span>
                </div>
                <div className="mt-space-sm flex items-baseline justify-between">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">LOW</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Level 1</span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-outline">
                    FLIR Nom
                  </span>
                </div>
                <div className="mt-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  CO: 0.02 ppm | Optical VOC: &lt;0.01
                </div>
              </div>
              <div className="mt-space-md">
                <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden border border-[#1a261d]">
                  <div className="bg-primary h-full rounded-full" style={{ width: '18%' }}></div>
                </div>
              </div>
            </div>

            {/* 5: Water Level */}
            <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm hover:bg-surface-container-high transition-all border border-secondary/30 relative">
              <div className="absolute top-0 right-0 w-2 h-2 rounded-bl bg-secondary"></div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-secondary">water_drop</span>
                    <span className="font-label-caps text-label-caps text-outline uppercase">Water Level</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-secondary-container text-secondary font-label-caps text-label-caps uppercase border border-secondary/20 font-bold">
                    Surge
                  </span>
                </div>
                <div className="mt-space-sm flex items-baseline justify-between">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">1.28</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">m</span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-secondary font-semibold flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +0.4m Sec 3
                  </span>
                </div>
                <div className="mt-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  Catchment Capacity: 74%
                </div>
              </div>
              <div className="mt-space-md">
                <svg className="w-full h-10 text-secondary overflow-visible" fill="none" viewBox="0 0 120 30">
                  <path d="M0,25 Q40,24 80,18 T120,6" fill="none" stroke="#ffb77d" strokeWidth="2" />
                  <path d="M0,25 Q40,24 80,18 T120,6 L120,30 L0,30 Z" fill="#ffb77d" fillOpacity="0.12" />
                  <circle cx="120" cy="6" fill="#ffb77d" r="3" />
                </svg>
              </div>
            </div>

            {/* 6: Gas & Pollutants */}
            <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm hover:bg-surface-container-high transition-all border border-[#1a261d]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px] text-primary">co2</span>
                    <span className="font-label-caps text-label-caps text-outline uppercase">Gas / Pollutants</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps uppercase border border-primary/20">
                    Nominal
                  </span>
                </div>
                <div className="mt-space-sm flex items-baseline justify-between">
                  <div className="flex items-baseline gap-space-xs">
                    <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">412</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">ppm CO2</span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-outline">
                    12 ppb NO2
                  </span>
                </div>
                <div className="mt-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  Ozone: 31 ppb | SO2: 2.1 ppb
                </div>
              </div>
              <div className="mt-space-md">
                <svg className="w-full h-10 text-primary overflow-visible" fill="none" viewBox="0 0 120 30">
                  <path d="M0,18 Q40,16 80,20 T120,18" fill="none" stroke="#96d5a3" strokeWidth="2" />
                  <circle cx="120" cy="18" fill="#96d5a3" r="3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Integrity & Threat Profile (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Integrity & Threat Profile</span>
            <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">SYS-CHECK: OK</span>
          </div>

          <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-md shadow-sm border border-[#1a261d]">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">Overall DEFCON Level</span>
                <span className="px-2 py-0.5 rounded bg-secondary-container text-secondary font-label-caps text-label-caps uppercase border border-secondary/20 font-bold">
                  Elevated
                </span>
              </div>
              <div className="mt-2 p-space-sm rounded bg-surface-container-lowest border border-[#1a261d] flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">warning</span>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">Watch Condition Beta Active</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Southern Catchment Basin Hydro-Runoff warning in place.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-label-caps text-label-caps text-outline uppercase">Sensor Array Health Breakdown</span>
                <span className="font-telemetry-sm text-telemetry-sm text-outline">148 Nodes Validated</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-3 rounded-full flex overflow-hidden border border-[#1a261d]">
                <div className="bg-primary h-full" style={{ width: '78%' }} title="Normal: 78%"></div>
                <div className="bg-secondary h-full" style={{ width: '18%' }} title="Warning: 18%"></div>
                <div className="bg-error h-full" style={{ width: '4%' }} title="Critical: 4%"></div>
              </div>
              <div className="flex justify-between font-label-caps text-label-caps text-on-surface-variant pt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary"></span> 78% (115 nodes)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span> 18% (27 nodes)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-error"></span> 4% (6 nodes)
                </span>
              </div>
            </div>

            {/* Active Geospatial Hotspot Map Card */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-label-caps text-label-caps text-outline uppercase">Active Geospatial Hotspot</span>
                <Link to="/map" className="font-telemetry-sm text-telemetry-sm text-primary hover:underline flex items-center gap-0.5">
                  Expand Map <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
              <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#1a261d] bg-surface-container-lowest flex items-center justify-center group">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2PjaUJTmqiwBSTH6XHean5GSiduJ8MNH42dXF6rl8474xW1z-pkl6MT_QKY8WLoLJV9TY05JQMOFs_O81x093RDuOCw9oV-FYGuY2LejEyzSezWmkn607apRqwtwSaBIqvzDXmcsZfcIylIAB3MsY6yOwR6iQZwc6Z6h2ncq6tjHD3dLfo1qt563rEvAOe6JdVZtyiWYCnhKZpvynmjo_56s9z9GDvPnuXcVIGIhChEdWOH5va8TS"
                  alt="Satellite IR View"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-primary font-label-caps text-label-caps border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  Catchment Sector 3
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-outline font-label-caps text-label-caps border border-[#1a261d]">
                  MAP FEED LIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Tactical Field Sensor Roster Table (Photo 1 Bottom) */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Tactical Field Sensor Roster
            </h3>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps border border-[#1a261d]">
              {roster.length} RECENT AUDITED
            </span>
          </div>

          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[18px]">search</span>
              <input
                type="text"
                placeholder="Filter by Node ID or Sector..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-surface-container border border-[#1a261d] rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary w-64"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/80 text-primary font-bold text-xs flex items-center gap-1 border border-primary/30 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Sensor
            </button>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm border border-[#1a261d]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest text-outline font-label-caps uppercase border-b border-[#1a261d]">
                  <th className="py-2.5 px-space-md">Node Tag</th>
                  <th className="py-2.5 px-space-md">Hardware Type</th>
                  <th className="py-2.5 px-space-md">Operational Zone</th>
                  <th className="py-2.5 px-space-md">Telemetry Coordinates</th>
                  <th className="py-2.5 px-space-md">Mesh Link</th>
                  <th className="py-2.5 px-space-md">Battery Reserve</th>
                  <th className="py-2.5 px-space-md">State / Value</th>
                  <th className="py-2.5 px-space-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a261d]/60">
                {filteredRoster.map((node) => (
                  <tr
                    key={node.id}
                    className={clsx(
                      'hover:bg-surface-container-high/60 transition-colors',
                      node.critical && 'bg-error-container/15'
                    )}
                  >
                    <td className="py-3 px-space-md font-telemetry-md text-telemetry-md font-semibold text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <span className={clsx(
                          'material-symbols-outlined text-[16px]',
                          node.critical ? 'text-error' : node.batteryLow ? 'text-outline' : 'text-primary'
                        )}>
                          {node.critical ? 'warning' : 'sensors'}
                        </span>
                        <span>{node.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-space-md text-on-surface-variant font-medium">
                      {node.type}
                    </td>
                    <td className="py-3 px-space-md text-on-surface font-medium">
                      {node.zone}
                    </td>
                    <td className="py-3 px-space-md font-telemetry-sm text-telemetry-sm text-outline">
                      {node.coords}
                    </td>
                    <td className="py-3 px-space-md font-telemetry-sm text-telemetry-sm">
                      <span className={clsx(
                        'flex items-center gap-1 font-semibold',
                        node.link === 'Connected' ? 'text-primary' : 'text-outline'
                      )}>
                        <span className={clsx(
                          'w-1.5 h-1.5 rounded-full',
                          node.link === 'Connected' ? 'bg-primary' : 'bg-outline'
                        )}></span>
                        {node.link}
                      </span>
                    </td>
                    <td className="py-3 px-space-md font-telemetry-sm text-telemetry-sm">
                      <span className={clsx(
                        'font-bold',
                        node.battery > 50 ? 'text-primary' : node.battery > 20 ? 'text-secondary' : 'text-error'
                      )}>
                        {node.battery}% {node.batteryLow && '(Low)'}
                      </span>
                    </td>
                    <td className="py-3 px-space-md">
                      <span className={clsx('px-2 py-0.5 rounded font-label-caps text-label-caps', node.stateBadge)}>
                        {node.state}
                      </span>
                    </td>
                    <td className="py-3 px-space-md text-right">
                      <Link
                        to={`/nodes/${node.id}`}
                        className="inline-flex items-center justify-center p-1 rounded hover:bg-surface-container text-outline hover:text-primary transition-colors"
                        title="Inspect Telemetry"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-surface-container-lowest px-space-md py-2.5 flex items-center justify-between text-outline font-telemetry-sm text-telemetry-sm border-t border-[#1a261d]">
            <span>Showing {filteredRoster.length} of 148 Nodes</span>
            <Link to="/history" className="text-primary hover:underline flex items-center gap-0.5">
              View Master Inventory <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Provision Sensor Modal */}
      {showAddModal && (
        <AddSensorModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSensor}
        />
      )}
    </div>
  )
}
