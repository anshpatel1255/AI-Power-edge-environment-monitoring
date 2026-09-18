// components/map/RiskMap.jsx — Environmental Risk Map with Normal, Satellite & Night Modes
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SENSOR_CATEGORIES } from '../../store/useStore'
import clsx from 'clsx'
import 'leaflet/dist/leaflet.css'

const GUJARAT_CENTER = [23.12, 72.62]
const DEFAULT_ZOOM = 11

export const MAP_MODES = {
  normal: {
    id: 'normal',
    label: 'Normal Map',
    shortLabel: 'Normal',
    icon: '🗺️',
    description: 'High-detail OpenStreetMap with street, river and sector clarity',
    layers: [
      {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    ],
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    shortLabel: 'Satellite',
    icon: '🛰️',
    description: 'Real photorealistic satellite imagery with hybrid geographic labels',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
        maxZoom: 19,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        attribution: '',
        maxZoom: 19,
      },
    ],
  },
  night: {
    id: 'night',
    label: 'Night Mode',
    shortLabel: 'Night',
    icon: '🌙',
    description: 'Tactical dark mode canvas with high-contrast emergency visualization',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com">Esri</a>, HERE, Garmin',
        maxZoom: 16,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        attribution: '',
        maxZoom: 16,
      },
    ],
  },
}

function getSeverityColor(node) {
  if (node.status === 'offline') return '#94A3B8'
  if (node.severity === 'emergency' || node.risk_score >= 70) return '#EF4444' // Red
  if (node.severity === 'warning' || node.risk_score >= 50) return '#F97316'   // Amber-Orange
  if (node.severity === 'watch' || node.risk_score >= 35) return '#EAB308'     // Yellow
  return '#10B981' // Green (Advisory / Normal)
}

function MapFlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 12, { duration: 1.2 })
  }, [center, zoom])
  return null
}

function MapClickHandler({ onMapClick, placementMode }) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    if (placementMode) container.style.cursor = 'crosshair'
    else container.style.cursor = ''
  }, [placementMode, map])

  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function RiskMap({
  nodes = [],
  height = '100%',
  center = GUJARAT_CENTER,
  zoom = DEFAULT_ZOOM,
  placementMode = false,
  onMapClick = null,
  showCorrelationRings = true,
  showWindDrift = true,
  mode = null,
  onModeChange = null,
  showModeSwitcher = true,
}) {
  const [internalMode, setInternalMode] = useState('normal')
  const activeMode = mode || internalMode
  const modeConfig = MAP_MODES[activeMode] || MAP_MODES.normal

  const handleSelectMode = (newMode) => {
    setInternalMode(newMode)
    if (onModeChange) onModeChange(newMode)
  }

  // Correlated alert nodes (high risk)
  const highRiskNodes = nodes.filter((n) => n.risk_score >= 50)

  // Correlation line points between correlated nodes
  const correlationLines = highRiskNodes.length >= 2
    ? highRiskNodes.map((n) => [n.latitude, n.longitude])
    : []

  return (
    <div style={{ height, width: '100%' }} className="relative overflow-hidden">
      {/* ─── Floating 3-Mode Map Switcher ─────────────────────────────── */}
      {showModeSwitcher && (
        <div className="absolute top-3 right-3 z-[450] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-1 font-sans">
          {Object.values(MAP_MODES).map((m) => {
            const isSelected = activeMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMode(m.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200',
                  isSelected
                    ? m.id === 'night'
                      ? 'bg-slate-900 text-white shadow-md'
                      : m.id === 'satellite'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
                title={m.description}
              >
                <span>{m.icon}</span>
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ─── Leaflet Map Container ───────────────────────────────────── */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Dynamic Tile Layers according to selected mode */}
        {modeConfig.layers.map((layer, idx) => (
          <TileLayer
            key={`${activeMode}-${idx}-${layer.url}`}
            url={layer.url}
            attribution={layer.attribution || undefined}
            maxZoom={layer.maxZoom || 19}
          />
        ))}

        <MapFlyTo center={center} zoom={zoom} />
        <MapClickHandler onMapClick={onMapClick} placementMode={placementMode} />

        {/* ─── Cross-Node Correlation Dashed Rings & Lines ───────────────── */}
        {showCorrelationRings && highRiskNodes.length >= 2 && (
          <>
            <Polyline
              positions={correlationLines}
              pathOptions={{ color: '#EF4444', weight: 2.5, dashArray: '6, 8', opacity: 0.9 }}
            />
            {highRiskNodes.map((n) => (
              <Circle
                key={`corr-ring-${n.node_id}`}
                center={[n.latitude, n.longitude]}
                radius={2400}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: '4, 4',
                }}
              />
            ))}
          </>
        )}

        {/* ─── Simulated Wind Drift Cone for Industrial Gas & Smoke ──────── */}
        {showWindDrift && (
          <Polyline
            positions={[
              [22.9734, 72.5898], // Narol-Vatva
              [23.0150, 72.6350], // Downwind Plume Sector
              [23.0350, 72.6650],
            ]}
            pathOptions={{ color: '#8B5CF6', weight: 3.5, opacity: 0.75, dashArray: '5, 8' }}
          />
        )}

        {/* ─── Node Pins with Color-Coded Severity ───────────────────────── */}
        {nodes.map((node) => {
          const color = getSeverityColor(node)
          const isEmergency = node.risk_score >= 70
          const catInfo = SENSOR_CATEGORIES.find((c) => c.id === node.category)

          return (
            <CircleMarker
              key={node.node_id}
              center={[node.latitude, node.longitude]}
              radius={isEmergency ? 11 : 8}
              pathOptions={{
                color: '#FFFFFF',
                weight: activeMode === 'satellite' ? 2.5 : 2,
                fillColor: color,
                fillOpacity: 0.95,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <span className="font-mono text-xs font-bold">
                  {catInfo?.icon} {node.name || node.node_id} — {node.severity?.toUpperCase()} ({node.risk_score}%)
                </span>
              </Tooltip>

              <Popup>
                <div className="p-1.5 space-y-2.5 text-xs font-sans min-w-[220px]">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 font-mono text-sm">{node.node_id}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase text-white shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {node.severity}
                    </span>
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{node.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{node.location}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500">Risk Score:</span>{' '}
                      <b style={{ color }}>{node.risk_score}/100</b>
                    </div>
                    <div>
                      <span className="text-slate-500">Battery:</span> <b>{node.battery_pct}%</b>
                    </div>
                    <div>
                      <span className="text-slate-500">Network:</span> <b>{node.connectivity?.split(' ')[0] || 'LoRa'}</b>
                    </div>
                    <div>
                      <span className="text-slate-500">Local Siren:</span>{' '}
                      <b className={node.local_siren ? 'text-red-600' : 'text-slate-700'}>
                        {node.local_siren ? '🚨 ACTIVE' : 'Standby'}
                      </b>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {node.latitude.toFixed(3)}°N, {node.longitude.toFixed(3)}°E
                    </span>
                    <Link
                      to={`/nodes/${node.node_id}`}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-mono font-bold hover:underline"
                    >
                      View Node Details →
                    </Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
