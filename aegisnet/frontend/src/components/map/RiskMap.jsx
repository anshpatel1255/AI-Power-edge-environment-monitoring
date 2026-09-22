// components/map/RiskMap.jsx — Geographic Environmental Risk Map
// Features: Dynamic tile modes, Robust GPS click placement (useRef + map.on('click')),
// Highly visible industrial wind plume cones with dispersal zones, correlation rings, and tooltips.
import React, { useEffect, useState, useRef } from 'react'
import {
  MapContainer, TileLayer, CircleMarker, Circle,
  Popup, Polyline, Polygon, Tooltip,
  useMap,
} from 'react-leaflet'
import { Link } from 'react-router-dom'
import { SENSOR_CATEGORIES } from '../../store/useStore'
import clsx from 'clsx'
import 'leaflet/dist/leaflet.css'

const GUJARAT_CENTER = [23.12, 72.62]
const DEFAULT_ZOOM   = 11

// ─── Map Tile Providers ───────────────────────────────────────────────────────
export const MAP_MODES = {
  normal: {
    id: 'normal',
    label: 'Normal Map',
    shortLabel: 'Normal',
    icon: '🗺️',
    description: 'High-detail OpenStreetMap',
    layers: [
      {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxNativeZoom: 19,
        maxZoom: 21,
      },
    ],
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    shortLabel: 'Satellite',
    icon: '🛰️',
    description: 'ESRI World Imagery',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxNativeZoom: 18,
        maxZoom: 21,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        attribution: '',
        maxNativeZoom: 18,
        maxZoom: 21,
      },
    ],
  },
  night: {
    id: 'night',
    label: 'Night Mode',
    shortLabel: 'Night',
    icon: '🌙',
    description: 'Tactical dark canvas',
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri',
        maxNativeZoom: 16,
        maxZoom: 21,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        attribution: '',
        maxNativeZoom: 16,
        maxZoom: 21,
      },
    ],
  },
}

// ─── Industrial Wind Plume Corridors across Gujarat ───────────────────────────
const WIND_PLUMES = [
  {
    id: 'narol-vatva',
    label: 'Narol-Vatva Industrial Chemical Plume',
    corridor: 'Ahmedabad South-East Cluster',
    source: [22.9734, 72.5898],
    pollutant: 'VOC (46 ppm) · PM2.5 (182 µg/m³)',
    windSpeed: '14 km/h towards North-East',
    color: '#8B5CF6',
    innerColor: '#7C3AED',
    // High-concentration core cone
    innerPolygon: [
      [22.9734, 72.5898],
      [22.9900, 72.6080],
      [23.0100, 72.6320],
      [23.0220, 72.6500],
      [23.0080, 72.6450],
      [22.9880, 72.6180],
      [22.9734, 72.5898],
    ],
    // Dispersal perimeter zone
    outerPolygon: [
      [22.9734, 72.5898],
      [22.9980, 72.6020],
      [23.0200, 72.6280],
      [23.0450, 72.6680],
      [23.0300, 72.6750],
      [23.0020, 72.6500],
      [22.9800, 72.6250],
      [22.9734, 72.5898],
    ],
    centerLine: [
      [22.9734, 72.5898],
      [22.9950, 72.6200],
      [23.0200, 72.6480],
      [23.0450, 72.6680],
    ],
  },
  {
    id: 'hazira-surat',
    label: 'Hazira Petrochemical & Heavy Gas Plume',
    corridor: 'Surat Coast / Tapi Estuary',
    source: [21.0950, 72.6450],
    pollutant: 'SO₂ · NOₓ · Heavy Particulates',
    windSpeed: '12 km/h towards East-North-East',
    color: '#F97316',
    innerColor: '#EA580C',
    innerPolygon: [
      [21.0950, 72.6450],
      [21.1120, 72.6750],
      [21.1280, 72.7100],
      [21.1150, 72.7050],
      [21.1000, 72.6700],
      [21.0950, 72.6450],
    ],
    outerPolygon: [
      [21.0950, 72.6450],
      [21.1200, 72.6650],
      [21.1400, 72.7150],
      [21.1500, 72.7500],
      [21.1250, 72.7450],
      [21.1020, 72.7000],
      [21.0850, 72.6650],
      [21.0950, 72.6450],
    ],
    centerLine: [
      [21.0950, 72.6450],
      [21.1180, 72.6850],
      [21.1380, 72.7250],
      [21.1500, 72.7500],
    ],
  },
  {
    id: 'nandesari-vadodara',
    label: 'Nandesari GIDC Chemical Dispersion Plume',
    corridor: 'Vadodara North Industrial Belt',
    source: [22.4150, 73.1050],
    pollutant: 'NH₃ · Organic Solvents',
    windSpeed: '10 km/h towards East',
    color: '#06B6D4',
    innerColor: '#0891B2',
    innerPolygon: [
      [22.4150, 73.1050],
      [22.4280, 73.1350],
      [22.4350, 73.1650],
      [22.4200, 73.1600],
      [22.4100, 73.1300],
      [22.4150, 73.1050],
    ],
    outerPolygon: [
      [22.4150, 73.1050],
      [22.4350, 73.1250],
      [22.4500, 73.1680],
      [22.4550, 73.1950],
      [22.4300, 73.1900],
      [22.4120, 73.1550],
      [22.4000, 73.1250],
      [22.4150, 73.1050],
    ],
    centerLine: [
      [22.4150, 73.1050],
      [22.4280, 73.1400],
      [22.4420, 73.1700],
      [22.4550, 73.1950],
    ],
  },
]

// ─── Severity Color Helper ────────────────────────────────────────────────────
function getSeverityColor(node) {
  if (node.status === 'offline')                               return '#94A3B8'
  if (node.severity === 'emergency' || node.risk_score >= 70) return '#EF4444'
  if (node.severity === 'warning'   || node.risk_score >= 50) return '#F97316'
  if (node.severity === 'watch'     || node.risk_score >= 35) return '#EAB308'
  return '#10B981'
}

// ─── Smooth Map Camera FlyTo ──────────────────────────────────────────────────
function MapFlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 12, { duration: 1.2 })
  }, [center, zoom, map])
  return null
}

// ─── Reliable Map Click Handler for Node Placement ────────────────────────────
// Uses stable refs + native Leaflet map.on('click') to bypass React closure traps.
function MapClickHandler({ onMapClick, placementMode }) {
  const map = useMap()

  const onMapClickRef = useRef(onMapClick)
  const placementModeRef = useRef(placementMode)

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    placementModeRef.current = placementMode
    const container = map.getContainer()
    if (placementMode) {
      container.style.cursor = 'crosshair'
    } else {
      container.style.cursor = ''
    }
  }, [placementMode, map])

  useEffect(() => {
    function handleMapClick(e) {
      if (placementModeRef.current && onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng)
      }
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [map])

  return null
}

// ─── Wind Plume Visualization Layers ──────────────────────────────────────────
function WindPlumeLayers({ interactive = true }) {
  return (
    <>
      {WIND_PLUMES.map((plume) => (
        <React.Fragment key={plume.id}>
          {/* Outer Dispersal Cone */}
          <Polygon
            positions={plume.outerPolygon}
            pathOptions={{
              color: plume.color,
              fillColor: plume.color,
              fillOpacity: 0.18,
              weight: 1.5,
              opacity: 0.6,
              dashArray: '6, 6',
              interactive,
            }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.5' }}>
                <strong style={{ color: plume.color }}>{plume.label}</strong><br />
                📍 {plume.corridor}<br />
                💨 Wind: {plume.windSpeed}<br />
                ☁️ Pollutant: {plume.pollutant}
              </div>
            </Tooltip>
          </Polygon>

          {/* Inner High-Concentration Core */}
          <Polygon
            positions={plume.innerPolygon}
            pathOptions={{
              color: plume.innerColor,
              fillColor: plume.innerColor,
              fillOpacity: 0.38,
              weight: 2,
              opacity: 0.9,
              interactive,
            }}
          />

          {/* Centerline Wind Vector Arrow */}
          <Polyline
            positions={plume.centerLine}
            pathOptions={{
              color: plume.color,
              weight: 3,
              opacity: 0.95,
              dashArray: '8, 6',
              interactive,
            }}
          />

          {/* Emission Source Origin Pulse */}
          <Circle
            center={plume.source}
            radius={950}
            pathOptions={{
              color: plume.color,
              fillColor: plume.color,
              fillOpacity: 0.5,
              weight: 2.5,
              interactive,
            }}
          >
            <Tooltip direction="top" offset={[0, -12]} permanent>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>
                🏭 {plume.id === 'narol-vatva' ? 'Narol-Vatva Plume' : plume.id === 'hazira-surat' ? 'Hazira Plume' : 'Nandesari Plume'}
              </span>
            </Tooltip>
          </Circle>
        </React.Fragment>
      ))}
    </>
  )
}

// ─── Cross-Node Correlation Rings ─────────────────────────────────────────────
function CorrelationRings({ nodes, interactive = true }) {
  const highRisk = nodes.filter((n) => n.risk_score >= 50)
  if (highRisk.length < 2) return null
  const positions = highRisk.map((n) => [n.latitude, n.longitude])

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{ color: '#EF4444', weight: 2.5, dashArray: '6, 8', opacity: 0.9, interactive }}
      />
      {highRisk.map((n) => (
        <Circle
          key={`corr-${n.node_id}`}
          center={[n.latitude, n.longitude]}
          radius={2400}
          pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.12, weight: 2, dashArray: '4, 4', interactive }}
        />
      ))}
    </>
  )
}

// ─── Node Markers ─────────────────────────────────────────────────────────────
function NodeMarkers({ nodes, placementMode }) {
  return (
    <>
      {nodes.map((node) => {
        const color       = getSeverityColor(node)
        const isEmergency = node.risk_score >= 70
        const catInfo     = SENSOR_CATEGORIES.find((c) => c.id === node.category)
        const isEsp32     = node.node_id?.includes('ESP32') || node.connectivity?.includes('USB')

        return (
          <React.Fragment key={node.node_id}>
            {isEsp32 && (
              <Circle
                center={[node.latitude, node.longitude]}
                radius={isEmergency ? 3200 : 2200}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '4, 4',
                  interactive: !placementMode,
                }}
              />
            )}

            <CircleMarker
              center={[node.latitude, node.longitude]}
              radius={isEsp32 ? (isEmergency ? 14 : 11) : (isEmergency ? 11 : 8)}
              pathOptions={{
                color: '#FFFFFF',
                weight: isEsp32 ? 3 : 2,
                fillColor: color,
                fillOpacity: 0.98,
                interactive: !placementMode,
              }}
            >
              {!placementMode && (
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}>
                    {isEsp32 ? '⚡ ' : ''}{catInfo?.icon} {node.node_id} — {node.severity.toUpperCase()} ({node.risk_score}%)
                  </span>
                </Tooltip>
              )}

              {!placementMode && (
                <Popup>
                  <div style={{ fontFamily: 'sans-serif', fontSize: '12px', minWidth: '220px' }} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isEsp32 && (
                          <span className="bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                            LIVE USB
                          </span>
                        )}
                        <span className="font-bold text-slate-900 font-mono">{node.node_id}</span>
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-white"
                        style={{ backgroundColor: color }}
                      >
                        {node.severity}
                      </span>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">{node.name}</div>
                      <div className="text-[11px] text-slate-500">{node.location}</div>
                    </div>

                    {isEsp32 && (
                      <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-[11px] font-mono space-y-1">
                        {node.water_level_cm != null && <div className="flex justify-between"><span className="text-slate-600">Water Depth:</span><b className="text-blue-700">{node.water_level_cm.toFixed(1)} cm</b></div>}
                        {node.soil_moisture  != null && <div className="flex justify-between"><span className="text-slate-600">Soil Moisture:</span><b className="text-blue-700">{node.soil_moisture.toFixed(1)} %</b></div>}
                        {node.gas_ppm        != null && <div className="flex justify-between"><span className="text-slate-600">CO Gas (MQ-7):</span><b className="text-orange-700">{node.gas_ppm.toFixed(2)} ppm</b></div>}
                        {node.temperature_c  != null && <div className="flex justify-between"><span className="text-slate-600">Temperature:</span><b className="text-orange-700">{node.temperature_c.toFixed(1)} °C</b></div>}
                        {node.smoke_aqi      != null && <div className="flex justify-between"><span className="text-slate-600">PM2.5 AQI:</span><b className="text-purple-700">{node.smoke_aqi} µg/m³</b></div>}
                        {node.mq135_strength != null && <div className="flex justify-between"><span className="text-slate-600">MQ-135 NH3:</span><b className="text-purple-700">{node.mq135_strength.toFixed(0)} %</b></div>}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-xl text-[11px] font-mono border border-slate-100">
                      <div><span className="text-slate-500">Risk:</span> <b style={{ color }}>{node.risk_score}/100</b></div>
                      <div><span className="text-slate-500">Battery:</span> <b>{node.battery_pct}%</b></div>
                      <div><span className="text-slate-500">Link:</span> <b>{isEsp32 ? 'USB COM7' : (node.connectivity?.split(' ')[0] || 'Mesh')}</b></div>
                      <div><span className="text-slate-500">Siren:</span> <b>{node.local_siren || node.risk_score >= 80 ? '🚨 ACTIVE' : 'Idle'}</b></div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <Link to={`/nodes/${node.node_id}`} className="text-[11px] text-emerald-700 hover:underline font-mono font-bold">
                        Inspect Full Telemetry →
                      </Link>
                    </div>
                  </div>
                </Popup>
              )}
            </CircleMarker>
          </React.Fragment>
        )
      })}
    </>
  )
}

// ─── Main RiskMap Export ──────────────────────────────────────────────────────
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

  return (
    <div style={{ height, width: '100%' }} className="relative overflow-hidden select-none">

      {/* ─── Optional Mode Switcher ─────────────────────────────────────── */}
      {showModeSwitcher && (
        <div className="absolute top-3 right-3 z-[450] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1 shadow-lg flex items-center gap-1 font-sans">
          {Object.values(MAP_MODES).map((m) => {
            const isSel = activeMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMode(m.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all',
                  isSel
                    ? m.id === 'night' ? 'bg-slate-900 text-white shadow'
                      : m.id === 'satellite' ? 'bg-emerald-600 text-white shadow'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
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

      {/* ─── Wind Plume Indicator Pill on Map ───────────────────────────── */}
      {showWindDrift && (
        <div className="absolute bottom-6 right-4 z-[400] bg-white/90 backdrop-blur-md border border-purple-200 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2.5 font-mono text-[11px] text-purple-900">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600" />
          </span>
          <div>
            <span className="font-bold">Wind Plumes: Active</span>
            <div className="text-[10px] text-slate-500">Narol-Vatva · Hazira · Nandesari</div>
          </div>
        </div>
      )}

      {/* ─── Leaflet Map Container ────────────────────────────────────────── */}
      <MapContainer
        center={center}
        zoom={zoom}
        maxZoom={20}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {modeConfig.layers.map((layer, idx) => (
          <TileLayer
            key={`${activeMode}-${idx}`}
            url={layer.url}
            attribution={layer.attribution || undefined}
            maxNativeZoom={layer.maxNativeZoom || 18}
            maxZoom={layer.maxZoom || 20}
          />
        ))}

        <MapFlyTo center={center} zoom={zoom} />
        <MapClickHandler onMapClick={onMapClick} placementMode={placementMode} />

        {showCorrelationRings && <CorrelationRings nodes={nodes} interactive={!placementMode} />}
        {showWindDrift        && <WindPlumeLayers interactive={!placementMode} />}
        <NodeMarkers nodes={nodes} placementMode={placementMode} />

      </MapContainer>
    </div>
  )
}
