// pages/AnalysisPage.jsx — AI Environmental Analysis & Explainability
// Exact visual match to user reference photos (Qualcomm Edge-AI Sensor Fusion, Neural Trajectories, Danger Zones, Deconstruction & Pipeline)

import { useState } from 'react'
import clsx from 'clsx'

// ── Multi-Hazard 2-Hour Ahead Forecast Trajectories ──────────────────────────
const TRAJECTORY_MODELS = {
  flood: {
    id: 'flood',
    name: 'Flood',
    icon: '💧',
    param: 'Flood Water Crest (cm)',
    color: '#ef4444',
    peak: '84.2 cm (+75.4%)',
    leadTime: '42 min lead',
    statisticalMargin: '±3.8 cm',
    architecture: 'LSTM Edge + 1D Hydro-Kinematic',
    crossTime: '+1h',
    crossValue: 62.0,
    domain: [38, 86],
    data: [
      { time: 'Now', actual: 44.0, envelopeLower: 42.0, envelopeUpper: 49.0 },
      { time: '+15m', actual: 48.2, envelopeLower: 46.0, envelopeUpper: 55.0 },
      { time: '+30m', actual: 52.8, envelopeLower: 50.0, envelopeUpper: 62.0 },
      { time: '+45m', actual: 57.5, envelopeLower: 54.0, envelopeUpper: 68.5 },
      { time: '+1h', actual: 62.0, envelopeLower: 58.0, envelopeUpper: 74.0 },
      { time: '+1h 15m', actual: 67.5, envelopeLower: 63.0, envelopeUpper: 78.5 },
      { time: '+1h 30m', actual: 73.0, envelopeLower: 68.0, envelopeUpper: 82.0 },
      { time: '+1h 45m', actual: 78.5, envelopeLower: 72.0, envelopeUpper: 84.5 },
      { time: '+2h', actual: 84.2, envelopeLower: 76.0, envelopeUpper: 85.0 },
    ],
  },
  thermal: {
    id: 'thermal',
    name: 'Thermal',
    icon: '🔥',
    param: 'Thermal / Forest IR (°C)',
    color: '#f97316',
    peak: '58.6 °C (+84%)',
    leadTime: '18 min lead',
    statisticalMargin: '±1.9 °C',
    architecture: 'TinyML Micro Arrhenius Thermal Flux',
    crossTime: '+45m',
    crossValue: 46,
    domain: [28, 60],
    data: [
      { time: 'Now', actual: 31.8, envelopeLower: 30.0, envelopeUpper: 35.0 },
      { time: '+15m', actual: 36.5, envelopeLower: 34.0, envelopeUpper: 41.5 },
      { time: '+30m', actual: 41.8, envelopeLower: 38.0, envelopeUpper: 47.5 },
      { time: '+45m', actual: 46.0, envelopeLower: 42.0, envelopeUpper: 53.0 },
      { time: '+1h', actual: 49.5, envelopeLower: 45.0, envelopeUpper: 56.5 },
      { time: '+1h 15m', actual: 53.0, envelopeLower: 48.0, envelopeUpper: 58.0 },
      { time: '+1h 30m', actual: 55.8, envelopeLower: 50.0, envelopeUpper: 59.0 },
      { time: '+1h 45m', actual: 57.4, envelopeLower: 51.0, envelopeUpper: 59.2 },
      { time: '+2h', actual: 58.6, envelopeLower: 52.0, envelopeUpper: 59.4 },
    ],
  },
  particulate: {
    id: 'particulate',
    name: 'Particulate',
    icon: '📊',
    param: 'Particulate PM2.5 (µg/m³)',
    color: '#8b5cf6',
    peak: '184 µg/m³ (+162%)',
    leadTime: '35 min lead',
    statisticalMargin: '±8.5 µg/m³',
    architecture: 'Gaussian Plume Advection-Diffusion',
    crossTime: '+1h',
    crossValue: 120,
    domain: [35, 190],
    data: [
      { time: 'Now', actual: 42.0, envelopeLower: 38.0, envelopeUpper: 50.0 },
      { time: '+15m', actual: 65.0, envelopeLower: 58.0, envelopeUpper: 78.0 },
      { time: '+30m', actual: 88.0, envelopeLower: 78.0, envelopeUpper: 108.0 },
      { time: '+45m', actual: 108.0, envelopeLower: 94.0, envelopeUpper: 134.0 },
      { time: '+1h', actual: 128.0, envelopeLower: 110.0, envelopeUpper: 156.0 },
      { time: '+1h 15m', actual: 148.0, envelopeLower: 124.0, envelopeUpper: 172.0 },
      { time: '+1h 30m', actual: 164.0, envelopeLower: 136.0, envelopeUpper: 182.0 },
      { time: '+1h 45m', actual: 176.0, envelopeLower: 144.0, envelopeUpper: 186.0 },
      { time: '+2h', actual: 184.0, envelopeLower: 150.0, envelopeUpper: 187.0 },
    ],
  },
  chemical: {
    id: 'chemical',
    name: 'Chemical',
    icon: '☢️',
    param: 'Chemical VOC (ppm)',
    color: '#eab308',
    peak: '72.4 ppm (Hazmat)',
    leadTime: '15 min lead',
    statisticalMargin: '±4.2 ppm',
    architecture: 'PID Electrochemical Dispersion Model',
    crossTime: '+30m',
    crossValue: 38,
    domain: [15, 75],
    data: [
      { time: 'Now', actual: 18.0, envelopeLower: 16.0, envelopeUpper: 23.0 },
      { time: '+15m', actual: 28.5, envelopeLower: 25.0, envelopeUpper: 36.0 },
      { time: '+30m', actual: 38.0, envelopeLower: 32.0, envelopeUpper: 48.0 },
      { time: '+45m', actual: 47.5, envelopeLower: 40.0, envelopeUpper: 58.0 },
      { time: '+1h', actual: 56.0, envelopeLower: 46.0, envelopeUpper: 66.0 },
      { time: '+1h 15m', actual: 63.5, envelopeLower: 51.0, envelopeUpper: 70.0 },
      { time: '+1h 30m', actual: 68.0, envelopeLower: 54.0, envelopeUpper: 72.5 },
      { time: '+1h 45m', actual: 70.8, envelopeLower: 56.0, envelopeUpper: 73.2 },
      { time: '+2h', actual: 72.4, envelopeLower: 57.0, envelopeUpper: 73.5 },
    ],
  },
}

// ── Exact Vector SVG Neural Trajectory Chart (Matches reference photo media_1790142246144) ───
function NeuralTrajectoryChart({ traj }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const width = 1000
  const height = 260
  const padLeft = 24
  const padRight = 24
  const yTop = 32
  const yBottom = 214
  const plotWidth = width - padLeft - padRight
  const plotHeight = yBottom - yTop

  const [minVal, maxVal] = traj.domain

  const valToY = (v) => {
    const ratio = Math.max(0, Math.min(1, (v - minVal) / (maxVal - minVal)))
    return yBottom - ratio * plotHeight
  }

  const points = traj.data.map((d, i) => ({
    ...d,
    index: i,
    x: padLeft + (i / (traj.data.length - 1)) * plotWidth,
    y: valToY(d.actual),
    yUpper: valToY(d.envelopeUpper),
    yLower: valToY(d.envelopeLower),
  }))

  // Smooth cubic Bezier spline through points (Catmull-Rom)
  const getSplinePath = (pts, keyY = 'y') => {
    if (!pts || pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0][keyY]}`
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0][keyY].toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1[keyY] + (p2[keyY] - p0[keyY]) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2[keyY] - (p3[keyY] - p1[keyY]) / 6
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2[keyY].toFixed(1)}`
    }
    return d
  }

  const linePath = getSplinePath(points, 'y')

  // Upper Envelope polygon (ice-blue shaded band above curve)
  const upperForward = getSplinePath(points, 'yUpper')
  const reversedPoints = [...points].reverse()
  const actualBackward = getSplinePath(reversedPoints, 'y').replace(/^M [^ ]+ [^ ]+/, '')
  const envelopePath = `${upperForward} L ${points[points.length - 1].x.toFixed(1)} ${points[points.length - 1].y.toFixed(1)} ${actualBackward} Z`

  // Lower Rose Shading under actual line down to yBottom
  const roseAreaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${yBottom} L ${points[0].x.toFixed(1)} ${yBottom} Z`

  // Crossing marker at +1h (index 4 or matched crossTime)
  const crossPoint = points.find((p) => p.time === (traj.crossTime || '+1h')) || points[4]
  const lastPoint = points[points.length - 1]

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: '310px' }}
      >
        <defs>
          {/* Subtle rose/pink gradient under trajectory */}
          <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.22} />
            <stop offset="65%" stopColor="#fda4af" stopOpacity={0.07} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
          </linearGradient>

          {/* Ice-blue envelope fill */}
          <linearGradient id="envelopeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity={0.35} />
          </linearGradient>
        </defs>

        {/* 3 Horizontal Subtle Grid Lines */}
        <line
          x1={padLeft - 4}
          y1={yTop}
          x2={width - padRight + 4}
          y2={yTop}
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1={padLeft - 4}
          y1={(yTop + yBottom) / 2}
          x2={width - padRight + 4}
          y2={(yTop + yBottom) / 2}
          stroke="#f1f5f9"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1={padLeft - 4}
          y1={yBottom}
          x2={width - padRight + 4}
          y2={yBottom}
          stroke="#f1f5f9"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Vertical Alert Marker Line at +1h */}
        {crossPoint && (
          <line
            x1={crossPoint.x}
            y1={yTop}
            x2={crossPoint.x}
            y2={yBottom + 4}
            stroke="#93c5fd"
            strokeWidth="1.8"
            strokeDasharray="4 4"
          />
        )}

        {/* Shaded Upper Blue Gaussian Uncertainty Envelope */}
        <path d={envelopePath} fill="url(#envelopeGradient)" />

        {/* Shaded Lower Rose Gradient under Red Curve */}
        <path d={roseAreaPath} fill="url(#roseGradient)" />

        {/* Bold Red Trajectory Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crossing Indicator Marker at +1h (Blue Hollow Circle with white center) */}
        {crossPoint && (
          <g>
            <circle
              cx={crossPoint.x}
              cy={crossPoint.y}
              r={6.5}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={3.5}
            />
          </g>
        )}

        {/* Peak Indicator Marker at +2h (Solid Red Circle) */}
        {lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={5.5}
            fill="#ef4444"
          />
        )}

        {/* Hover Guide Line and Point Highlight */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              y1={yTop}
              x2={activePoint.x}
              y2={yBottom}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={7}
              fill="#ef4444"
              opacity={0.25}
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={4}
              fill="#ef4444"
            />
          </g>
        )}

        {/* Interactive Hover Hit Areas for each point */}
        {points.map((p, i) => (
          <rect
            key={p.time}
            x={p.x - plotWidth / (points.length - 1) / 2}
            y={0}
            width={plotWidth / (points.length - 1)}
            height={height}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Bottom Monospace X-Axis Labels */}
        {points.map((p, i) => {
          let textAnchor = 'middle'
          if (i === 0) textAnchor = 'start'
          if (i === points.length - 1) textAnchor = 'end'
          return (
            <text
              key={p.time}
              x={p.x}
              y={yBottom + 26}
              textAnchor={textAnchor}
              fill="#94a3b8"
              fontSize="11"
              fontWeight="500"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            >
              {p.time}
            </text>
          )
        })}
      </svg>

      {/* Floating Tooltip when point is hovered */}
      {activePoint && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-mono shadow-xl border border-slate-700 space-y-0.5"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${Math.max(8, (activePoint.y / height) * 100 - 24)}%`,
          }}
        >
          <div className="text-cyan-400 font-bold flex items-center gap-1.5">
            <span>{activePoint.time}</span>
            <span className="text-[10px] text-slate-400 font-normal">Projection</span>
          </div>
          <div className="text-slate-200">
            Val: <strong className="text-white font-bold">{activePoint.actual}</strong>
          </div>
          <div className="text-slate-400 text-[10px]">
            Envelope: {activePoint.envelopeLower} – {activePoint.envelopeUpper}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const [selectedTrajectory, setSelectedTrajectory] = useState('flood')
  const traj = TRAJECTORY_MODELS[selectedTrajectory] || TRAJECTORY_MODELS.flood

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        {/* ─── 1. HEADER CARD ────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
              🧠
            </div>
            <div>
              <h1 className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight leading-snug">
                AI Environmental <span className="text-blue-600">Analysis & Explainability</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Qualcomm Edge-AI sensor fusion, cross-node spatial reinforcement, & neural trajectory forecasting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-slate-50 border border-slate-200/90 rounded-full px-4 py-1.5 text-xs text-slate-600 font-mono shadow-2xs">
              Model engine: <strong className="text-slate-900 font-bold">QNN TFLite v2.4</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200/90 rounded-full px-4 py-1.5 text-xs text-slate-600 font-mono shadow-2xs">
              Confidence: <strong className="text-emerald-600 font-bold">89.4% (R²)</strong>
            </div>
          </div>
        </div>

        {/* ─── 2. TELEMETRY STREAMS BAR ──────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
          {/* Top Label & Zone Filter */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                Telemetry Streams
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Realtime sync (15)</span>
              </span>
            </div>
            <div className="font-mono text-xs text-slate-400 font-semibold cursor-pointer hover:text-slate-600">
              Filter: All Zones
            </div>
          </div>

          {/* 6 Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. TEMPERATURE */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  TEMPERATURE
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Normal
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                32.4<span className="text-xs font-semibold text-slate-500 ml-0.5">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Peak: 35.1°C | Low: 21.0°C
              </div>
            </div>

            {/* 2. HUMIDITY */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  HUMIDITY
                </span>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Elevated
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                68<span className="text-xs font-semibold text-slate-500 ml-0.5">%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Dew point: 22.4°C | Sat: 88%
              </div>
            </div>

            {/* 3. AQI INDEX */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  AQI INDEX
                </span>
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Warning
                </span>
              </div>
              <div className="text-xl font-black text-amber-500 tracking-tight">
                142 <span className="text-xs font-bold text-amber-600">AQI</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                PM2.5: 58 | PM10: 92 µg/m³
              </div>
            </div>

            {/* 4. FIRE / SMOKE */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  FIRE / SMOKE
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Safe
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                Low <span className="text-xs font-semibold text-slate-500 font-normal">Lvl 1</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                CO: 0.07 ppm | VOC: &lt;0.01
              </div>
            </div>

            {/* 5. WATER LEVEL */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  WATER LEVEL
                </span>
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Surge
                </span>
              </div>
              <div className="text-xl font-black text-rose-600 tracking-tight">
                1.28 <span className="text-xs font-bold text-slate-500 font-normal">m</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                ↑ +0.4m in last 3 min
              </div>
            </div>

            {/* 6. GAS / TOXIC */}
            <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  GAS / TOXIC
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Nominal
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                412 <span className="text-xs font-semibold text-slate-500 font-normal">CO2</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Ozone: 31 ppb | SO2: 2.1
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. 2-HOUR AHEAD NEURAL PREDICTIVE TRAJECTORY ───────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Header Row & Hazard Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">📈</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                  2-HOUR AHEAD NEURAL PREDICTIVE TRAJECTORY
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Forward-looking crest projection modeled with Gaussian uncertainty envelope and spatial distance decay
                </p>
              </div>
            </div>

            {/* 4 Hazard Selector Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'flood', label: 'Flood', icon: '💧' },
                { id: 'thermal', label: 'Thermal', icon: '🔥' },
                { id: 'particulate', label: 'Particulate', icon: '📊' },
                { id: 'chemical', label: 'Chemical', icon: '☢️' },
              ].map((m) => {
                const isSel = selectedTrajectory === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedTrajectory(m.id)}
                    className={clsx(
                      'px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs',
                      isSel
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vector SVG Chart Canvas matching media_1790142246144 */}
          <div className="w-full pt-1 pb-1">
            <NeuralTrajectoryChart traj={traj} />
          </div>

          {/* 4 Stat Boxes Below Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                PROJECTED PEAK CREST
              </div>
              <div className="text-lg font-black text-rose-500 tracking-tight mt-1">
                {traj.peak}
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                LEAD TIME TO CREST
              </div>
              <div className="text-lg font-black text-emerald-600 tracking-tight mt-1">
                {traj.leadTime}
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                STATISTICAL MARGIN
              </div>
              <div className="text-lg font-black text-slate-900 tracking-tight mt-1 font-mono">
                {traj.statisticalMargin}
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                EDGE NEURAL ARCHITECTURE
              </div>
              <div className="text-xs sm:text-[13px] font-black text-slate-900 tracking-tight mt-1">
                {traj.architecture}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. AI PREDICTED DANGER ZONES — NEXT 2–3 HOURS ─────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-blue-500 text-lg">🛡️</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                  AI PREDICTED DANGER ZONES — NEXT 2–3 HOURS
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Spatial risk ranking across all monitored zones, generated from the same trajectory models above
                </p>
              </div>
            </div>
            <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-mono font-bold">
              3 zones flagged
            </div>
          </div>

          {/* 2-Column Grid: Left Radar Constellation + Right Ranked Danger Zones List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Midnight Grid Radar Constellation */}
            <div className="lg:col-span-5 bg-[#091528] rounded-2xl p-5 text-white shadow-xl relative min-h-[360px] flex flex-col justify-between overflow-hidden">
              <div className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                GUJARAT GRID · RISK PROJECTION
              </div>

              {/* Spatial Graph SVG Constellation */}
              <div className="relative w-full h-56 flex items-center justify-center my-2">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 220">
                  {/* Subtle Grid lines */}
                  <line x1="0" y1="55" x2="320" y2="55" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="0" y1="110" x2="320" y2="110" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="0" y1="165" x2="320" y2="165" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="80" y1="0" x2="80" y2="220" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="160" y1="0" x2="160" y2="220" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="240" y1="0" x2="240" y2="220" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />

                  {/* Connectors from center (160, 110) to outer nodes */}
                  <line x1="160" y1="110" x2="85" y2="60" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 4" />
                  <line x1="160" y1="110" x2="250" y2="70" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 4" />
                  <line x1="160" y1="110" x2="85" y2="165" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 4" />
                  <line x1="160" y1="110" x2="240" y2="155" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 4" />

                  {/* Node 1 (Center): Vasna Barrage (High Risk - Red Pulse) */}
                  <circle cx="160" cy="110" r="16" fill="rgba(244, 63, 94, 0.2)" className="animate-ping" />
                  <circle cx="160" cy="110" r="13" fill="#be123c" stroke="#f43f5e" strokeWidth="2.5" />
                  <text x="160" y="113" textAnchor="middle" fontSize="10" fill="#ffffff">💧</text>
                  <text x="160" y="132" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Vasna Barrage</text>

                  {/* Node 2 (Top Left): Vatva GIDC (Medium - Amber) */}
                  <circle cx="85" cy="60" r="11" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
                  <text x="85" y="63" textAnchor="middle" fontSize="9" fill="#ffffff">☢️</text>
                  <text x="85" y="80" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Vatva GIDC</text>

                  {/* Node 3 (Top Right): Chandola Lake (Low - Cyan) */}
                  <circle cx="250" cy="70" r="11" fill="#083344" stroke="#06b6d4" strokeWidth="2" />
                  <text x="250" y="73" textAnchor="middle" fontSize="9" fill="#ffffff">💧</text>
                  <text x="250" y="90" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Chandola Lake</text>

                  {/* Node 4 (Bottom Left): Naroda Rd. (Low - Cyan) */}
                  <circle cx="85" cy="165" r="11" fill="#083344" stroke="#06b6d4" strokeWidth="2" />
                  <text x="85" y="168" textAnchor="middle" fontSize="9" fill="#ffffff">🔥</text>
                  <text x="85" y="186" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Naroda Rd.</text>

                  {/* Node 5 (Bottom Right): Isanpur (Medium - Amber) */}
                  <circle cx="240" cy="155" r="11" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
                  <text x="240" y="158" textAnchor="middle" fontSize="9" fill="#ffffff">🏭</text>
                  <text x="240" y="176" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Isanpur</text>
                </svg>
              </div>

              {/* Bottom Legend */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>High (&lt;1h)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Medium (1–2h)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Low (2–3h)</span>
                </span>
              </div>
            </div>

            {/* Right Column: Ranked Danger Zones List */}
            <div className="lg:col-span-7 space-y-3 flex flex-col justify-between">
              {/* Zone 1: Vasna Barrage & Riverfront */}
              <div className="bg-white border-t border-r border-b border-slate-100 border-l-4 border-rose-500 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 mt-0.5">
                    💧
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Vasna Barrage & Riverfront
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Flood crest projected to exceed danger mark
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        rate-of-change ↑
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        upstream correlated
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-rose-600 text-xs sm:text-sm">
                    ETA 42 min
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    91% probability
                  </div>
                </div>
              </div>

              {/* Zone 2: Vatva GIDC Industrial Corridor */}
              <div className="bg-white border-t border-r border-b border-slate-100 border-l-4 border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 mt-0.5">
                    ☢️
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Vatva GIDC Industrial Corridor
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      VOC concentration trending toward emergency band
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        2 nodes correlated
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        wind-assisted
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-amber-600 text-xs sm:text-sm">
                    ETA 1h 20m
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    74% probability
                  </div>
                </div>
              </div>

              {/* Zone 3: Isanpur Residential Zone */}
              <div className="bg-white border-t border-r border-b border-slate-100 border-l-4 border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 mt-0.5">
                    🏭
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Isanpur Residential Zone
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      AQI forecast to cross 160 as plume disperses downwind
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        plume model
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        high density area
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-amber-600 text-xs sm:text-sm">
                    ETA 1h 45m
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    68% probability
                  </div>
                </div>
              </div>

              {/* Zone 4: Naroda Road Corridor */}
              <div className="bg-white border-t border-r border-b border-slate-100 border-l-4 border-cyan-400 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 mt-0.5">
                    🔥
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Naroda Road Corridor
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thermal signature rising slowly, well within margin
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        low confidence
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-cyan-600 text-xs sm:text-sm">
                    ETA 2h 40m
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    31% probability
                  </div>
                </div>
              </div>

              {/* Zone 5: Chandola Lake Basin */}
              <div className="bg-white border-t border-r border-b border-slate-100 border-l-4 border-cyan-400 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 mt-0.5">
                    💧
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Chandola Lake Basin
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Inflow steady; no crest expected within window
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        stable trend
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-bold text-cyan-600 text-xs sm:text-sm">
                    ETA 2h 55m
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    22% probability
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blue Callout Banner Below */}
          <div className="bg-blue-600 rounded-2xl p-4 sm:p-5 text-white flex items-center gap-3.5 shadow-md shadow-blue-500/20">
            <span className="text-xl flex-shrink-0">🔔</span>
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong>Why this matters:</strong> by forecasting 2–3 hours ahead instead of alerting only after a threshold is crossed, GSDMA field teams gain enough lead time to pre-position pumps, close gates, or issue evacuation notices before the hazard physically arrives — not after.
            </div>
          </div>
        </div>

        {/* ─── 5. FEATURE WEIGHT DECONSTRUCTION (WHY DID THE ALERT FIRE?) ── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🧠</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                  FEATURE WEIGHT DECONSTRUCTION (WHY DID THE ALERT FIRE?)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-channel on-device inference breakdown for Active Incident ALT-101
                </p>
              </div>
            </div>
            <div className="bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full px-3 py-1 text-xs font-mono font-bold">
              Fused score: 0.89
            </div>
          </div>

          {/* 4 Feature Weights Bars */}
          <div className="space-y-4 pt-1">
            {/* 1. Instantaneous Water Rate of Change */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">
                  Instantaneous Water Rate of Change (ΔW/dt)
                </span>
                <span className="font-mono font-bold text-blue-600">
                  +0.34 contribution
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[76%]" />
              </div>
              <div className="text-[11px] text-slate-400">
                Rising +22 cm/min acceleration detected across 8-sample rolling FIFO window.
              </div>
            </div>

            {/* 2. Upstream Sensor Correlation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">
                  Upstream Sensor Correlation (NODE-01 to NODE-02)
                </span>
                <span className="font-mono font-bold text-blue-600">
                  +0.28 contribution
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full w-[62%]" />
              </div>
              <div className="text-[11px] text-slate-400">
                Spatial distance decay confirmed neighbor surge 6.4 km upstream.
              </div>
            </div>

            {/* 3. Rain Gauge Precipitation Ingress */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">
                  Rain Gauge Precipitation Ingress
                </span>
                <span className="font-mono font-bold text-blue-600">
                  +0.18 contribution
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[42%]" />
              </div>
              <div className="text-[11px] text-slate-400">
                Tipping bucket recorded continuous 38 mm/hr catchment rainfall.
              </div>
            </div>

            {/* 4. Optical Smoke / Flare Inversion */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">
                  Optical Smoke / Flare Inversion
                </span>
                <span className="font-mono font-bold text-blue-600">
                  +0.09 contribution
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[20%]" />
              </div>
              <div className="text-[11px] text-slate-400">
                Background baseline normal; negligible contribution.
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6. CROSS-NODE SPATIAL REINFORCEMENT VISUAL PIPELINE ─────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📝</span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                CROSS-NODE SPATIAL REINFORCEMENT VISUAL PIPELINE
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                How upstream telemetry reinforces downstream alerts before local crest reaches flood stage
              </p>
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-5 space-y-3 font-mono text-xs">
            {/* Step 1 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-blue-600">
                NODE-01 (Upstream Dam)
              </span>
              <span className="font-bold text-rose-500">
                Surge Detected (T = 0)
              </span>
            </div>

            {/* Propagation Step 1 */}
            <div className="text-center text-[11px] text-slate-400 py-1">
              ↓ Spatial propagation: 4.8 km distance decay (22 min fluid transit lag) ↓
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-blue-600">
                NODE-02 (Canal Siphon)
              </span>
              <span className="font-bold text-amber-600">
                Reinforced Early Warning (+42 min lead)
              </span>
            </div>

            {/* Propagation Step 2 */}
            <div className="text-center text-[11px] text-slate-400 py-1">
              ↓ Multi-hop LoRa mesh relay (zero cloud WAN dependency) ↓
            </div>

            {/* Step 3 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-rose-500">
                NODE-06 (Vasna Barrage Downstream)
              </span>
              <span className="font-bold text-emerald-600">
                Gates Prepared Before Surge Arrival
              </span>
            </div>
          </div>
        </div>

        {/* ─── 7. FALSE-POSITIVE SUPPRESSION LOG ─────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-blue-500 text-lg">🛡️</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                  FALSE-POSITIVE SUPPRESSION LOG (PROVES AI OVER FIXED THRESHOLDS)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transient sensor anomalies classified as non-emergencies by the on-device model, preventing alert fatigue
                </p>
              </div>
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-mono font-bold">
              Zero false dispatches
            </div>
          </div>

          <div className="space-y-3">
            {/* Suppressed 1: NODE-04 */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-xs sm:text-sm font-mono">
                    NODE-04
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    (MQ-135 Gas Cell)
                  </span>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                    Spike: 78 ppm VOC
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  24 min ago
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vehicle exhaust transient from a passing diesel truck — rate-of-change decayed within 35s. Classified as non-hazard by the Qualcomm edge model.
              </p>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 pt-0.5">
                <span>✓</span>
                <span>Decision: Suppressed on-device (zero false alarm dispatch)</span>
              </div>
            </div>

            {/* Suppressed 2: NODE-07 */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-xs sm:text-sm font-mono">
                    NODE-07
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    (Ultrasonic Depth)
                  </span>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                    Spike: water surge +24 cm
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  1h 14m ago
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transient speed-boat wake at Kankaria lake. Multi-sensor fusion with adjacent flood nodes confirmed no regional reservoir rise.
              </p>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 pt-0.5">
                <span>✓</span>
                <span>Decision: Suppressed on-device</span>
              </div>
            </div>

            {/* Suppressed 3: NODE-03 */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-xs sm:text-sm font-mono">
                    NODE-03
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    (Thermal IR)
                  </span>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                    Spike: 46.2°C IR spike
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  3h 05m ago
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Solar glare reflection off a park maintenance vehicle roof. Optical flame channel was negative.
              </p>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 pt-0.5">
                <span>✓</span>
                <span>Decision: Suppressed on-device</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
