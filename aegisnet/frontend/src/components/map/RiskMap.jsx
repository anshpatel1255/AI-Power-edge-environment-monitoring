// components/map/RiskMap.jsx — Light Positron Basemap with Correlation Rings & Drift Vectors
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SENSOR_CATEGORIES } from '../../store/useStore'
import 'leaflet/dist/leaflet.css'

const GUJARAT_CENTER = [23.12, 72.62]
const DEFAULT_ZOOM = 11

function getSeverityColor(node) {
  if (node.status === 'offline') return '#94A3B8'
  if (node.severity === 'emergency' || node.risk_score >= 70) return '#C62828'
  if (node.severity === 'warning' || node.risk_score >= 50) return '#E0621A'
  if (node.severity === 'watch' || node.risk_score >= 35) return '#B58900'
  return '#2E7D32' // Advisory / Normal
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
}) {
  // Correlated alert nodes (high risk)
  const highRiskNodes = nodes.filter((n) => n.risk_score >= 50)

  // Correlation line points between correlated nodes
  const correlationLines = highRiskNodes.length >= 2
    ? highRiskNodes.map((n) => [n.latitude, n.longitude])
    : []

  return (
    <div style={{ height, width: '100%' }} className="relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Light Positron CartoDB Basemap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapFlyTo center={center} zoom={zoom} />
        <MapClickHandler onMapClick={onMapClick} placementMode={placementMode} />

        {/* ─── Cross-Node Correlation Dashed Rings & Lines ───────────────── */}
        {showCorrelationRings && highRiskNodes.length >= 2 && (
          <>
            <Polyline
              positions={correlationLines}
              pathOptions={{ color: '#C62828', weight: 2, dashArray: '6, 8', opacity: 0.8 }}
            />
            {highRiskNodes.map((n) => (
              <Circle
                key={`corr-ring-${n.node_id}`}
                center={[n.latitude, n.longitude]}
                radius={2400}
                pathOptions={{
                  color: '#C62828',
                  fillColor: '#C62828',
                  fillOpacity: 0.08,
                  weight: 1.5,
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
            pathOptions={{ color: '#6B4FA0', weight: 3, opacity: 0.6, dashArray: '4, 6' }}
          />
        )}

        {/* ─── Node Pins with Color-Coded Severity ───────────────────────── */}
        {nodes.map((node) => {
          const color = getSeverityColor(node)
          const isEmergency = node.risk_score >= 70
          const catInfo = SENSOR_CATEGORIES.find((c) => c.id === node.category)

          const isEsp32 = node.node_id?.includes('ESP32') || node.connectivity?.includes('USB')

          return (
            <div key={node.node_id}>
              {/* Outer pulsing ring for live physical ESP32 hardware nodes */}
              {isEsp32 && (
                <Circle
                  center={[node.latitude, node.longitude]}
                  radius={isEmergency ? 3200 : 2200}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '4, 4',
                  }}
                />
              )}

              <CircleMarker
                center={[node.latitude, node.longitude]}
                radius={isEsp32 ? (isEmergency ? 14 : 11) : (isEmergency ? 11 : 8)}
                pathOptions={{
                  color: isEsp32 ? '#FFFFFF' : '#FFFFFF',
                  weight: isEsp32 ? 3 : 2,
                  fillColor: color,
                  fillOpacity: 0.98,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <span className="font-mono text-xs font-bold">
                    {isEsp32 ? '⚡ ' : ''}{catInfo?.icon} {node.node_id} — {node.severity.toUpperCase()} ({node.risk_score}%)
                  </span>
                </Tooltip>

                <Popup>
                  <div className="p-1 space-y-2 text-xs font-sans min-w-[220px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isEsp32 && <span className="bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full">LIVE USB</span>}
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

                    {/* Live Physical Metrics for ESP32 Nodes */}
                    {isEsp32 && (
                      <div className="bg-emerald-50/80 border border-emerald-200 p-2 rounded-xl text-[11px] font-mono space-y-1">
                        {node.water_level_cm != null && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Water Depth:</span>
                            <b className="text-blue-700">{node.water_level_cm.toFixed(1)} cm</b>
                          </div>
                        )}
                        {node.soil_moisture != null && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Soil Moisture:</span>
                            <b className="text-blue-700">{node.soil_moisture.toFixed(1)} %</b>
                          </div>
                        )}
                        {node.gas_ppm != null && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">CO Gas (MQ-7):</span>
                            <b className="text-orange-700">{node.gas_ppm.toFixed(2)} ppm</b>
                          </div>
                        )}
                        {node.temperature_c != null && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Temperature:</span>
                            <b className="text-orange-700">{node.temperature_c.toFixed(1)} °C</b>
                          </div>
                        )}
                        {node.smoke_aqi != null && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">PM2.5 AQI:</span>
                            <b className="text-purple-700">{node.smoke_aqi} µg/m³</b>
                          </div>
                        )}
                        {node.mq135_strength != null && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">MQ-135 NH3:</span>
                            <b className="text-purple-700">{node.mq135_strength.toFixed(0)} %</b>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-xl text-[11px] font-mono border border-slate-100">
                      <div>
                        <span className="text-slate-500">Risk:</span>{' '}
                        <b style={{ color }}>{node.risk_score}/100</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Battery:</span> <b>{node.battery_pct}%</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Link:</span> <b>{isEsp32 ? 'USB COM7' : (node.connectivity?.split(' ')[0] || 'Mesh')}</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Siren:</span>{' '}
                        <b>{node.local_siren || node.risk_score >= 80 ? '🚨 ACTIVE' : 'Idle'}</b>
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <Link
                        to={`/nodes/${node.node_id}`}
                        className="text-[11px] text-emerald-700 hover:underline font-mono font-bold"
                      >
                        Inspect Full Telemetry →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          )

        })}
      </MapContainer>
    </div>
  )
}
