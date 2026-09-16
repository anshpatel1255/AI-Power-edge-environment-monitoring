// pages/MapPage.jsx — Geographic Environmental Monitoring Map + Interactive Lake & Area Sensor Placement

import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore, SENSOR_TYPES, detectGujaratLandmark } from '../store/useStore'
import RiskMap from '../components/map/RiskMap'
import ScenarioRunner from '../components/demo/ScenarioRunner'
import clsx from 'clsx'

// ─── Modal for Deploying Sensor at Clicked Map Coordinates ────────────────────
function ConfirmMapDeploymentModal({
  point,
  defaultType,
  onClose,
  onConfirm,
}) {
  const [sensorType, setSensorType] = useState(defaultType || 'Water Level / Flood')
  const detected = detectGujaratLandmark(point.lat, point.lng)

  const defaultName = detected.isLake
    ? `${detected.name.split(',')[0]} ${sensorType.split('/')[0].trim()} Sentinel`
    : detected.isNearby
    ? `${detected.name.split(',')[0]} Sensor`
    : `Custom Sensor (${point.lat.toFixed(3)}, ${point.lng.toFixed(3)})`

  const [sensorName, setSensorName] = useState(defaultName)
  const [locationName, setLocationName] = useState(detected.name)
  const [connectionType, setConnectionType] = useState('LoRa Mesh (GPS Auto-Sync)')
  const [notes, setNotes] = useState(
    detected.isLake
      ? `Real-time lake catchment monitoring & overflow telemetry tracking.`
      : `Admin-deployed IoT node with live GPS uplink.`
  )
  const [batteryPct, setBatteryPct] = useState(100)

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({
      name: sensorName,
      type: sensorType,
      city: detected.name.includes('Ahmedabad') ? 'Ahmedabad' : detected.name.includes('Gandhinagar') ? 'Gandhinagar' : 'Gujarat Grid',
      location: locationName,
      location_desc: notes,
      latitude: point.lat,
      longitude: point.lng,
      gps: `${point.lat.toFixed(4)}° N, ${point.lng.toFixed(4)}° E`,
      connection: connectionType,
      battery_pct: batteryPct,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-6 w-full max-w-lg shadow-2xl text-[#EDEDE9] font-mono text-xs animate-fade-in">
        <div className="flex justify-between items-center mb-4 border-b border-[#2D3B2F] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#EDEDE9] flex items-center gap-2">
              <span>📍</span> Deploy Sensor at Clicked Location
            </h3>
            <p className="text-[11px] text-[#6B7280]">Live GPS coordinates detected on Gujarat map</p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#EDEDE9] text-base">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Detected GPS & Lake Banner */}
          <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#6B7280]">GPS Coordinates:</span>
              <span className="text-[#D97706] font-bold">
                {point.lat.toFixed(4)}° N, {point.lng.toFixed(4)}° E
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#6B7280]">Target Zone:</span>
              <span className={clsx('font-bold', detected.isLake ? 'text-[#0D9488]' : 'text-[#22C55E]')}>
                {detected.isLake ? '🌊 ' : '📍 '}{detected.distanceText}
              </span>
            </div>
          </div>

          {/* 1. Sensor Type Selector (all 6 options) */}
          <div>
            <label className="text-[#D97706] font-bold block mb-1.5 uppercase">
              Sensor Type (Select from 6)
            </label>
            <select
              value={sensorType}
              onChange={(e) => {
                const nextType = e.target.value
                setSensorType(nextType)
                if (detected.isLake) {
                  setSensorName(`${detected.name.split(',')[0]} ${nextType.split('/')[0].trim()} Sentinel`)
                }
              }}
              className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-2 text-[#EDEDE9] font-mono focus:border-[#D97706] focus:outline-none"
            >
              {SENSOR_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label} — {t.desc}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Sensor Name */}
          <div>
            <label className="text-[#6B7280] block mb-1">Sensor Identifier / Name</label>
            <input
              type="text"
              value={sensorName}
              onChange={(e) => setSensorName(e.target.value)}
              className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-2 text-[#EDEDE9]"
              required
            />
          </div>

          {/* 3. Location / Lake Reference */}
          <div>
            <label className="text-[#6B7280] block mb-1">Location / Lake Reference</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-2 text-[#EDEDE9]"
              required
            />
          </div>

          {/* 4. Notes / Rationale */}
          <div>
            <label className="text-[#6B7280] block mb-1">Deployment Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-2 text-[#EDEDE9] text-xs resize-none"
            />
          </div>

          {/* 5. Telemetry & Battery */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[#6B7280] block mb-1">Connection Uplink</label>
              <input
                type="text"
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value)}
                className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-1.5 text-[#EDEDE9]"
              />
            </div>
            <div>
              <label className="text-[#6B7280] block mb-1">Battery Level (%)</label>
              <input
                type="number"
                value={batteryPct}
                onChange={(e) => setBatteryPct(parseInt(e.target.value) || 100)}
                className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-1.5 text-[#EDEDE9]"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-bold py-2.5 rounded-xl border border-[#2D3B2F] transition-colors shadow-md text-xs"
            >
              ✓ Deploy & Start Tracking Live
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

// ─── Main MapPage Component ──────────────────────────────────────────────────
export default function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const nodes = useStore((s) => s.nodes)
  const addSensor = useStore((s) => s.addSensor)

  const [selectedId, setSelectedId] = useState('S-001')
  const [placementMode, setPlacementMode] = useState(false)
  const [selectedSensorType, setSelectedSensorType] = useState('Water Level / Flood')
  const [pendingPoint, setPendingPoint] = useState(null)
  const [deployedNotification, setDeployedNotification] = useState(null)
  const [showInspectorExtra, setShowInspectorExtra] = useState(false)

  // Initialize placement mode if navigated with ?place=true&type=...
  useEffect(() => {
    if (searchParams.get('place') === 'true') {
      setPlacementMode(true)
      const typeParam = searchParams.get('type')
      if (typeParam) setSelectedSensorType(typeParam)
    }
  }, [searchParams])

  const selectedNode = nodes.find((n) => n.node_id === selectedId) || nodes[0]

  const maxRisk = selectedNode
    ? Math.max(selectedNode.risk_flood ?? 0, selectedNode.risk_fire ?? 0, selectedNode.risk_pollution ?? 0)
    : 0

  const statusBadge = maxRisk >= 70
    ? { label: '🔴 Critical Danger', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/20 border-[#EF4444]' }
    : maxRisk >= 40
    ? { label: '🟡 Warning / Watch', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/20 border-[#F59E0B]' }
    : { label: '🟢 Normal / Safe', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/20 border-[#22C55E]' }

  // User clicked on map
  const handleMapClick = (lat, lng) => {
    setPendingPoint({ lat, lng })
  }

  // Confirming deployment at clicked location
  const handleConfirmDeploy = (newSensorData) => {
    const nextId = `S-00${nodes.length + 1}`
    addSensor({
      ...newSensorData,
      node_id: nextId,
    })

    setSelectedId(nextId)
    setPendingPoint(null)
    setPlacementMode(false)
    setSearchParams({})

    setDeployedNotification(
      `✓ Sensor ${nextId} (${newSensorData.type.split('/')[0].trim()}) deployed at ${newSensorData.location}! Live telemetry active.`
    )
    setTimeout(() => setDeployedNotification(null), 6000)
  }

  const handleCancelPlacement = () => {
    setPlacementMode(false)
    setPendingPoint(null)
    setSearchParams({})
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#141A16] text-[#EDEDE9]">
      {/* Top Banner: Scenario Trigger & Notification */}
      <div className="bg-[#1F2921] border-b border-[#2D3B2F] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1">
          <ScenarioRunner />
        </div>

        {/* Deploy on Map Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlacementMode(!placementMode)}
            className={clsx(
              'text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shadow-sm',
              placementMode
                ? 'bg-[#D97706] text-white border-[#D97706]'
                : 'bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] border-[#2D3B2F]'
            )}
          >
            <span>📍</span>
            <span>{placementMode ? 'Exit Placement Mode' : '+ Place Sensor on Map / Lake'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Placement Mode Helper Banner */}
      {placementMode && (
        <div className="bg-[#0B3820] border-b border-[#D97706] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base animate-pulse">📍</span>
            <span className="font-bold text-[#D97706]">INTERACTIVE SENSOR PLACEMENT ACTIVE:</span>
            <span className="text-[#EDEDE9]">
              Click anywhere on Gujarat map (e.g. click directly on <b>Kankaria Lake</b>, <b>Chandola Lake</b>, <b>Thol Lake</b>, <b>Sabarmati</b>, or any area) to drop and track your sensor.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">Type:</span>
            <select
              value={selectedSensorType}
              onChange={(e) => setSelectedSensorType(e.target.value)}
              className="bg-[#141A16] text-[#EDEDE9] border border-[#2D3B2F] rounded-lg px-2 py-1 text-xs font-mono"
            >
              {SENSOR_TYPES.map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>

            <button
              onClick={handleCancelPlacement}
              className="px-2.5 py-1 bg-[#141A16] hover:bg-[#EF4444]/20 text-[#EF4444] rounded-lg border border-[#2D3B2F] text-[11px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Deployment Success Toast */}
      {deployedNotification && (
        <div className="bg-[#22C55E]/20 border-b border-[#22C55E] px-4 py-1.5 text-xs text-[#22C55E] font-mono flex items-center justify-between animate-fade-in">
          <span>{deployedNotification}</span>
          <button onClick={() => setDeployedNotification(null)} className="text-[#22C55E] font-bold text-sm">✕</button>
        </div>
      )}

      {/* Main Map Viewport with Sensor Detail Floating Inspector */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Full Leaflet Map */}
        <div className="flex-1 h-full relative">
          <RiskMap
            nodes={nodes}
            selectedNodeId={selectedId}
            height="100%"
            onMapClick={handleMapClick}
            placementMode={placementMode}
            pendingPoint={pendingPoint}
          />
        </div>

        {/* Right Side / Overlay Panel: Sensor Inspection Card */}
        <aside className="w-full md:w-80 bg-[#1F2921] border-l border-[#2D3B2F] p-4 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between border-b border-[#2D3B2F] pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#EDEDE9] uppercase flex items-center gap-1.5">
                  <span>🗺️</span> Geographic Inspector
                </h2>
                <p className="text-[11px] text-[#6B7280]">Select sensor or click map to inspect</p>
              </div>
              <span className="text-[10px] text-[#D97706] bg-[#141A16] px-2 py-0.5 rounded border border-[#2D3B2F]">
                {nodes.length} Nodes
              </span>
            </div>

            {/* Quick sensor selector pills */}
            <div className="grid grid-cols-3 gap-1 mb-3.5 max-h-24 overflow-y-auto pr-0.5">
              {nodes.map((n) => (
                <button
                  key={n.node_id}
                  onClick={() => setSelectedId(n.node_id)}
                  className={clsx(
                    'text-[11px] py-1 px-1.5 rounded-lg border transition-all text-center truncate',
                    selectedId === n.node_id
                      ? 'bg-[#14532D] text-[#D97706] border-[#D97706] font-bold'
                      : 'bg-[#141A16] text-[#6B7280] border-[#2D3B2F] hover:text-[#EDEDE9]'
                  )}
                >
                  {n.node_id}
                </button>
              ))}
            </div>

            {/* Detailed Sensor Card */}
            {selectedNode && (
              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3.5 shadow-inner space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#2D3B2F] pb-2">
                  <div>
                    <div className="font-bold text-xs text-[#EDEDE9] truncate max-w-[170px]">{selectedNode.name}</div>
                    <div className="text-[10px] text-[#D97706]">{selectedNode.type?.split('/')[0] || 'Sensor'}</div>
                  </div>
                  <span className="text-[10px] text-[#6B7280] bg-[#1F2921] px-1.5 py-0.5 rounded">{selectedNode.node_id}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-[#2D3B2F]/40">
                    <span className="text-[#6B7280]">🌊 Water Level:</span>
                    <span className="text-[#0D9488] font-bold">
                      {((selectedNode.water_level_cm || 20) / 100).toFixed(2)} m
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-[#2D3B2F]/40">
                    <span className="text-[#6B7280]">🌫 Air AQI:</span>
                    <span className="text-[#8B5CF6] font-bold">
                      {selectedNode.smoke_aqi?.toFixed(0) ?? 32}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-[#2D3B2F]/40">
                    <span className="text-[#6B7280]">🔥 Thermal / Flame:</span>
                    <span className={selectedNode.flame_detected ? 'text-[#EF4444] font-bold' : 'text-[#22C55E]'}>
                      {selectedNode.flame_detected ? 'ACTIVE FLAME' : 'Safe'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-[#2D3B2F]/40">
                    <span className="text-[#6B7280]">Status:</span>
                    <span className={clsx('font-bold', statusBadge.color)}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Pull-down for Extra Hardware & GPS Specs with Smooth Animation */}
                <div className="pt-1 border-t border-[#2D3B2F]">
                  <button
                    onClick={() => setShowInspectorExtra(!showInspectorExtra)}
                    className="text-[10px] text-[#D97706] hover:underline flex items-center justify-between w-full font-mono py-0.5"
                  >
                    <span>{showInspectorExtra ? 'Hide Extra Specs' : 'Pull Down GPS & Telemetry'}</span>
                    <span className={clsx('pulldown-chevron text-[9px]', showInspectorExtra && 'open')}>▼</span>
                  </button>

                  <div className={clsx('pulldown-wrapper', showInspectorExtra && 'open')}>
                    <div className="pulldown-content">
                      <div className="mt-2 space-y-1 text-[11px] animate-pulldown">
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Temperature:</span>
                          <span className="text-[#D97706]">{selectedNode.temperature_c?.toFixed(1) ?? 28.0}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Humidity:</span>
                          <span className="text-[#22C55E]">{selectedNode.humidity_pct ?? 64}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">Battery:</span>
                          <span className="text-[#22C55E]">{selectedNode.battery_pct}% {selectedNode.solar_charging ? '☀️' : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B7280]">GPS:</span>
                          <span className="text-[#EDEDE9]">{selectedNode.gps}</span>
                        </div>
                        <div className="pt-1 text-[10px] text-slate-300 font-sans">
                          {selectedNode.location_desc}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#2D3B2F] space-y-2">
            <Link
              to={`/nodes/${selectedNode?.node_id}`}
              className="w-full block text-center text-xs bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-bold py-2 rounded-xl border border-[#2D3B2F] transition-colors shadow-sm"
            >
              Inspect Full Telemetry Charts →
            </Link>
          </div>
        </aside>
      </div>

      {/* Modal when user clicks map coordinates to confirm deployment */}
      {pendingPoint && (
        <ConfirmMapDeploymentModal
          point={pendingPoint}
          defaultType={selectedSensorType}
          onClose={() => setPendingPoint(null)}
          onConfirm={handleConfirmDeploy}
        />
      )}
    </div>
  )
}
