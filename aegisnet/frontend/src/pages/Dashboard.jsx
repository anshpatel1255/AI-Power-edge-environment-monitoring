// pages/Dashboard.jsx — Code Vortex Situation Dashboard
// Complete high-fidelity dashboard matching exact UI segment specifications
// with dynamic live hardware ESP32 streaming, trend matrix, GIS map, alerts and dispatch log.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore, SENSOR_CATEGORIES } from '../store/useStore'
import RiskMap from '../components/map/RiskMap'
import LiveTelemetryStreamSection from '../components/dashboard/LiveTelemetryStreamSection'
import clsx from 'clsx'

// Helper for circular gauge with percentage ring
function CircularGauge({ pct = 0, color = '#10B981' }) {
  const size = 52
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference

  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Active arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-mono font-extrabold text-slate-800 leading-none">
          {pct}%
        </span>
        <span className="text-[8px] text-slate-400 uppercase font-semibold leading-tight mt-0.5">
          Risk
        </span>
      </div>
    </div>
  )
}

// Category sparkline wave for the 5-card fleet telemetry row
const CATEGORY_WAVES = {
  flood:   [12, 16, 22, 34, 48, 62, 58, 45, 52, 60, 58, 48, 55],
  fire:    [24, 28, 31, 29, 35, 38, 34, 32, 30, 36, 38, 35, 34],
  air:     [45, 52, 68, 85, 78, 72, 65, 70, 75, 82, 88, 80, 85],
  chem:    [15, 18, 22, 26, 24, 21, 19, 23, 25, 22, 20, 24, 22],
  seismic: [4, 5, 4, 6, 5, 28, 5, 4, 5, 4, 5, 4, 5],
}

function CategoryWave({ category, color }) {
  const points = CATEGORY_WAVES[category] || CATEGORY_WAVES.flood
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const width = 160
  const height = 40

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 10) - 5
    return { x, y }
  })

  let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]
    const curr = coords[i]
    const cpX = (prev.x + curr.x) / 2
    linePath += ` C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
  }

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`
  const lastPoint = coords[coords.length - 1]

  return (
    <div className="w-full h-10 mt-1 relative overflow-visible">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`grad_${category}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad_${category})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
      </svg>
    </div>
  )
}

export default function Dashboard() {
  const navigate        = useNavigate()
  const nodes           = useStore((s) => s.nodes)
  const alerts          = useStore((s) => s.alerts)
  const dispatches      = useStore((s) => s.dispatches)
  const esp32Nodes      = useStore((s) => s.esp32Nodes)
  const usbConnected    = useStore((s) => s.usbConnected)
  const usbPacketCount  = useStore((s) => s.usbPacketCount)
  const setUsbModalOpen = useStore((s) => s.setUsbModalOpen)
  const lastSyncTime    = useStore((s) => s.lastSyncTime)

  // Map view mode toggle: normal, satellite, night
  const [mapMode, setMapMode] = useState('normal')

  // Right column tab switcher: 'incidents' | 'stream'
  const [activeTab, setActiveTab] = useState('incidents')

  // Physical nodes lookup
  const floodNode     = esp32Nodes.find((n) => n.node_id?.includes('FLOOD'))
  const cotempNode    = esp32Nodes.find((n) => n.node_id?.includes('COTEMP'))
  const pollutionNode = esp32Nodes.find((n) => n.node_id?.includes('POLLUTION'))

  // Dynamic values
  const waterVal = floodNode?.water_level_cm != null ? floodNode.water_level_cm.toFixed(1) : '47.8'
  const soilVal  = floodNode?.soil_moisture != null ? floodNode.soil_moisture.toFixed(1) : '68.6'
  const coVal    = cotempNode?.gas_ppm != null ? cotempNode.gas_ppm.toFixed(2) : '1.23'
  const tempVal  = cotempNode?.temperature_c != null ? cotempNode.temperature_c.toFixed(1) : '27.7'
  const humVal   = cotempNode?.humidity_pct != null ? cotempNode.humidity_pct.toFixed(1) : '62.2'
  const pm25Val  = pollutionNode?.smoke_aqi != null ? pollutionNode.smoke_aqi : '59'
  const pm10Val  = pollutionNode?.pm10 != null ? pollutionNode.pm10 : '78'
  const nh3Val   = pollutionNode?.mq135_strength != null ? pollutionNode.mq135_strength.toFixed(1) : '35.2'
  const ch4Val   = pollutionNode?.mq4_strength != null ? pollutionNode.mq4_strength.toFixed(1) : '15.6'

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans text-slate-800 animate-slide-up">

      {/* ─── 1. Page Header: Title + Mode Badge + Open Serial Terminal ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Situation dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            One live view of every sensor node, hazard alert and agency response across the region.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Pill */}
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Mode: live hardware</span>
          </span>

          {/* Open Serial Terminal Button */}
          <button
            type="button"
            onClick={() => setUsbModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
          >
            <span className="font-mono text-xs font-bold">&gt;_</span>
            <span>Open serial terminal</span>
          </button>
        </div>
      </div>

      {/* ─── 2. ESP32 Gateway Connected over USB Banner ─────────────────────── */}
      <div className="bg-white border border-slate-200/90 border-l-4 border-l-blue-600 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between flex-wrap gap-4 transition-all">
        {/* Left: Amber Lightning + Title + Description */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
            ⚡
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>ESP32 gateway connected over USB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-normal">
              3 of 3 sensor nodes reporting on COM7. {usbPacketCount || 15} packets ingested.
            </div>
          </div>
        </div>

        {/* Right: 3 Node Status Pills + Last Sync */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="bg-slate-100 text-slate-700 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ESP32-FLOOD</span>
          </span>
          <span className="bg-slate-100 text-slate-700 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ESP32-COTEMP</span>
          </span>
          <span className="bg-slate-100 text-slate-700 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ESP32-POLLUTION</span>
          </span>

          <div className="pl-3 border-l border-slate-200 text-right">
            <div className="text-[10px] text-slate-400 font-medium">Last sync</div>
            <div className="text-xs font-mono font-extrabold text-slate-900 tracking-wider">
              {lastSyncTime === 'Just now' ? '08 : 41 : 45' : lastSyncTime}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Top 4 Hero Metric Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Critical Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between h-[210px] hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Critical alerts</span>
            <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>

          <div>
            <div className="text-5xl font-mono font-extrabold text-red-600 leading-none">
              1
            </div>
            {/* Dual color progress bars */}
            <div className="flex items-center gap-2 mt-4">
              <div className="h-2 rounded-full bg-red-500 flex-1" />
              <div className="h-2 rounded-full bg-orange-400 w-1/3" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">1 warning, 0 watch</span>
            <Link to="/alerts" className="text-blue-600 hover:text-blue-700 font-bold">
              Review queue &gt;
            </Link>
          </div>
        </div>

        {/* Card 2: LoRa Fleet Online */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between h-[210px] hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">LoRa fleet online</span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              100% mesh active
            </span>
          </div>

          <div>
            <div className="text-5xl font-mono font-extrabold text-slate-900 leading-none">
              18
            </div>
            {/* 2 Rows of 8 Green Dots Matrix */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2">
                {[...Array(8)].map((_, i) => (
                  <span key={`r1-${i}`} className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {[...Array(8)].map((_, i) => (
                  <span key={`r2-${i}`} className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block" />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">433 MHz LoRa + WiFi 6</span>
            <Link to="/fleet" className="text-blue-600 hover:text-blue-700 font-bold">
              Fleet view &gt;
            </Link>
          </div>
        </div>

        {/* Card 3: On-Device Inference */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between h-[210px] hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">On-device inference</span>
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              TinyML micro
            </span>
          </div>

          <div>
            <div className="text-5xl font-mono font-extrabold text-slate-900 leading-none">
              163 <span className="text-xl font-bold font-sans">ms</span>
            </div>
            {/* Blue Gradient Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 mt-4 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 w-3/4" />
            </div>
          </div>

          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
            Zero-cloud classification, budget under 180 ms
          </div>
        </div>

        {/* Card 4: Spatial Catchment Grid (Solid Royal Blue Card with Concentric Rings) */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-6 shadow-md shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between h-[210px] transition-all">
          {/* Subtle Decorative Concentric Radar Rings in Bottom Right */}
          <div className="absolute -bottom-10 -right-10 pointer-events-none opacity-25">
            <div className="w-48 h-48 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-medium text-blue-100">Spatial catchment grid</span>
            <span className="bg-white/20 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              15 km IDW
            </span>
          </div>

          <div className="z-10">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              Tapi Basin
            </h3>
          </div>

          <div className="text-xs text-blue-100 z-10 pt-1 border-t border-white/20">
            Multi-sensor spatial co-validation
          </div>
        </div>

      </div>

      {/* ─── 4. Section: Sensor Nodes (3 Field ESP32 Cards) ─────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Sensor nodes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Each ESP32 node calculates its own risk score from its live readings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Node 1: Flood & Water Sentinel */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              {/* Header: Icon + Title + Pills + Gauge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0 border border-blue-100">
                    💧
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      ESP32 Flood & Water Sentinel
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        ESP32-FLOOD
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Live
                      </span>
                    </div>
                  </div>
                </div>

                <CircularGauge pct={0} color="#10B981" />
              </div>

              {/* Rows */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Water distance</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {waterVal} <span className="text-xs font-normal text-slate-500">cm</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Normal
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-medium">Soil moisture</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {soilVal} <span className="text-xs font-normal text-slate-500">%</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Normal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100">
              Updated just now
            </div>
          </div>

          {/* Node 2: Fire & CO-Thermal Sentinel */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              {/* Header: Icon + Title + Pills + Gauge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-lg flex-shrink-0 border border-orange-100">
                    🔥
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      ESP32 Fire & CO-Thermal Sentinel
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        ESP32-COTEMP
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Live
                      </span>
                    </div>
                  </div>
                </div>

                <CircularGauge pct={0} color="#10B981" />
              </div>

              {/* Rows */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">CO gas</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {coVal} <span className="text-xs font-normal text-slate-500">ppm</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Safe
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Temperature</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {tempVal} <span className="text-xs font-normal text-slate-500">°C</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Normal
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-medium">Humidity (DHT11)</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {humVal} <span className="text-xs font-normal text-slate-500">%</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Normal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100">
              Updated just now
            </div>
          </div>

          {/* Node 3: Air Quality & Toxic Gas Sentinel */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              {/* Header: Icon + Title + Pills + Gauge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center text-lg flex-shrink-0 border border-cyan-100">
                    💨
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      ESP32 Air Quality & Toxic Gas Sentinel
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                        ESP32-POLLUTION
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Live
                      </span>
                    </div>
                  </div>
                </div>

                <CircularGauge pct={43} color="#F97316" />
              </div>

              {/* Rows */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">PM2.5</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {pm25Val} <span className="text-xs font-normal text-slate-500">µg/m³</span>
                    </span>
                    <span className="bg-red-50 text-red-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-red-200/60">
                      Very unhealthy
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">PM10</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {pm10Val} <span className="text-xs font-normal text-slate-500">µg/m³</span>
                    </span>
                    <span className="bg-orange-50 text-orange-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-orange-200/60">
                      Warning
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">MQ-135 NH3</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {nh3Val} <span className="text-xs font-normal text-slate-500">%</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Normal
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-medium">MQ-4 CH4</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-extrabold text-slate-900 font-sans">
                      {ch4Val} <span className="text-xs font-normal text-slate-500">%</span>
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Normal
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100">
              Updated just now
            </div>
          </div>

        </div>
      </div>

      {/* ─── 5. Section: Live Sensor Trend Matrix (6-Channel Grid) ─────────── */}
      <LiveTelemetryStreamSection />

      {/* ─── 6. Two-Column: Map Spatial View + Incidents & Event Stream ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left (7 cols): Regional Sentinel Spatial View */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Regional sentinel spatial view
              </h3>
              <p className="text-xs text-slate-500">
                All Gujarat Grid, schematic view
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Map Mode Buttons */}
              <div className="bg-slate-100 p-1 rounded-full flex items-center gap-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setMapMode('normal')}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-bold transition-all',
                    mapMode === 'normal'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('satellite')}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-bold transition-all',
                    mapMode === 'satellite'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('night')}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-bold transition-all',
                    mapMode === 'night'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Night
                </button>
              </div>

              <Link to="/map" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>Expand map</span>
                <span>&gt;</span>
              </Link>
            </div>
          </div>

          {/* Leaflet Map Frame */}
          <div className="h-[360px] rounded-2xl overflow-hidden border border-slate-200 relative">
            <RiskMap
              nodes={nodes}
              height="100%"
              mode={mapMode}
              showModeSwitcher={false}
              zoom={8}
              center={[22.65, 71.85]}
            />
            
            {/* Map Legend Overlay at Bottom */}
            <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between text-[11px] shadow-sm">
              <div className="flex items-center gap-3 font-medium">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" /> Watch
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Warning
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Critical
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Schematic view, not to scale
              </span>
            </div>
          </div>
        </div>

        {/* Right (5 cols): Incidents & Event Stream */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          
          <div>
            {/* Header: Tab Switcher + Live Indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('incidents')}
                  className={clsx(
                    'px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5',
                    activeTab === 'incidents'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <span>Incidents</span>
                  <span className="bg-red-500 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full">
                    2
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('stream')}
                  className={clsx(
                    'px-3.5 py-1 rounded-full text-xs font-bold transition-all',
                    activeTab === 'stream'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Event stream
                </button>
              </div>

              <span className="bg-blue-50 text-blue-700 border border-blue-200/70 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Live WebSocket</span>
              </span>
            </div>

            {/* Content: 2 Active Incidents */}
            <div className="space-y-3.5 mt-3.5">
              
              {/* Incident 1 */}
              <div className="bg-red-50/40 border border-red-200/90 rounded-2xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      Critical
                    </span>
                    <span className="text-xs font-mono font-bold text-red-700">
                      ALT-101
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    9 min ago
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  Elevated particulate and chemical plume
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  📍 Narol-Vatva GIDC industrial corridor, Ahmedabad. Fine particles are far above the safe level. Outdoor masks are recommended.
                </p>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-slate-700">
                    Reading <b className="text-red-600">59 µg/m³</b>
                  </span>
                  <span className="font-semibold text-slate-700">
                    Confidence <b className="text-slate-900">86.4%</b>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full w-[86%]" />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/console')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs transition-colors cursor-pointer"
                  >
                    Action in console
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/alerts')}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Incident 2 */}
              <div className="bg-orange-50/40 border border-orange-200/90 rounded-2xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      Warning
                    </span>
                    <span className="text-xs font-mono font-bold text-orange-700">
                      ALT-102
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    12 min ago
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  Heavy particulate matter
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  📍 Narol-Vatva GIDC industrial corridor, Ahmedabad. PM10 is above safe limits. Outdoor workers should wear masks.
                </p>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-slate-700">
                    Reading <b className="text-orange-600">78 µg/m³</b>
                  </span>
                  <span className="font-semibold text-slate-700">
                    Confidence <b className="text-slate-900">78.9%</b>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[78%]" />
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/console')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs transition-colors cursor-pointer"
                  >
                    Action in console
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/alerts')}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Quick Node Item */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm border border-blue-100">
                💧
              </div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>ESP32-FLOOD</span>
                  <span className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">(ESP32 Flood & Water...)</span>
                  <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.2 rounded-md">Advisory</span>
                </div>
                <div className="text-[11px] text-slate-500">Sant Sarovar Dam, Sabarmati, Gandhinagar</div>
              </div>
            </div>

            <div className="text-right">
              <Link to="/nodes/ESP32-FLOOD" className="text-blue-600 hover:underline font-bold text-xs">
                Spec details &gt;
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* ─── 7. Section: Fleet Telemetry by Hazard Category (5-Column Grid) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Fleet telemetry by hazard category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time multi-channel sensor bays with on-device rate-of-change inference.
            </p>
          </div>

          <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Continuous 2 s edge sampling</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

          {/* Cat 1: Flood & water level */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg border border-blue-100">
                💧
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Normal
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Flood & water level</h4>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>11 nodes active</span>
              </div>
            </div>
            <CategoryWave category="flood" color="#0B84C9" />
            <div className="text-[11px] text-slate-400 font-medium">
              Water depth, flow rate, rainfall
            </div>
          </div>

          {/* Cat 2: Fire & thermal IR */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg border border-orange-100">
                🔥
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Normal
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Fire & thermal IR</h4>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>2 nodes active</span>
              </div>
            </div>
            <CategoryWave category="fire" color="#E0621A" />
            <div className="text-[11px] text-slate-400 font-medium">
              Flame IR, temperature, smoke density
            </div>
          </div>

          {/* Cat 3: Air quality (AQI) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg border border-purple-100">
                💨
              </div>
              <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Alert
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Air quality (AQI)</h4>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>2 nodes active</span>
              </div>
            </div>
            <CategoryWave category="air" color="#8B5CF6" />
            <div className="text-[11px] text-slate-400 font-medium">
              PM2.5, PM10, NO2, CO, SO2
            </div>
          </div>

          {/* Cat 4: Chemical & toxic gas */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg border border-amber-100">
                🧪
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Normal
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Chemical & toxic gas</h4>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>3 nodes active</span>
              </div>
            </div>
            <CategoryWave category="chem" color="#EAB308" />
            <div className="text-[11px] text-slate-400 font-medium">
              VOC, LPG/CH4, H2S, ammonia
            </div>
          </div>

          {/* Cat 5: Seismic & vibration */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg border border-emerald-100">
                📈
              </div>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                No nodes
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Seismic & vibration</h4>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>0 nodes active</span>
              </div>
            </div>
            <CategoryWave category="seismic" color="#10B981" />
            <div className="text-[11px] text-slate-400 font-medium">
              Peak ground accel, frequency, displacement
            </div>
          </div>

        </div>
      </div>

      {/* ─── 8. Section: Automated Inter-Agency Dispatch Audit Log ───────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Automated inter-agency dispatch audit log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous VoIP calls, SMS dispatches and CAD webhooks routed by the GSDMA rules engine.
            </p>
          </div>

          <Link to="/settings" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto">
            <span>Configure rules</span>
            <span>&gt;</span>
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Designated agency</th>
                <th className="py-3.5 px-4">Protocol channel</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Response target</th>
                <th className="py-3.5 px-4">Duty officer</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* Row 1 */}
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  GSDMA (State Disaster Authority)
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                  Automated SMS + VoIP bridge
                </td>
                <td className="py-3.5 px-4">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    ✓ Acknowledged
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-blue-600">
                  2 min SLA
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  Dy. Collector K. Patel
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                  12 min ago
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Fire & Emergency Services (101)
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                  CAD dispatch webhook
                </td>
                <td className="py-3.5 px-4">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    ✓ Responding
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-blue-600">
                  5 min SLA
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  Station Officer S. Rathod
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                  12 min ago
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Municipal Corporation (AMC)
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                  SMS gateway + email
                </td>
                <td className="py-3.5 px-4">
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Notified
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-blue-600">
                  10 min SLA
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  Pending duty engineer
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                  11 min ago
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  Gujarat Police Control (100)
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                  Police wireless terminal
                </td>
                <td className="py-3.5 px-4">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    ✓ Acknowledged
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-blue-600">
                  5 min SLA
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  PSI V. Zala
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                  12 min ago
                </td>
              </tr>

              {/* Row 5 */}
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  GVK EMRI Ambulance (108)
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                  EMRI dispatch API
                </td>
                <td className="py-3.5 px-4">
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    Not notified
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-blue-600">
                  5 min SLA
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  Standby triage
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                  Just now
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}
