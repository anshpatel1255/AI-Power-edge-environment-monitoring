// components/map/RiskMap.jsx — Gujarat Live Map (Gandhinagar, Ahmedabad, Surat, Vadodara) + AI Placement Suggestions

import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import 'leaflet/dist/leaflet.css'

// Default center: Between Gandhinagar and Ahmedabad (Gujarat)
const GUJARAT_CENTER = [23.12, 72.62]
const DEFAULT_ZOOM   = 11

const REGION_PRESETS = [
  { name: '🏛️ Gandhinagar', center: [23.22, 72.65], zoom: 13 },
  { name: '🏙️ Ahmedabad',   center: [23.03, 72.58], zoom: 13 },
  { name: '🏭 Surat',       center: [21.19, 72.83], zoom: 12 },
  { name: '⚙️ Vadodara',    center: [22.38, 73.12], zoom: 12 },
  { name: '🗺️ Whole Gujarat', center: [22.70, 71.80], zoom: 8 },
]

function getRiskColor(node) {
  if (node.status === 'offline') return '#9CA3AF'
  const maxScore = Math.max(node.risk_flood ?? 0, node.risk_fire ?? 0, node.risk_pollution ?? 0)
  if (maxScore >= 70) return '#EF4444' // Critical
  if (maxScore >= 40) return '#F59E0B' // Warning
  return '#22C55E'                     // Safe
}

function getRiskLabel(score) {
  if (score >= 70) return { text: 'CRITICAL / DANGER', color: '#EF4444' }
  if (score >= 40) return { text: 'WARNING / ELEVATED', color: '#F59E0B' }
  return { text: 'SAFE / NORMAL', color: '#22C55E' }
}

function MapFlyTo({ center, zoom = 14 }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, zoom])
  return null
}

// Handler for user clicking on map to select coordinates for new sensor
function MapClickHandler({ onMapClick, placementMode }) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    if (placementMode) {
      container.style.cursor = 'crosshair'
    } else {
      container.style.cursor = ''
    }
  }, [placementMode, map])

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export default function RiskMap({
  nodes = [],
  selectedNodeId = null,
  height = '100%',
  onSelectHotspot = null,
  onMapClick = null,
  placementMode = false,
  pendingPoint = null,
}) {
  const navigate = useNavigate()
  const aiHotspots = useStore((s) => s.aiHotspots)
  const addSensor = useStore((s) => s.addSensor)

  const [showMesh, setShowMesh] = useState(true)
  const [showHotspots, setShowHotspots] = useState(true)
  const [flyTarget, setFlyTarget] = useState(null)

  const selected = nodes.find((n) => n.node_id === selectedNodeId)

  const nodeMap = {}
  nodes.forEach((n) => {
    nodeMap[n.node_id] = [n.latitude, n.longitude]
  })

  // LoRa Mesh links between Gujarat nodes & GSDMA Gateway
  const meshLinks = [
    { from: 'S-002', to: 'GW-001', label: 'Sant Sarovar Dam (GNR) -> GSDMA Command Hub (1.8km)' },
    { from: 'S-003', to: 'GW-001', label: 'Indroda Forest Park -> GSDMA Command Hub (2.4km)' },
    { from: 'S-001', to: 'GW-001', label: 'Narol Industrial (AHD) -> Regional Gateway Relay (5.8km)' },
  ]

  const handleQuickInstall = (hotspot) => {
    addSensor({
      node_id: `S-00${nodes.length + 1}`,
      name: `Sensor S-00${nodes.length + 1} (${hotspot.city})`,
      type: hotspot.sensor_type,
      location: hotspot.name,
      city: hotspot.city,
      latitude: hotspot.lat,
      longitude: hotspot.lng,
      connection: 'GPS + LoRa Mesh (Auto-Sync)',
      location_desc: hotspot.ai_rationale,
      battery_pct: 100,
    })
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={GUJARAT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height, width: '100%' }}
        className="z-0 rounded-b-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selected && <MapFlyTo center={[selected.latitude, selected.longitude]} zoom={14} />}
        {flyTarget && <MapFlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}

        <MapClickHandler onMapClick={onMapClick} placementMode={placementMode} />

        {/* ─── Pending Manual Placement Target Marker ───────────────────────── */}
        {pendingPoint && (
          <CircleMarker
            center={[pendingPoint.lat, pendingPoint.lng]}
            radius={15}
            pathOptions={{
              color: '#D97706',
              fillColor: '#D97706',
              fillOpacity: 0.65,
              weight: 3,
              dashArray: '3 3',
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]}>
              <div className="text-[10px] font-mono bg-[#0B3820] text-[#D97706] px-2 py-0.5 rounded border border-[#D97706] font-bold shadow-xl flex items-center gap-1">
                <span>📍</span> Clicked Target
              </div>
            </Tooltip>
          </CircleMarker>
        )}

        {/* ─── LoRa Mesh Links across Gujarat ─────────────────────────────── */}
        {showMesh && meshLinks.map((link, idx) => {
          const p1 = nodeMap[link.from]
          const p2 = nodeMap[link.to]
          if (!p1 || !p2) return null
          return (
            <Polyline
              key={`mesh-${idx}`}
              positions={[p1, p2]}
              pathOptions={{
                color: '#0D9488',
                weight: 2.5,
                dashArray: '5 7',
                opacity: 0.85,
              }}
            >
              <Tooltip sticky>
                <div className="text-[11px] font-mono bg-[#1F2921] text-[#EDEDE9] p-1.5 rounded border border-[#2D3B2F]">
                  <span className="text-[#D97706] font-bold">📡 Gujarat LoRa Mesh Link</span>
                  <div>{link.label}</div>
                </div>
              </Tooltip>
            </Polyline>
          )
        })}

        {/* ─── AI Sensor Placement Suggestion Hotspots ─────────────────────── */}
        {showHotspots && aiHotspots.map((hotspot) => (
          <CircleMarker
            key={hotspot.id}
            center={[hotspot.lat, hotspot.lng]}
            radius={9}
            pathOptions={{
              color: '#D97706',
              fillColor: '#D97706',
              fillOpacity: 0.35,
              weight: 2,
              dashArray: '4 4',
            }}
          >
            <Popup>
              <div className="min-w-[240px] font-mono text-xs text-[#EDEDE9] p-1">
                <div className="flex items-center gap-1.5 text-[#D97706] font-bold text-[11px] mb-1">
                  <span>💡</span> AI RECOMMENDED PLACEMENT
                </div>
                <div className="font-bold text-sm text-[#EDEDE9] mb-1">{hotspot.name}</div>
                <div className="text-[11px] text-[#22C55E] mb-1.5 font-semibold">
                  Recommended Sensor: {hotspot.sensor_type}
                </div>
                <div className="bg-[#141A16] p-2 rounded border border-[#2D3B2F] text-[10px] text-slate-300 font-sans mb-2.5">
                  {hotspot.ai_rationale}
                </div>
                <button
                  onClick={() => handleQuickInstall(hotspot)}
                  className="w-full py-1.5 bg-[#14532D] hover:bg-[#0B3820] text-[#D97706] font-bold rounded border border-[#D97706]/50 transition-colors shadow-sm"
                >
                  ✓ Install {hotspot.recommended_for.toUpperCase()} Sensor Here (1-Click)
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* ─── Active Installed Environmental Sensors ───────────────────────── */}
        {nodes.map((node) => {
          const pinColor = getRiskColor(node)
          const maxRisk = Math.max(node.risk_flood ?? 0, node.risk_fire ?? 0, node.risk_pollution ?? 0)
          const isSelected = node.node_id === selectedNodeId
          const isHigh = maxRisk >= 70
          const isGateway = node.is_gateway
          const riskInfo = getRiskLabel(maxRisk)

          return (
            <CircleMarker
              key={node.node_id}
              center={[node.latitude, node.longitude]}
              radius={isSelected ? 18 : isGateway ? 16 : isHigh ? 15 : 12}
              pathOptions={{
                color: isGateway ? '#D97706' : pinColor,
                fillColor: pinColor,
                fillOpacity: 0.85,
                weight: isGateway ? 4 : isSelected ? 3 : 2,
                dashArray: isHigh ? '3 3' : undefined,
              }}
            >
              <Popup>
                <div className="min-w-[220px] font-sans p-1 text-[#EDEDE9]">
                  <div className="flex items-center justify-between mb-1 font-mono">
                    <span className="font-bold text-sm text-[#EDEDE9]">{node.name}</span>
                    {isGateway ? (
                      <span className="bg-[#D97706]/20 text-[#D97706] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#D97706]/50">
                        GATEWAY
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#22C55E] font-bold">NODE</span>
                    )}
                  </div>
                  <div className="text-xs text-[#6B7280] mb-2 font-mono">
                    {node.city ? `${node.city} • ` : ''}{node.location_desc}
                  </div>

                  {/* 3 Metrics with Specific Hazard Accents */}
                  <div className="grid grid-cols-3 gap-1 mb-2.5 bg-[#141A16] p-2 rounded border border-[#2D3B2F] font-mono">
                    <div className="text-center">
                      <div className="text-[10px] text-[#6B7280]">💧 Water</div>
                      <div className="font-bold text-xs text-[#0D9488]">{node.risk_flood ?? 0}</div>
                    </div>
                    <div className="text-center border-x border-[#2D3B2F]">
                      <div className="text-[10px] text-[#6B7280]">🔥 Fire</div>
                      <div className="font-bold text-xs text-[#F97316]">{node.risk_fire ?? 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-[#6B7280]">☁️ AQI</div>
                      <div className="font-bold text-xs text-[#8B5CF6]">{node.risk_pollution ?? 0}</div>
                    </div>
                  </div>

                  {/* Telemetry info */}
                  <div className="text-xs space-y-1 mb-3 text-[#EDEDE9] font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Water Depth:</span>
                      <span className="text-[#0D9488] font-bold">{node.water_level_cm?.toFixed(1) ?? '--'} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Ambient Temp:</span>
                      <span>{node.temperature_c?.toFixed(1) ?? '--'} °C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Flame Status:</span>
                      <span className={node.flame_detected ? 'text-[#EF4444] font-bold' : 'text-[#22C55E]'}>
                        {node.flame_detected ? '🔥 ACTIVE FLAME' : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Battery / Power:</span>
                      <span className="text-[#22C55E]">{node.battery_pct ?? '--'}% {node.solar_charging ? '☀️' : ''}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-[#2D3B2F]">
                      <span className="text-[#6B7280]">Risk Status:</span>
                      <span className="font-bold text-[11px]" style={{ color: riskInfo.color }}>
                        {riskInfo.text}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/nodes/${node.node_id}`)}
                    className="w-full text-xs bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-semibold py-1.5 rounded transition-colors border border-[#2D3B2F] font-mono"
                  >
                    View Sensor Analytics →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* ─── Gujarat Region Quick-Jump Toolbar ────────────────────────────── */}
      <div className="absolute top-3 left-14 z-10 flex gap-1.5 flex-wrap font-mono text-xs">
        {REGION_PRESETS.map((r) => (
          <button
            key={r.name}
            onClick={() => setFlyTarget({ center: r.center, zoom: r.zoom })}
            className="bg-[#1F2921]/95 hover:bg-[#14532D] text-[#EDEDE9] hover:text-[#D97706] border border-[#2D3B2F] px-2.5 py-1 rounded-md shadow-md transition-colors font-medium"
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* ─── Top Right Controls: Mesh & AI Hotspots Toggles ────────────────── */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 font-mono text-xs">
        <div className="bg-[#1F2921]/95 border border-[#2D3B2F] rounded-lg px-3 py-1.5 shadow-md flex items-center gap-2 text-[#EDEDE9]">
          <input
            type="checkbox"
            id="meshToggle"
            checked={showMesh}
            onChange={(e) => setShowMesh(e.target.checked)}
            className="rounded text-[#0D9488] focus:ring-0 cursor-pointer"
          />
          <label htmlFor="meshToggle" className="cursor-pointer select-none">
            LoRa Mesh
          </label>
        </div>

        <div className="bg-[#1F2921]/95 border border-[#2D3B2F] rounded-lg px-3 py-1.5 shadow-md flex items-center gap-2 text-[#EDEDE9]">
          <input
            type="checkbox"
            id="hotspotsToggle"
            checked={showHotspots}
            onChange={(e) => setShowHotspots(e.target.checked)}
            className="rounded text-[#D97706] focus:ring-0 cursor-pointer"
          />
          <label htmlFor="hotspotsToggle" className="cursor-pointer select-none text-[#D97706] font-bold">
            💡 AI Placement Hotspots
          </label>
        </div>
      </div>
    </div>
  )
}
