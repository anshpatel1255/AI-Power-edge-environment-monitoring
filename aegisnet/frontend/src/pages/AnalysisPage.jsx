// pages/AnalysisPage.jsx — AI Edge-Correlation Pipeline, Predictive Trajectories & Telemetry Streams
import { useState } from 'react'
import { useStore } from '../store/useStore'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import clsx from 'clsx'

// ── Multi-Hazard 2-Hour Ahead Forecast Trajectories ──────────────────────────
const PREDICTIVE_TRAJECTORIES = {
  flood: {
    id: 'flood',
    name: 'Flood Water Crest (cm)',
    unit: 'cm',
    color: '#06b6d4',
    alertColor: '#ef4444',
    gradientId: 'floodForecastGrad',
    peak: '84.2 cm (+75.4%)',
    leadTime: '42 min lead',
    confidence: '±3.8 cm',
    model: 'LSTM Edge + 1D Hydro-Kinematic',
    domain: [40, 95],
    data: [
      { time: 'Now',     actual: 48.0, lower: 48.0, upper: 48.0, delta: '+0.0' },
      { time: '+15m',   actual: 51.2, lower: 50.0, upper: 53.5, delta: '+3.2' },
      { time: '+30m',   actual: null, lower: 52.8, upper: 59.0, delta: '+6.5' },
      { time: '+45m',   actual: null, lower: 56.5, upper: 65.2, delta: '+9.8' },
      { time: '+1h',    actual: null, lower: 60.2, upper: 72.0, delta: '+14.0' },
      { time: '+1h 15m',actual: null, lower: 64.0, upper: 78.5, delta: '+18.5' },
      { time: '+1h 30m',actual: null, lower: 67.5, upper: 82.8, delta: '+22.0' },
      { time: '+1h 45m',actual: null, lower: 69.8, upper: 84.2, delta: '+24.2' },
      { time: '+2h',    actual: null, lower: 71.0, upper: 83.5, delta: '+23.0' },
    ],
  },
  fire: {
    id: 'fire',
    name: 'Thermal / Forest IR (°C)',
    unit: '°C',
    color: '#f97316',
    alertColor: '#dc2626',
    gradientId: 'fireForecastGrad',
    peak: '58.6 °C (+84%)',
    leadTime: '18 min lead',
    confidence: '±1.9 °C',
    model: 'TinyML Micro Arrhenius Thermal Flux',
    domain: [25, 65],
    data: [
      { time: 'Now',     actual: 31.8, lower: 31.8, upper: 31.8, delta: '+0.0' },
      { time: '+15m',   actual: 34.5, lower: 33.2, upper: 36.4, delta: '+2.7' },
      { time: '+30m',   actual: null, lower: 35.8, upper: 42.0, delta: '+5.5' },
      { time: '+45m',   actual: null, lower: 38.0, upper: 47.5, delta: '+9.2' },
      { time: '+1h',    actual: null, lower: 41.2, upper: 53.0, delta: '+13.5' },
      { time: '+1h 15m',actual: null, lower: 43.5, upper: 56.8, delta: '+16.8' },
      { time: '+1h 30m',actual: null, lower: 44.8, upper: 58.6, delta: '+18.0' },
      { time: '+1h 45m',actual: null, lower: 43.0, upper: 57.2, delta: '+15.5' },
      { time: '+2h',    actual: null, lower: 41.5, upper: 54.0, delta: '+12.2' },
    ],
  },
  air: {
    id: 'air',
    name: 'Particulate PM2.5 (µg/m³)',
    unit: 'µg/m³',
    color: '#8b5cf6',
    alertColor: '#c026d3',
    gradientId: 'airForecastGrad',
    peak: '184 µg/m³ (+162%)',
    leadTime: '35 min lead',
    confidence: '±8.5 µg/m³',
    model: 'Gaussian Plume Advection-Diffusion',
    domain: [20, 210],
    data: [
      { time: 'Now',     actual: 42.0, lower: 42.0, upper: 42.0, delta: '+0' },
      { time: '+15m',   actual: 58.0, lower: 52.0, upper: 68.0, delta: '+16' },
      { time: '+30m',   actual: null, lower: 68.0, upper: 98.0, delta: '+34' },
      { time: '+45m',   actual: null, lower: 84.0, upper: 132.0, delta: '+56' },
      { time: '+1h',    actual: null, lower: 98.0, upper: 164.0, delta: '+78' },
      { time: '+1h 15m',actual: null, lower: 112.0, upper: 184.0, delta: '+94' },
      { time: '+1h 30m',actual: null, lower: 105.0, upper: 178.0, delta: '+88' },
      { time: '+1h 45m',actual: null, lower: 94.0, upper: 156.0, delta: '+72' },
      { time: '+2h',    actual: null, lower: 82.0, upper: 138.0, delta: '+54' },
    ],
  },
  chem: {
    id: 'chem',
    name: 'Chemical VOC (ppm)',
    unit: 'ppm',
    color: '#eab308',
    alertColor: '#ea580c',
    gradientId: 'chemForecastGrad',
    peak: '72.4 ppm (Hazmat)',
    leadTime: '15 min lead',
    confidence: '±4.2 ppm',
    model: 'PID Electrochemical Dispersion Model',
    domain: [10, 85],
    data: [
      { time: 'Now',     actual: 18.0, lower: 18.0, upper: 18.0, delta: '+0.0' },
      { time: '+15m',   actual: 24.5, lower: 22.0, upper: 28.5, delta: '+6.5' },
      { time: '+30m',   actual: null, lower: 28.0, upper: 42.0, delta: '+14.0' },
      { time: '+45m',   actual: null, lower: 34.5, upper: 56.8, delta: '+22.5' },
      { time: '+1h',    actual: null, lower: 39.0, upper: 68.5, delta: '+31.0' },
      { time: '+1h 15m',actual: null, lower: 42.5, upper: 72.4, delta: '+34.4' },
      { time: '+1h 30m',actual: null, lower: 38.0, upper: 66.0, delta: '+28.0' },
      { time: '+1h 45m',actual: null, lower: 32.5, upper: 54.2, delta: '+20.5' },
      { time: '+2h',    actual: null, lower: 26.0, upper: 44.0, delta: '+12.0' },
    ],
  },
}

// ── Sparkline Trend Mock Data for Telemetry Stream Cards ─────────────────────
const STREAM_SPARKLINES = {
  temp: [
    { v: 28.2 }, { v: 28.8 }, { v: 29.5 }, { v: 30.1 }, { v: 31.4 },
    { v: 32.4 }, { v: 33.8 }, { v: 34.6 }, { v: 35.1 }, { v: 34.2 }, { v: 32.4 }
  ],
  humidity: [
    { v: 76 }, { v: 74 }, { v: 72 }, { v: 70 }, { v: 69 },
    { v: 68 }, { v: 67 }, { v: 66 }, { v: 68 }, { v: 69 }, { v: 68 }
  ],
  aqi: [
    { v: 88 }, { v: 94 }, { v: 106 }, { v: 118 }, { v: 125 },
    { v: 134 }, { v: 140 }, { v: 148 }, { v: 152 }, { v: 146 }, { v: 142 }
  ],
  fire: [
    { v: 12 }, { v: 14 }, { v: 13 }, { v: 15 }, { v: 18 },
    { v: 16 }, { v: 15 }, { v: 19 }, { v: 17 }, { v: 16 }, { v: 15 }
  ],
  water: [
    { v: 0.62 }, { v: 0.68 }, { v: 0.74 }, { v: 0.85 }, { v: 0.94 },
    { v: 1.05 }, { v: 1.14 }, { v: 1.22 }, { v: 1.28 }, { v: 1.29 }, { v: 1.28 }
  ],
  gas: [
    { v: 380 }, { v: 388 }, { v: 395 }, { v: 402 }, { v: 408 },
    { v: 415 }, { v: 420 }, { v: 418 }, { v: 414 }, { v: 410 }, { v: 412 }
  ],
}

// ── Mini Sparkline Area Chart Component ──────────────────────────────────────
function MiniSparkline({ data, color, gradientId }) {
  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="90%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Custom Glassmorphic Tooltip for Forecast ─────────────────────────────────
function ForecastTooltip({ active, payload, label, unit }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/80 dark:border-slate-700/80 rounded-2xl p-3 shadow-xl text-xs font-mono space-y-1.5 min-w-[170px]">
        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
          <span>{label}</span>
          <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold">{data?.delta} {unit}</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400">
            <span>Projected Crest:</span>
            <b className="font-bold">{data?.upper} {unit}</b>
          </div>
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-300">
            <span>Baseline Path:</span>
            <b>{data?.lower} {unit}</b>
          </div>
          {data?.actual != null && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-1">
              <span>Actual Sensor:</span>
              <b>{data?.actual} {unit}</b>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

export default function AnalysisPage() {
  const suppressionLog = useStore((s) => s.suppressionLog)
  const [selectedHazard, setSelectedHazard] = useState('flood')

  const activeTraj = PREDICTIVE_TRAJECTORIES[selectedHazard] || PREDICTIVE_TRAJECTORIES.flood

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">
      {/* ─── Header Strip with Glassmorphism ───────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-md shadow-blue-500/25 ring-1 ring-white/30">
            🧠
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AI Environmental <span className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 bg-clip-text text-transparent">Analysis & Explainability</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Qualcomm Edge-AI Sensor Fusion, Cross-Node Spatial Reinforcement, & Neural Trajectory Forecasting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono flex-wrap">
          <div className="bg-slate-100/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="text-slate-500 dark:text-slate-400">Model Engine:</span>{' '}
            <b className="text-blue-600 dark:text-cyan-400">QNN TFLite v2.4</b>
          </div>
          <div className="bg-slate-100/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="text-slate-500 dark:text-slate-400">Confidence:</span>{' '}
            <b className="text-emerald-600 dark:text-emerald-400">89.4% (R²)</b>
          </div>
        </div>
      </div>

      {/* ─── 1. Telemetry Streams (6 Glass Cards with Luminous Wave Charts) ─ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
              Telemetry Streams
            </h2>
            <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              REALTIME SYNC (15)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Filter: All Zones</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Temperature */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-4.5 space-y-2.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>🌡️</span> TEMPERATURE
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                NORMAL
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">32.4°C</div>
              <div className="text-[10px] font-mono font-bold text-emerald-600">↗ +0.8°C/h</div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Peak: 35.1°C | Low: 21.0°C
            </div>
            <MiniSparkline data={STREAM_SPARKLINES.temp} color="#10b981" gradientId="sparkTemp" />
          </div>

          {/* Card 2: Relative Humidity */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-4.5 space-y-2.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>💧</span> HUMIDITY
              </span>
              <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                ELEVATED
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">68%</div>
              <div className="text-[10px] font-mono font-bold text-slate-500">→ Steady</div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Dew Point: 22.4°C | Sat: 88%
            </div>
            <MiniSparkline data={STREAM_SPARKLINES.humidity} color="#06b6d4" gradientId="sparkHumidity" />
          </div>

          {/* Card 3: AQI Index */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-4.5 space-y-2.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>🌫️</span> AQI INDEX
              </span>
              <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                WARNING
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-amber-600">142 <span className="text-xs text-slate-500 font-normal">AQI</span></div>
              <div className="text-[10px] font-mono font-bold text-rose-500">Sensitive</div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              PM2.5: 58 | PM10: 92 µg/m³
            </div>
            <MiniSparkline data={STREAM_SPARKLINES.aqi} color="#f59e0b" gradientId="sparkAqi" />
          </div>

          {/* Card 4: Fire Risk */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-4.5 space-y-2.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>🔥</span> FIRE / SMOKE
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                SAFE
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">LOW <span className="text-xs text-slate-500 font-normal">Lvl 1</span></div>
              <div className="text-[10px] font-mono font-bold text-emerald-600">FLIR Nom</div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              CO: 0.07 ppm | VOC: &lt;0.01
            </div>
            <MiniSparkline data={STREAM_SPARKLINES.fire} color="#10b981" gradientId="sparkFire" />
          </div>

          {/* Card 5: Water Level */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-4.5 space-y-2.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>🌊</span> WATER LEVEL
              </span>
              <span className="bg-red-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                SURGE
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-red-600">1.28 m</div>
              <div className="text-[10px] font-mono font-bold text-red-600">↑ +0.4m Sec 3</div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Catchment Capacity: 74%
            </div>
            <MiniSparkline data={STREAM_SPARKLINES.water} color="#ef4444" gradientId="sparkWater" />
          </div>

          {/* Card 6: Gas Pollutants */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-4.5 space-y-2.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>☣️</span> GAS / TOXIC
              </span>
              <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                NOMINAL
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">412 <span className="text-xs text-slate-500 font-normal">CO2</span></div>
              <div className="text-[10px] font-mono font-bold text-slate-500">12 ppb NO2</div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Ozone: 31 ppb | SO2: 2.1
            </div>
            <MiniSparkline data={STREAM_SPARKLINES.gas} color="#8b5cf6" gradientId="sparkGas" />
          </div>
        </div>
      </div>

      {/* ─── 2. Interactive Predictive Trajectory Forecast (Hero Graph) ──── */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight font-mono uppercase">
                2-Hour Ahead Neural Predictive Trajectory
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Forward-looking crest projection modeled with Gaussian uncertainty envelope and spatial distance decay
            </p>
          </div>

          {/* Hazard Selector Tabs */}
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto scrollbar-none">
            {Object.values(PREDICTIVE_TRAJECTORIES).map((h) => {
              const isSelected = selectedHazard === h.id
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHazard(h.id)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <span>{h.id === 'flood' ? '🌊' : h.id === 'fire' ? '🔥' : h.id === 'air' ? '🌫️' : '☣️'}</span>
                  <span>{h.name.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Real Dynamic Graph with Glowing Area & Neon Lines */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeTraj.data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                {/* Luminous Shaded Confidence Band Gradient */}
                <linearGradient id={activeTraj.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeTraj.alertColor} stopOpacity={0.28} />
                  <stop offset="50%" stopColor={activeTraj.color} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={activeTraj.color} stopOpacity={0.0} />
                </linearGradient>
                {/* Lower Baseline Fill */}
                <linearGradient id="lowerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeTraj.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={activeTraj.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} fontStyle="italic" />
              <YAxis stroke="#94a3b8" fontSize={11} domain={activeTraj.domain} />
              <Tooltip content={<ForecastTooltip unit={activeTraj.unit} />} />

              {/* Shaded Uncertainty Envelope Area */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="transparent"
                fill={`url(#${activeTraj.gradientId})`}
                isAnimationActive={true}
              />

              {/* Projected Upper Surge / Crest (Dashed Alert Line) */}
              <Line
                type="monotone"
                dataKey="upper"
                stroke={activeTraj.alertColor}
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: activeTraj.alertColor, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: activeTraj.alertColor, stroke: '#ffffff', strokeWidth: 2 }}
                name="Projected Upper Crest"
              />

              {/* Conservative Trajectory (Solid Luminous Curve) */}
              <Line
                type="monotone"
                dataKey="lower"
                stroke={activeTraj.color}
                strokeWidth={3}
                dot={{ r: 4, fill: activeTraj.color, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: activeTraj.color, stroke: '#ffffff', strokeWidth: 2 }}
                name="Conservative Baseline"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live Forecast KPI Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3 rounded-2xl font-mono text-xs">
            <div className="text-slate-400 text-[10px] uppercase">Projected Peak Crest</div>
            <div className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">{activeTraj.peak}</div>
          </div>
          <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3 rounded-2xl font-mono text-xs">
            <div className="text-slate-400 text-[10px] uppercase">Lead Time to Crest</div>
            <div className="text-base font-bold text-blue-600 dark:text-cyan-400 mt-0.5">{activeTraj.leadTime}</div>
          </div>
          <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3 rounded-2xl font-mono text-xs">
            <div className="text-slate-400 text-[10px] uppercase">Statistical Margin</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeTraj.confidence}</div>
          </div>
          <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3 rounded-2xl font-mono text-xs">
            <div className="text-slate-400 text-[10px] uppercase">Edge Neural Architecture</div>
            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mt-1">{activeTraj.model}</div>
          </div>
        </div>
      </div>

      {/* ─── 3. Feature Weight Deconstruction (Explainable AI) ─────────── */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
              Feature Weight Deconstruction (Why Did the Alert Fire?)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-channel on-device inference breakdown for Active Incident ALT-101
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/40 border border-blue-200/80 dark:border-blue-700/60 px-3 py-1 rounded-full shadow-xs">
            Fused Score: 0.89 Fused Risk
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { feature: 'Instantaneous Water Rate of Change (ΔW/dt)', weight: '+0.34', pct: 85, color: '#2563eb', desc: 'Rising +22 cm/min acceleration detected across 8-sample rolling FIFO window.' },
            { feature: 'Upstream Sensor Correlation (NODE-01 to NODE-02)', weight: '+0.28', pct: 72, color: '#06b6d4', desc: 'Spatial distance decay confirmed neighbor surge 6.4 km upstream.' },
            { feature: 'Rain Gauge Precipitation Ingress', weight: '+0.18', pct: 45, color: '#3b82f6', desc: 'Tipping bucket recorded continuous 38 mm/hr catchment rainfall.' },
            { feature: 'Optical Smoke / Flare Inversion', weight: '+0.09', pct: 25, color: '#f97316', desc: 'Background baseline normal; negligible contribution.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-4 rounded-2xl space-y-2 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.feature}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{item.weight} Contribution</span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2.5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. Cross-Node Spatial Reinforcement Visual ───────────────── */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white font-mono uppercase">
            Cross-Node Spatial Reinforcement Visual Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            How upstream telemetry reinforces downstream alerts before local crest reaches flood stage
          </p>
        </div>

        <div className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4.5 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600 dark:text-cyan-400">NODE-01 (Upstream Dam)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Surge Detected (T = 0)</span>
          </div>
          <div className="text-center text-slate-400 font-bold text-[11px]">
            ↓ Spatial Propagation: 4.8 km distance decay (22 min fluid transit lag) ↓
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-600 dark:text-cyan-300">NODE-02 (Canal Siphon)</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Reinforced Early Warning (+42 min lead)</span>
          </div>
          <div className="text-center text-slate-400 font-bold text-[11px]">
            ↓ Multi-Hop LoRa Mesh Relay (Zero Cloud WAN Dependency) ↓
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-600 dark:text-red-400">NODE-06 (Vasna Barrage Downstream)</span>
            <span className="text-red-600 dark:text-red-400 font-bold">Gates Prepared Before Surge Arrival</span>
          </div>
        </div>
      </div>

      {/* ─── 5. False-Positive Edge Model Suppression Log ───────────────── */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase font-mono flex items-center gap-2">
              <span>🛡️</span> False-Positive Suppression Log (Proves AI Over Fixed Thresholds)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transient sensor anomalies classified as non-emergencies by the on-device model, preventing alert fatigue
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full shadow-xs">
            Zero False Dispatches
          </span>
        </div>

        <div className="space-y-3">
          {suppressionLog.map((sup) => (
            <div
              key={sup.id}
              className="bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 text-xs space-y-1.5 transition-all hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 hover:shadow-xs"
            >
              <div className="flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{sup.node_id}</span>
                  <span className="text-slate-500 dark:text-slate-400">({sup.sensor})</span>
                  <span className="bg-amber-100/90 dark:bg-amber-900/40 border border-amber-200/80 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Spike: {sup.spike_val}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">{sup.time}</span>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{sup.reason}</p>

              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                <span>✓ Decision:</span>
                <span>{sup.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

