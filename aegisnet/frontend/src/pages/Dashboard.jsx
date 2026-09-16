// pages/Dashboard.jsx — Streamlined EcoMonitor Dashboard with Collapsible Pull-Down Sections

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import ScenarioRunner from '../components/demo/ScenarioRunner'
import clsx from 'clsx'

import { SENSOR_TYPES } from '../store/useStore'

function AddSensorModal({ defaultType = 'Water Level / Flood', onClose, onAdd }) {
  const navigate = useNavigate()
  const aiHotspots = useStore((s) => s.aiHotspots)

  const [sensorType, setSensorType] = useState(defaultType)
  const [placementTab, setPlacementTab] = useState('ai') // 'ai' | 'manual'
  const [selectedHotspot, setSelectedHotspot] = useState(aiHotspots[0])
  const [customName, setCustomName] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [customGps, setCustomGps] = useState('23.0063° N, 72.6026° E')
  const [connectionType, setConnectionType] = useState('GPS Auto-Sync + LoRa Mesh')
  const [batteryPct, setBatteryPct] = useState(100)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Filter matching AI hotspots based on chosen sensor type
  const matchingHotspots = aiHotspots.filter((h) => {
    if (sensorType.includes('Water')) return h.recommended_for === 'water'
    if (sensorType.includes('Air')) return h.recommended_for === 'air'
    if (sensorType.includes('Thermal') || sensorType.includes('Fire')) return h.recommended_for === 'fire'
    if (sensorType.includes('Temperature')) return h.recommended_for === 'temperature'
    if (sensorType.includes('Humidity')) return h.recommended_for === 'humidity'
    if (sensorType.includes('Gas')) return h.recommended_for === 'gas'
    return true
  })

  const currentHotspot = selectedHotspot || matchingHotspots[0] || aiHotspots[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (placementTab === 'map_redirect') {
      onClose()
      navigate(`/map?place=true&type=${encodeURIComponent(sensorType)}`)
      return
    }

    if (placementTab === 'manual') {
      onAdd({
        type: sensorType,
        name: customName || `Sensor (${customLocation || 'Custom Lake/Area'})`,
        city: 'Gujarat Grid',
        location: customLocation || 'Manual Gujarat Location',
        location_desc: 'Custom Admin Deployed Sensor',
        latitude: 23.0063,
        longitude: 72.6026,
        gps: customGps,
        connection: connectionType,
        battery_pct: batteryPct,
      })
    } else {
      onAdd({
        type: sensorType,
        name: customName || `Sensor (${currentHotspot.city} - ${sensorType.split('/')[0].trim()})`,
        city: currentHotspot.city,
        location: customLocation || currentHotspot.name,
        location_desc: currentHotspot.ai_rationale,
        latitude: currentHotspot.lat,
        longitude: currentHotspot.lng,
        gps: currentHotspot.gps,
        connection: connectionType,
        battery_pct: batteryPct,
      })
    }
    onClose()
  }

  const handleGoToMapPicker = () => {
    onClose()
    navigate(`/map?place=true&type=${encodeURIComponent(sensorType)}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-6 w-full max-w-2xl shadow-2xl text-[#EDEDE9] font-mono max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b border-[#2D3B2F] pb-3">
          <div>
            <h3 className="font-bold text-base text-[#EDEDE9] flex items-center gap-2">
              <span>🛠️</span> Deploy Environmental Sensor
            </h3>
            <p className="text-xs text-[#6B7280]">Select from 6 sensor types • AI hotspots or Click directly on map</p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#EDEDE9] text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. All 6 Sensor Options in a clean responsive grid */}
          <div>
            <label className="text-[#D97706] font-bold block mb-1.5 uppercase flex justify-between">
              <span>1. Select Sensor Type (6 Options)</span>
              <span className="text-[10px] text-[#6B7280] lowercase">active: {sensorType.split('/')[0].trim()}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SENSOR_TYPES.map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => {
                    setSensorType(item.type)
                    const found = aiHotspots.find((h) => {
                      if (item.type.includes('Water')) return h.recommended_for === 'water'
                      if (item.type.includes('Air')) return h.recommended_for === 'air'
                      if (item.type.includes('Thermal') || item.type.includes('Fire')) return h.recommended_for === 'fire'
                      if (item.type.includes('Temperature')) return h.recommended_for === 'temperature'
                      if (item.type.includes('Humidity')) return h.recommended_for === 'humidity'
                      if (item.type.includes('Gas')) return h.recommended_for === 'gas'
                      return true
                    })
                    if (found) setSelectedHotspot(found)
                  }}
                  className={clsx(
                    'p-2.5 rounded-xl border text-left transition-all relative overflow-hidden',
                    sensorType === item.type
                      ? 'bg-[#14532D] text-[#EDEDE9] border-[#D97706] font-bold ring-1 ring-[#D97706]'
                      : 'bg-[#141A16] text-[#6B7280] border-[#2D3B2F] hover:text-[#EDEDE9] hover:border-[#6B7280]'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#EDEDE9]">{item.label}</span>
                    <span
                      className="text-[9px] px-1 py-0.2 rounded font-mono"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6B7280] leading-tight line-clamp-2">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Deployment Method Switch (AI Hotspots vs Manual Interactive Map) */}
          <div>
            <label className="text-[#22C55E] font-bold block mb-1.5 uppercase flex justify-between">
              <span>2. Placement Method</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPlacementTab('ai')}
                className={clsx(
                  'py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  placementTab === 'ai'
                    ? 'bg-[#14532D] text-[#D97706] border-[#D97706]'
                    : 'bg-[#141A16] text-[#6B7280] border-[#2D3B2F] hover:text-[#EDEDE9]'
                )}
              >
                <span>💡</span> AI Suggested Vulnerable Zones
              </button>
              <button
                type="button"
                onClick={() => setPlacementTab('manual')}
                className={clsx(
                  'py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  placementTab === 'manual'
                    ? 'bg-[#14532D] text-[#D97706] border-[#D97706]'
                    : 'bg-[#141A16] text-[#6B7280] border-[#2D3B2F] hover:text-[#EDEDE9]'
                )}
              >
                <span>📍</span> Manual Placement (Map / Lake)
              </button>
            </div>

            {/* AI Hotspots List */}
            {placementTab === 'ai' && (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 bg-[#141A16] p-2 rounded-xl border border-[#2D3B2F]">
                {matchingHotspots.length === 0 ? (
                  <p className="text-[11px] text-[#6B7280] p-2 text-center">No preset hotspots for this filter. Use Manual Placement.</p>
                ) : (
                  matchingHotspots.map((hotspot) => (
                    <div
                      key={hotspot.id}
                      onClick={() => setSelectedHotspot(hotspot)}
                      className={clsx(
                        'p-2 rounded-lg border cursor-pointer text-xs transition-all',
                        (selectedHotspot?.id || currentHotspot?.id) === hotspot.id
                          ? 'bg-[#0B3820] border-[#22C55E] text-[#EDEDE9]'
                          : 'bg-[#1F2921] border-[#2D3B2F] text-[#6B7280] hover:border-[#6B7280]'
                      )}
                    >
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#EDEDE9]">{hotspot.name}</span>
                        <span className="text-[#D97706] text-[10px]">{hotspot.city}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans mt-0.5">{hotspot.ai_rationale}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Manual Placement Interactive Map Picker Button */}
            {placementTab === 'manual' && (
              <div className="bg-[#141A16] p-4 rounded-xl border border-[#2D3B2F] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#EDEDE9] flex items-center gap-1.5">
                      <span>🗺️</span> Pick Exact Lake or Area on Live Map
                    </h4>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Click directly on Kankaria Lake, Chandola Lake, Vastrapur Lake, Sabarmati, or any custom coordinate in Gujarat.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToMapPicker}
                  className="w-full py-2.5 bg-[#D97706] hover:bg-[#b45309] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
                >
                  <span>📍</span> Open Live Gujarat Map to Click & Install
                </button>

                <div className="pt-2 border-t border-[#2D3B2F] grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#6B7280] block mb-1">Custom Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Kankaria Lake South Pier"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-[#1F2921] border border-[#2D3B2F] rounded-lg p-1.5 text-[#EDEDE9]"
                    />
                  </div>
                  <div>
                    <label className="text-[#6B7280] block mb-1">Area / Waterbody Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kankaria Lake Catchment"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full bg-[#1F2921] border border-[#2D3B2F] rounded-lg p-1.5 text-[#EDEDE9]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pull-down for Advanced Hardware Specs with Smooth Animation */}
          <div className="border-t border-[#2D3B2F] pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-[#D97706] hover:text-white transition-colors flex items-center gap-1.5 font-mono"
            >
              <span>{showAdvanced ? 'Hide Advanced Telemetry Options' : 'Pull Down Network & Power Specs'}</span>
              <span className={clsx('pulldown-chevron text-[9px]', showAdvanced && 'open')}>▼</span>
            </button>

            <div className={clsx('pulldown-wrapper', showAdvanced && 'open')}>
              <div className="pulldown-content">
                <div className="grid grid-cols-2 gap-3 pt-2 animate-pulldown">
                  <div>
                    <label className="text-[#6B7280] block mb-1">Telemetry Protocol</label>
                    <input
                      type="text"
                      value={connectionType}
                      onChange={(e) => setConnectionType(e.target.value)}
                      className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-1.5 text-[#EDEDE9]"
                    />
                  </div>
                  <div>
                    <label className="text-[#6B7280] block mb-1">Initial Battery (%)</label>
                    <input
                      type="number"
                      value={batteryPct}
                      onChange={(e) => setBatteryPct(parseInt(e.target.value) || 100)}
                      className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-1.5 text-[#EDEDE9]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-bold py-2.5 rounded-xl border border-[#2D3B2F] transition-colors shadow-md"
            >
              ✓ Confirm & Deploy {sensorType.split('/')[0].trim()} Sensor
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 bg-[#141A16] hover:bg-[#2D3B2F] text-[#6B7280] rounded-xl border border-[#2D3B2F]"
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
  const navigate = useNavigate()
  const nodes = useStore((s) => s.nodes)
  const alerts = useStore((s) => s.alerts)
  const addSensor = useStore((s) => s.addSensor)

  const [modalType, setModalType] = useState(null)

  // ─── Collapsible Pull-Down States for Clean UI ──────────────────────────────
  const [showFullTelemetry, setShowFullTelemetry] = useState(false)
  const [showSimulationDrawer, setShowSimulationDrawer] = useState(false)
  const [expandedRowId, setExpandedRowId] = useState(null)
  const [showAllSensors, setShowAllSensors] = useState(false)

  const activeAlerts = alerts.filter((a) => !a.acknowledged)
  const onlineCount = nodes.filter((n) => n.status === 'online').length
  const offlineCount = nodes.filter((n) => n.status === 'offline').length

  const maxRisk = Math.max(0, ...nodes.map((n) => Math.max(n.risk_flood ?? 0, n.risk_fire ?? 0, n.risk_pollution ?? 0)))
  const systemStatus = maxRisk >= 70
    ? { text: 'CRITICAL', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/20 border-[#EF4444]', dot: 'bg-[#EF4444]' }
    : maxRisk >= 40
    ? { text: 'WARNING', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/20 border-[#F59E0B]', dot: 'bg-[#F59E0B]' }
    : { text: 'NORMAL', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/20 border-[#22C55E]', dot: 'bg-[#22C55E]' }

  const avgTemp = (nodes.reduce((acc, n) => acc + (n.temperature_c || 28), 0) / nodes.length).toFixed(1)
  const avgHumidity = Math.round(nodes.reduce((acc, n) => acc + (n.humidity_pct || 65), 0) / nodes.length)
  const peakAqi = Math.max(...nodes.map((n) => n.smoke_aqi || 30)).toFixed(0)
  const peakWater = (Math.max(...nodes.map((n) => n.water_level_cm || 20)) / 100).toFixed(2)
  const anyFlame = nodes.some((n) => n.flame_detected)

  const displayedNodes = showAllSensors ? nodes : nodes.slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5 bg-[#141A16] text-[#EDEDE9]">
      {/* ─── 1. Header: Clean Single-Row Title + Status + Action ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1F2921] border border-[#2D3B2F] px-5 py-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🌍</span>
          <div>
            <h1 className="text-xl font-bold text-[#EDEDE9]">
              EcoMonitor <span className="text-[#D97706]">Dashboard</span>
            </h1>
            <p className="text-[11px] text-[#6B7280] font-mono">
              Gandhinagar & Ahmedabad Sensor Grid • GSDMA Linked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs', systemStatus.bg)}>
            <div className={clsx('w-2 h-2 rounded-full animate-pulse', systemStatus.dot)} />
            <span className={clsx('font-bold', systemStatus.color)}>{systemStatus.text}</span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => setModalType('Water Level / Flood')}
            className="text-xs bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-bold px-3 py-1.5 rounded-xl border border-[#2D3B2F] font-mono transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+</span> Deploy Sensor
          </button>
        </div>
      </div>

      {/* ─── 2. Top KPI Strip (Clean & Compact) ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-xl px-4 py-3 shadow-sm font-mono flex items-center justify-between">
          <div>
            <div className="text-[#6B7280] text-[11px]">Total Sensors</div>
            <div className="text-2xl font-bold text-[#EDEDE9]">{nodes.length}</div>
          </div>
          <span className="text-lg text-[#6B7280]">📡</span>
        </div>

        <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-xl px-4 py-3 shadow-sm font-mono flex items-center justify-between">
          <div>
            <div className="text-[#6B7280] text-[11px]">Online (Mesh)</div>
            <div className="text-2xl font-bold text-[#22C55E]">{onlineCount}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
        </div>

        <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-xl px-4 py-3 shadow-sm font-mono flex items-center justify-between">
          <div>
            <div className="text-[#6B7280] text-[11px]">Offline</div>
            <div className="text-2xl font-bold text-[#9CA3AF]">{offlineCount}</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
        </div>

        <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-xl px-4 py-3 shadow-sm font-mono flex items-center justify-between">
          <div>
            <div className="text-[#6B7280] text-[11px]">Active Alerts</div>
            <div className={clsx('text-2xl font-bold', activeAlerts.length ? 'text-[#EF4444]' : 'text-[#22C55E]')}>
              {activeAlerts.length}
            </div>
          </div>
          <Link to="/alerts" className="text-xs text-[#D97706] hover:underline">
            View →
          </Link>
        </div>
      </div>

      {/* ─── 3. Environmental Telemetry with Pull-Down Toggle ───────────── */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#EDEDE9] uppercase font-mono tracking-wide">
              Live Environment Readings
            </span>
            <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/30 font-mono">
              Live Stream
            </span>
          </div>

          {/* Pull-down toggle button */}
          <button
            onClick={() => setShowFullTelemetry(!showFullTelemetry)}
            className="text-xs text-[#D97706] hover:text-white font-mono flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded hover:bg-[#141A16]"
          >
            <span>{showFullTelemetry ? 'Hide Extra Telemetry' : 'Pull Down Full Telemetry'}</span>
            <span className={clsx('pulldown-chevron text-[10px]', showFullTelemetry && 'open')}>▼</span>
          </button>
        </div>

        {/* Primary 3 Essential Cards (Minimal by default) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Water */}
          <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3.5 flex items-center justify-between font-mono">
            <div>
              <div className="text-xs text-[#6B7280]">🌊 Water Level</div>
              <div className="text-2xl font-bold text-[#0D9488]">{peakWater} m</div>
              <div className="text-[10px] text-[#6B7280]">Sant Sarovar Dam (GNR)</div>
            </div>
            <span className="text-xs text-[#0D9488] font-bold">Sabarmati</span>
          </div>

          {/* Air */}
          <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3.5 flex items-center justify-between font-mono">
            <div>
              <div className="text-xs text-[#6B7280]">🌫 Air Quality (AQI)</div>
              <div className="text-2xl font-bold text-[#8B5CF6]">{peakAqi}</div>
              <div className="text-[10px] text-[#6B7280]">Narol-Vatva Cluster (AHD)</div>
            </div>
            <span className={clsx('text-xs font-bold', peakAqi > 100 ? 'text-[#EF4444]' : 'text-[#22C55E]')}>
              {peakAqi > 100 ? 'Unhealthy' : 'Safe'}
            </span>
          </div>

          {/* Fire */}
          <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3.5 flex items-center justify-between font-mono">
            <div>
              <div className="text-xs text-[#6B7280]">🔥 Forest Fire / Flame</div>
              <div className={clsx('text-xl font-bold', anyFlame ? 'text-[#EF4444]' : 'text-[#22C55E]')}>
                {anyFlame ? 'ACTIVE FLAME' : 'SAFE (Normal)'}
              </div>
              <div className="text-[10px] text-[#6B7280]">Indroda Forest Park</div>
            </div>
            <span className="text-xs text-[#F97316]">IR Sensor</span>
          </div>
        </div>

        {/* Pull-Down Additional Information with Smooth Scroll/Accordion Animation */}
        <div className={clsx('pulldown-wrapper', showFullTelemetry && 'open')}>
          <div className="pulldown-content">
            <div className="pt-3 border-t border-[#2D3B2F] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulldown font-mono">
              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3">
                <div className="text-xs text-[#6B7280] mb-0.5">🌡 Mean Temperature</div>
                <div className="text-lg font-bold text-[#D97706]">{avgTemp}°C</div>
                <div className="text-[10px] text-[#6B7280]">Statewide Sensor Average</div>
              </div>

              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3">
                <div className="text-xs text-[#6B7280] mb-0.5">💧 Relative Humidity</div>
                <div className="text-lg font-bold text-[#22C55E]">{avgHumidity}%</div>
                <div className="text-[10px] text-[#6B7280]">Atmospheric Saturation</div>
              </div>

              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3">
                <div className="text-xs text-[#6B7280] mb-0.5">☁️ Volatile Organic Gas</div>
                <div className="text-lg font-bold text-[#8B5CF6]">48 ppm</div>
                <div className="text-[10px] text-[#6B7280]">MQ-135 Chemical Gas Cell</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Collapsible Simulation Drawer with Pull-Down Animation ─────── */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-4 shadow-sm font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-bold text-[#EDEDE9]">
              Live Scenario Simulation & Emergency Dispatcher
            </span>
          </div>

          <button
            onClick={() => setShowSimulationDrawer(!showSimulationDrawer)}
            className="text-xs text-[#D97706] hover:text-white font-mono flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded hover:bg-[#141A16]"
          >
            <span>{showSimulationDrawer ? 'Close Testing Drawer' : 'Pull Down Test Controls'}</span>
            <span className={clsx('pulldown-chevron text-[10px]', showSimulationDrawer && 'open')}>▼</span>
          </button>
        </div>

        {/* Pull-Down Drawer Content with Smooth Grid Accordion */}
        <div className={clsx('pulldown-wrapper', showSimulationDrawer && 'open')}>
          <div className="pulldown-content">
            <div className="pt-3 mt-2 border-t border-[#2D3B2F] animate-pulldown">
              <ScenarioRunner />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. Installed Sensors Table with Pull-Down Details ────────────── */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-4 shadow-sm space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#EDEDE9] uppercase tracking-wide">
              Installed Environmental Sensors
            </h2>
            <p className="text-[11px] text-[#6B7280]">Active IoT grid in Gujarat</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllSensors(!showAllSensors)}
              className="text-xs text-[#D97706] hover:text-white transition-colors px-2.5 py-1 rounded hover:bg-[#141A16] flex items-center gap-1.5"
            >
              <span>{showAllSensors ? 'Show Fewer' : `Pull Down All (${nodes.length})`}</span>
              <span className={clsx('pulldown-chevron text-[10px]', showAllSensors && 'open')}>▼</span>
            </button>
          </div>
        </div>

        {/* Streamlined Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141A16] text-[#6B7280] border-b border-[#2D3B2F]">
              <tr>
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">Battery</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3B2F]/60">
              {displayedNodes.map((node) => {
                const nodeMax = Math.max(node.risk_flood ?? 0, node.risk_fire ?? 0, node.risk_pollution ?? 0)
                const statusColor = nodeMax >= 70 ? 'text-[#EF4444]' : nodeMax >= 40 ? 'text-[#F59E0B]' : 'text-[#22C55E]'
                const statusText = nodeMax >= 70 ? '🔴 Danger' : nodeMax >= 40 ? '🟡 Watch' : '🟢 Safe'
                const isExpanded = expandedRowId === node.node_id

                return (
                  <tr key={node.node_id} className="hover:bg-[#141A16]/50 transition-colors">
                    <td className="p-2.5 font-bold text-[#EDEDE9]">{node.node_id}</td>
                    <td className="p-2.5 text-[#6B7280]">{node.type?.split('/')[0] || 'Sensor'}</td>
                    <td className="p-2.5 text-[#EDEDE9] truncate max-w-xs">{node.location}</td>
                    <td className="p-2.5 text-[#22C55E]">{node.battery_pct}%</td>
                    <td className={clsx('p-2.5 font-bold', statusColor)}>{statusText}</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => setExpandedRowId(isExpanded ? null : node.node_id)}
                        className="text-[11px] text-[#D97706] hover:underline flex items-center justify-end gap-1 ml-auto"
                      >
                        <span>{isExpanded ? 'Less' : 'Pull Down'}</span>
                        <span className={clsx('pulldown-chevron text-[9px]', isExpanded && 'open')}>▼</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Expanded Pull-Down Row Card with Smooth Animation */}
        <div className={clsx('pulldown-wrapper', expandedRowId && 'open')}>
          <div className="pulldown-content">
            {expandedRowId && (() => {
              const item = nodes.find((n) => n.node_id === expandedRowId)
              if (!item) return null
              return (
                <div className="p-3.5 bg-[#141A16] border border-[#2D3B2F] rounded-xl text-xs space-y-2 animate-pulldown mt-2">
                  <div className="flex justify-between items-center border-b border-[#2D3B2F] pb-1.5 mb-2 font-bold text-[#D97706]">
                    <span>Sensor {item.node_id} Specifications:</span>
                    <button onClick={() => navigate(`/nodes/${item.node_id}`)} className="text-[11px] underline text-[#22C55E]">
                      Full Telemetry Page →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#EDEDE9]">
                    <div><span className="text-[#6B7280]">GPS:</span> {item.gps || `${item.latitude}, ${item.longitude}`}</div>
                    <div><span className="text-[#6B7280]">Connection:</span> {item.connection || 'LoRa Mesh'}</div>
                    <div><span className="text-[#6B7280]">Last Ping:</span> {item.last_update || 'Just now'}</div>
                    <div><span className="text-[#6B7280]">Power:</span> {item.solar_charging ? '☀️ Solar 5W' : '🔋 Li-Ion'}</div>
                  </div>
                  <div className="text-[11px] text-slate-300 font-sans mt-2 pt-1 border-t border-[#2D3B2F]">
                    <span className="text-[#6B7280] font-mono">Deployment Notes:</span> {item.location_desc}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {modalType && (
        <AddSensorModal
          defaultType={modalType}
          onClose={() => setModalType(null)}
          onAdd={addSensor}
        />
      )}
    </div>
  )
}
