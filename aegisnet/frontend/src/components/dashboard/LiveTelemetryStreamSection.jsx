// components/dashboard/LiveTelemetryStreamSection.jsx
// Live Sensor Trend Matrix — Six channels with live peak, low, rate of change,
// smooth gradient wave charts, and real-time dynamic hardware integration.

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import clsx from 'clsx'

// Helper component for smooth SVG Area Wave with fill gradient & glowing end dot
function WaveChart({ points = [], color = '#2563EB', gradientId = 'waveGrad' }) {
  const width = 160
  const height = 46

  if (!points || points.length < 2) {
    return (
      <div className="w-40 h-12 flex-shrink-0 overflow-visible relative flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible opacity-30">
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      </div>
    )
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = (max - min) || 1

  // Generate SVG curve points
  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 12) - 6
    return { x, y }
  })

  // Build path with bezier smooth curves or polyline
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
    <div className="w-40 h-12 flex-shrink-0 overflow-visible relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        {/* Shaded Area */}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        {/* Crisp Wave Stroke */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Latest Reading Pulsing Glow Dot */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3.5"
          fill={color}
        />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="6.5"
          fill={color}
          className="animate-ping opacity-60"
        />
      </svg>
    </div>
  )
}

export default function LiveTelemetryStreamSection() {
  const esp32Nodes       = useStore((s) => s.esp32Nodes)
  const usbConnected     = useStore((s) => s.usbConnected)
  const masterGatewayStatus = useStore((s) => s.masterGatewayStatus)
  const isMasterOnline   = masterGatewayStatus === 'ONLINE'
  const usbPortName      = useStore((s) => s.usbPortName)
  const telemetryHistory = useStore((s) => s.telemetryHistory)
  const lastSyncTime     = useStore((s) => s.lastSyncTime)
  const surgeActive      = useStore((s) => s.surgeActive)
  const toggleSurge      = useStore((s) => s.toggleSurge)
  const streamActive     = useStore((s) => s.streamActive)
  const setStreamActive  = useStore((s) => s.setStreamActive)
  const setModalOpen     = useStore((s) => s.setUsbModalOpen)

  // Local flash pulse on sync
  const [pulsing, setPulsing] = useState(false)
  const lastSyncRef = useRef(lastSyncTime)

  useEffect(() => {
    if (lastSyncTime !== lastSyncRef.current) {
      lastSyncRef.current = lastSyncTime
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 450)
      return () => clearTimeout(t)
    }
  }, [lastSyncTime])

  // Extract live hardware values if present from esp32Nodes
  const floodHw = esp32Nodes.find((n) => n.node_id?.includes('FLOOD'))
  const cotempHw = esp32Nodes.find((n) => n.node_id?.includes('COTEMP'))
  const pollutionHw = esp32Nodes.find((n) => n.node_id?.includes('POLLUTION'))

  const isFloodLive = Boolean(floodHw?.is_live_hw && floodHw.water_level_cm != null)
  const isCotempLive = Boolean(cotempHw?.is_live_hw && cotempHw.temperature_c != null)
  const isPollutionLive = Boolean(pollutionHw?.is_live_hw && pollutionHw.smoke_aqi != null)

  // Calculate live statistical summaries (current, peak, low, change)
  const computeStats = (series = [], isLive = false, hwVal = null, unit = '', decimals = 1) => {
    const validSeries = Array.isArray(series) ? series.filter(v => v !== null && v !== undefined && !Number.isNaN(v)) : []
    const hasData = isLive && ((hwVal !== null && hwVal !== undefined && !Number.isNaN(hwVal)) || validSeries.length > 0)

    if (!hasData) {
      return {
        hasData: false,
        currentStr: '--',
        peakStr: '--',
        lowStr: '--',
        changeStr: '--',
        status: 'Offline',
        statusCls: 'bg-slate-100 text-slate-500 border border-slate-200/80',
        points: []
      }
    }

    const current = (hwVal !== null && hwVal !== undefined && !Number.isNaN(hwVal))
      ? hwVal
      : validSeries[validSeries.length - 1]

    const list = validSeries.length > 0 ? validSeries : [current]
    const minVal = Math.min(...list)
    const maxVal = Math.max(...list)
    const prevVal = list.length > 1 ? list[list.length - 2] : current
    const delta = current - prevVal
    const pct = prevVal && prevVal !== 0 ? ((delta / prevVal) * 100) : 0

    let status = 'Steady'
    let statusCls = 'bg-slate-100 text-slate-600 border border-slate-200/60'
    if (delta > 0.05) {
      status = 'Rising'
      statusCls = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
    } else if (delta < -0.05) {
      status = 'Falling'
      statusCls = 'bg-sky-50 text-sky-700 border border-sky-200/60'
    }

    return {
      hasData: true,
      current,
      currentStr: current.toFixed(decimals),
      peakStr: `${maxVal.toFixed(decimals)} ${unit}`.trim(),
      lowStr: `${minVal.toFixed(decimals)} ${unit}`.trim(),
      changeStr: `${delta >= 0 ? '+' : ''}${delta.toFixed(decimals)} ${unit} (${(pct >= 0 ? '+' : '')}${pct.toFixed(1)}%)`.trim(),
      status,
      statusCls,
      points: list.length > 1 ? list : [list[0], list[0]]
    }
  }

  const water = computeStats(telemetryHistory?.water, isFloodLive, floodHw?.water_level_cm, 'cm', 1)
  const temp  = computeStats(telemetryHistory?.temp,  isCotempLive, cotempHw?.temperature_c, '°C', 1)
  const hum   = computeStats(telemetryHistory?.hum,   isCotempLive, cotempHw?.humidity_pct, '%', 1)
  const co    = computeStats(telemetryHistory?.co,    isCotempLive, cotempHw?.gas_ppm, 'ppm', 2)
  const aqi   = computeStats(telemetryHistory?.aqi,   isPollutionLive, pollutionHw?.smoke_aqi, 'AQI', 0)

  const isFlameDetected = isCotempLive ? (cotempHw?.flame_detected || surgeActive) : surgeActive

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 transition-all font-sans">
      
      {/* ─── Header: Icon + Title + Action Pills ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-xs border border-blue-100/80 flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l3-9 4 18 3-9h6" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
              Live sensor trend matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Six channels with live peak, low and rate of change.
            </p>
          </div>
        </div>

        {/* Right: Controls & Stream Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1">
            {isMasterOnline ? 'Sampling every 1.5 s' : 'Awaiting ESP32 Gateway (Offline)'}
          </span>

          {/* Simulate Surge Button */}
          <button
            type="button"
            onClick={toggleSurge}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer',
              surgeActive
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            <span className="text-blue-600 text-xs">⚡</span>
            <span>Simulate surge</span>
          </button>

          {/* Live stream status badge */}
          {isMasterOnline ? (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Live stream active</span>
            </span>
          ) : (
            <span className="bg-rose-50 text-rose-700 border border-rose-200/90 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span>Master Gateway Offline</span>
            </span>
          )}

          {/* COM7 port badge */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-200/80 transition-colors cursor-pointer"
          >
            <span className="text-slate-500 font-bold">&gt;_</span>
            <span>{usbPortName || 'COM7 port'}</span>
          </button>
        </div>
      </div>

      {/* ─── 6 Channel Cards (2 Rows of 3 Columns) ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Card 1: Water depth */}
        <div className="bg-slate-50/50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm border border-blue-100/80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-900">Water depth</span>
            </div>
            <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full border', water.statusCls)}>
              {water.status}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
              {water.currentStr} {water.hasData && <span className="text-xs font-semibold text-slate-500">cm</span>}
            </div>
            <WaveChart points={water.points} color="#2563EB" gradientId="waveWater" />
          </div>

          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-3 text-[11px] text-slate-500">
            <div>
              <div className="text-[10px] text-slate-400">Peak</div>
              <div className="font-bold text-slate-800 mt-0.5">{water.peakStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Low</div>
              <div className="font-bold text-slate-800 mt-0.5">{water.lowStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Change</div>
              <div className="font-bold text-slate-800 mt-0.5">{water.changeStr}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Temperature */}
        <div className="bg-slate-50/50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-sm border border-orange-100/80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-900">Temperature</span>
            </div>
            <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full border', temp.statusCls)}>
              {temp.status}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
              {temp.currentStr} {temp.hasData && <span className="text-xs font-semibold text-slate-500">°C</span>}
            </div>
            <WaveChart points={temp.points} color="#F97316" gradientId="waveTemp" />
          </div>

          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-3 text-[11px] text-slate-500">
            <div>
              <div className="text-[10px] text-slate-400">Peak</div>
              <div className="font-bold text-slate-800 mt-0.5">{temp.peakStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Low</div>
              <div className="font-bold text-slate-800 mt-0.5">{temp.lowStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Change</div>
              <div className="font-bold text-slate-800 mt-0.5">{temp.changeStr}</div>
            </div>
          </div>
        </div>

        {/* Card 3: Humidity */}
        <div className="bg-slate-50/50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm border border-cyan-100/80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-900">Humidity</span>
            </div>
            <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full border', hum.statusCls)}>
              {hum.status}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
              {hum.currentStr} {hum.hasData && <span className="text-xs font-semibold text-slate-500">%</span>}
            </div>
            <WaveChart points={hum.points} color="#06B6D4" gradientId="waveHum" />
          </div>

          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-3 text-[11px] text-slate-500">
            <div>
              <div className="text-[10px] text-slate-400">Peak</div>
              <div className="font-bold text-slate-800 mt-0.5">{hum.peakStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Low</div>
              <div className="font-bold text-slate-800 mt-0.5">{hum.lowStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Change</div>
              <div className="font-bold text-slate-800 mt-0.5">{hum.changeStr}</div>
            </div>
          </div>
        </div>

        {/* Card 4: CO gas (MQ-7) */}
        <div className="bg-slate-50/50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm border border-rose-100/80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10 2v7.31L4.35 19.46A2 2 0 0 0 6.09 22h11.82a2 2 0 0 0 1.74-2.54L14 9.31V2" />
                  <path d="M8.5 2h7" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-900">CO gas (MQ-7)</span>
            </div>
            <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full border', co.statusCls)}>
              {co.status}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
              {co.currentStr} {co.hasData && <span className="text-xs font-semibold text-slate-500">ppm</span>}
            </div>
            <WaveChart points={co.points} color="#EF4444" gradientId="waveCO" />
          </div>

          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-3 text-[11px] text-slate-500">
            <div>
              <div className="text-[10px] text-slate-400">Peak</div>
              <div className="font-bold text-slate-800 mt-0.5">{co.peakStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Low</div>
              <div className="font-bold text-slate-800 mt-0.5">{co.lowStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Change</div>
              <div className="font-bold text-slate-800 mt-0.5">{co.changeStr}</div>
            </div>
          </div>
        </div>

        {/* Card 5: PM2.5 AQI */}
        <div className="bg-slate-50/50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm border border-purple-100/80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-900">PM2.5 AQI</span>
            </div>
            <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full border', aqi.statusCls)}>
              {aqi.status}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
              {aqi.currentStr} {aqi.hasData && <span className="text-xs font-semibold text-slate-500">AQI</span>}
            </div>
            <WaveChart points={aqi.points} color="#8B5CF6" gradientId="waveAQI" />
          </div>

          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-3 text-[11px] text-slate-500">
            <div>
              <div className="text-[10px] text-slate-400">Peak</div>
              <div className="font-bold text-slate-800 mt-0.5">{aqi.peakStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Low</div>
              <div className="font-bold text-slate-800 mt-0.5">{aqi.lowStr}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Change</div>
              <div className="font-bold text-slate-800 mt-0.5">{aqi.changeStr}</div>
            </div>
          </div>
        </div>

        {/* Card 6: Flame sensor */}
        <div className="bg-slate-50/50 hover:bg-white border border-slate-200/80 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-sm border border-orange-100/80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-900">Flame sensor</span>
            </div>
            <span className={clsx(
              'text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
              isFlameDetected
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : isCotempLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                : 'bg-slate-100 text-slate-500 border-slate-200/80'
            )}>
              {isFlameDetected ? 'Active' : isCotempLive ? 'Clear' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-2xs',
              isFlameDetected
                ? 'bg-red-100 text-red-600 animate-bounce'
                : isCotempLive
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-slate-100 text-slate-400'
            )}>
              {isFlameDetected ? '🔥' : isCotempLive ? '✓' : '○'}
            </div>
            <div>
              <div className={clsx(
                'text-lg font-extrabold tracking-tight',
                isFlameDetected ? 'text-red-600' : isCotempLive ? 'text-slate-900' : 'text-slate-500'
              )}>
                {isFlameDetected ? 'Flame Detected' : isCotempLive ? 'Clear' : 'Standby / Offline'}
              </div>
              <div className="text-[10px] text-slate-400">
                {isFlameDetected
                  ? 'High IR pulse triggered in sector'
                  : isCotempLive
                  ? 'Normal ambient spectrum'
                  : 'Awaiting ESP32-COTEMP on USB COM port'}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-3 text-[11px] text-slate-500">
            <div>
              <div className="text-[10px] text-slate-400">Edge SLA</div>
              <div className="font-bold text-slate-800 mt-0.5">{isCotempLive ? 'Under 100 ms' : '--'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Siren</div>
              <div className={clsx('font-bold mt-0.5', isFlameDetected ? 'text-red-600 animate-pulse' : 'text-slate-800')}>
                {isFlameDetected ? 'Siren Active' : 'Standby'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Port COM7</div>
              <div className="font-bold text-slate-800 mt-0.5">
                {usbConnected ? 'Active' : isCotempLive ? 'Connected' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
