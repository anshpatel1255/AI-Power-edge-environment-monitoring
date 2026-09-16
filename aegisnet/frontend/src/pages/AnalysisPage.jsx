// pages/AnalysisPage.jsx — AI Data Analysis with Clean Overview & Pull-Down Telemetry Curves

import { useState } from 'react'
import { useStore } from '../store/useStore'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import clsx from 'clsx'

const MOCK_TEMP_DATA = [
  { time: '00:00', temp: 24.2 },
  { time: '04:00', temp: 23.8 },
  { time: '08:00', temp: 26.5 },
  { time: '12:00', temp: 31.8 },
  { time: '16:00', temp: 34.2 },
  { time: '20:00', temp: 29.5 },
  { time: 'Now',   temp: 28.4 },
]

const MOCK_AQI_DATA = [
  { time: '00:00', aqi: 28 },
  { time: '04:00', aqi: 24 },
  { time: '08:00', aqi: 45 },
  { time: '12:00', aqi: 78 },
  { time: '16:00', aqi: 112 },
  { time: '20:00', aqi: 62 },
  { time: 'Now',   aqi: 34 },
]

const MOCK_WATER_DATA = [
  { time: '00:00', level: 0.22 },
  { time: '04:00', level: 0.24 },
  { time: '08:00', level: 0.28 },
  { time: '12:00', level: 0.45 },
  { time: '16:00', level: 0.72 },
  { time: '20:00', level: 0.55 },
  { time: 'Now',   level: 0.38 },
]

export default function AnalysisPage() {
  const activeScenario = useStore((s) => s.activeScenario)

  // ─── Collapsible Pull-Down Toggles ──────────────────────────────────────────
  const [showCharts, setShowCharts] = useState(false)
  const [showHazardBreakdown, setShowHazardBreakdown] = useState(false)

  const isSurge = activeScenario === 'fire' || activeScenario === 'flood' || activeScenario === 'pollution'
  const currentRiskLevel = isSurge ? 'Critical 🔴' : 'Normal 🟢'

  const forecastPoints = [1, 2, 3, 4, 5, 6].map((hour) => {
    let floodScore = isSurge && activeScenario === 'flood' ? Math.min(100, 85 + hour * 2.5) : 25 + hour * 1.5
    let fireScore = isSurge && activeScenario === 'fire' ? Math.min(100, 88 + hour * 2.0) : 18 + hour * 0.8
    let aqiScore = isSurge && activeScenario === 'pollution' ? Math.min(100, 82 + hour * 3.0) : 28 + hour * 1.2

    return {
      hour: `+${hour}h`,
      flood: Math.round(floodScore),
      fire: Math.round(fireScore),
      pollution: Math.round(aqiScore),
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 bg-[#141A16] text-[#EDEDE9] space-y-5 font-mono">
      {/* ─── 1. Header Strip ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1F2921] border border-[#2D3B2F] px-5 py-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📊</span>
          <div>
            <h1 className="text-xl font-bold text-[#EDEDE9]">
              AI Environmental <span className="text-[#D97706]">Analysis</span>
            </h1>
            <p className="text-[11px] text-[#6B7280]">
              TensorFlow Lite Micro Edge Scoring & Multi-Hop Risk Trajectory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#141A16] border border-[#2D3B2F] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[#6B7280]">Confidence:</span> <b className="text-[#22C55E]">89.4% (R²)</b>
          </div>
          <div className="bg-[#141A16] border border-[#2D3B2F] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[#6B7280]">Advance Alert:</span> <b className="text-[#D97706]">+42 min</b>
          </div>
        </div>
      </div>

      {/* ─── 2. AI Risk Prediction Overview ──────────────────────────────── */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#EDEDE9] uppercase tracking-wide">
              🤖 Predictive Risk Trajectory (Next 1–6 Hours)
            </span>
            <span className="text-xs text-[#6B7280]">Status: <b className="text-[#EDEDE9]">{currentRiskLevel}</b></span>
          </div>

          <div className="text-[11px] text-[#D97706]">
            Early rate-of-rise inference active
          </div>
        </div>

        {/* Prediction Bar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {forecastPoints.map((pt) => {
            const peakHazard = Math.max(pt.flood, pt.fire, pt.pollution)
            const hazardColor = peakHazard >= 70 ? 'bg-[#EF4444]' : peakHazard >= 40 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'

            return (
              <div key={pt.hour} className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-2.5 text-center">
                <div className="text-xs font-bold text-[#D97706] mb-0.5">{pt.hour} Projected</div>
                <div className="text-lg font-bold text-[#EDEDE9] mb-1.5">{peakHazard} / 100</div>
                <div className="w-full bg-[#1F2921] rounded-full h-1.5 overflow-hidden border border-[#2D3B2F]">
                  <div className={clsx('h-full rounded-full transition-all', hazardColor)} style={{ width: `${peakHazard}%` }} />
                </div>
                <div className="text-[10px] text-[#6B7280] mt-1 flex justify-between">
                  <span>🌊 {pt.flood}</span>
                  <span>🔥 {pt.fire}</span>
                  <span>☁️ {pt.pollution}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 3. Telemetry Curves Section with Pull-Down Toggle ───────────── */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#EDEDE9] uppercase tracking-wide">
              24-Hour Telemetry Progression Curves
            </h2>
            <p className="text-[11px] text-[#6B7280]">Temperature, AQI, and Water-level time-series</p>
          </div>

          <button
            onClick={() => setShowCharts(!showCharts)}
            className="text-xs text-[#D97706] hover:text-white font-mono flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded hover:bg-[#141A16]"
          >
            <span>{showCharts ? 'Hide Trend Graphs' : 'Pull Down 24h Trend Graphs'}</span>
            <span className={clsx('pulldown-chevron text-[10px]', showCharts && 'open')}>▼</span>
          </button>
        </div>

        {/* Pull-Down Charts Content with Smooth Animation */}
        <div className={clsx('pulldown-wrapper', showCharts && 'open')}>
          <div className="pulldown-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-[#2D3B2F] animate-pulldown">
              {/* 1. Temp */}
              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#D97706]">📈 Temperature (°C)</span>
                  <span className="text-xs font-bold text-[#D97706]">28.4°C</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_TEMP_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3B2F" />
                      <XAxis dataKey="time" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2921', borderColor: '#2D3B2F', color: '#EDEDE9', fontSize: 11 }} />
                      <Area type="monotone" dataKey="temp" stroke="#D97706" fill="#D97706" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. AQI */}
              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#8B5CF6]">📈 AQI Pollution Index</span>
                  <span className="text-xs font-bold text-[#8B5CF6]">34 AQI</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_AQI_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3B2F" />
                      <XAxis dataKey="time" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2921', borderColor: '#2D3B2F', color: '#EDEDE9', fontSize: 11 }} />
                      <Area type="monotone" dataKey="aqi" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Water */}
              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#0D9488]">📈 Water Level (m)</span>
                  <span className="text-xs font-bold text-[#0D9488]">0.38 m</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_WATER_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3B2F" />
                      <XAxis dataKey="time" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2921', borderColor: '#2D3B2F', color: '#EDEDE9', fontSize: 11 }} />
                      <Area type="monotone" dataKey="level" stroke="#0D9488" fill="#0D9488" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Hazard Risk Physics Breakdown with Pull-Down Toggle ──────── */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#EDEDE9] uppercase tracking-wide">
              Hazard Physics & Algorithmic Models
            </h2>
            <p className="text-[11px] text-[#6B7280]">Edge rate-of-change formulas for Flood, Fire & Chemical AQI</p>
          </div>

          <button
            onClick={() => setShowHazardBreakdown(!showHazardBreakdown)}
            className="text-xs text-[#D97706] hover:text-white font-mono flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded hover:bg-[#141A16]"
          >
            <span>{showHazardBreakdown ? 'Hide Physics Breakdown' : 'Pull Down Physics & Logic'}</span>
            <span className={clsx('pulldown-chevron text-[10px]', showHazardBreakdown && 'open')}>▼</span>
          </button>
        </div>

        {/* Pull-Down Content with Smooth Grid Accordion */}
        <div className={clsx('pulldown-wrapper', showHazardBreakdown && 'open')}>
          <div className="pulldown-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#2D3B2F] animate-pulldown text-xs">
              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3 space-y-1.5">
                <div className="text-[#0D9488] font-bold">🌊 Flood: Ultrasonic Rise Velocity</div>
                <p className="text-[#6B7280] text-[11px] font-sans">
                  Tracks delta cm/min. If d(water)/dt &gt; +3.0 cm/min, early warning triggers before static floodwall height.
                </p>
                <div className="text-[10px] text-[#22C55E]">Govt Dispatch: Flood Relief & NDRF</div>
              </div>

              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3 space-y-1.5">
                <div className="text-[#F97316] font-bold">🔥 Fire: IR Flame + Thermal Gradient</div>
                <p className="text-[#6B7280] text-[11px] font-sans">
                  Correlates 760nm–1100nm infrared emission with rapid temp spikes (&gt;45°C) to eliminate false heat alerts.
                </p>
                <div className="text-[10px] text-[#22C55E]">Govt Dispatch: Fire Station 101</div>
              </div>

              <div className="bg-[#141A16] border border-[#2D3B2F] rounded-xl p-3 space-y-1.5">
                <div className="text-[#8B5CF6] font-bold">☁️ Air: Particulate & VOC Dispersion</div>
                <p className="text-[#6B7280] text-[11px] font-sans">
                  Combines MQ-2 smoke and MQ-135 ammonia/benzene resistance curve normalized against relative humidity.
                </p>
                <div className="text-[10px] text-[#22C55E]">Govt Dispatch: GPCB Gujarat Board</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
