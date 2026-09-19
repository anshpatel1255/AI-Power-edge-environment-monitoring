// components/dashboard/LiveTelemetryStreamSection.jsx
// Live Multi-Sensor Telemetry & Trend Matrix — Real-time dynamic stream showing live
// Temperature, Flood/Water Level, Soil Moisture, CO Gas, Flame, PM2.5 AQI with live UP & DOWN trend deltas.

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import clsx from 'clsx'

// Helper component for mini SVG sparkline
function Sparkline({ points = [], color = '#059669' }) {
  if (!points || points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = (max - min) || 1
  const width = 105
  const height = 30
  
  const pathData = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 6) - 3
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  const lastPoint = points[points.length - 1]
  const lastY = height - ((lastPoint - min) / range) * (height - 6) - 3

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Little glow dot on latest point */}
      <circle
        cx={width}
        cy={lastY}
        r="3.5"
        fill={color}
      />
      <circle
        cx={width}
        cy={lastY}
        r="6"
        fill={color}
        className="animate-ping opacity-60"
      />
    </svg>
  )
}

export default function LiveTelemetryStreamSection() {
  const esp32Nodes       = useStore((s) => s.esp32Nodes)
  const usbConnected     = useStore((s) => s.usbConnected)
  const usbPortName      = useStore((s) => s.usbPortName)
  const usbPacketCount   = useStore((s) => s.usbPacketCount)
  const telemetryHistory = useStore((s) => s.telemetryHistory)
  const lastSyncTime     = useStore((s) => s.lastSyncTime)
  const surgeActive      = useStore((s) => s.surgeActive)
  const toggleSurge      = useStore((s) => s.toggleSurge)
  const streamActive     = useStore((s) => s.streamActive)
  const setStreamActive  = useStore((s) => s.setStreamActive)
  const setModalOpen     = useStore((s) => s.setUsbModalOpen)

  // Local flash/pulse effect on sync tick
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

  // Helper to compute live Upper Peak, Down Minimum, Delta and Direction
  const computeStats = (series = []) => {
    if (!series || series.length === 0) {
      return { current: 0, upper: 0, down: 0, delta: 0, isUp: false, isDown: false, pctChange: '0.0' }
    }
    const minVal = Math.min(...series)
    const maxVal = Math.max(...series)
    const currentVal = series[series.length - 1]
    const prevVal = series[series.length - 2] ?? currentVal
    const delta = currentVal - prevVal
    const isUp = delta > 0.001
    const isDown = delta < -0.001
    return {
      current: currentVal,
      upper: maxVal,
      down: minVal,
      delta: parseFloat(delta.toFixed(2)),
      isUp,
      isDown,
      pctChange: prevVal ? ((delta / prevVal) * 100).toFixed(1) : '0.0',
    }
  }

  const waterStats = computeStats(telemetryHistory?.water || [45])
  const soilStats  = computeStats(telemetryHistory?.soil || [65])
  const tempStats  = computeStats(telemetryHistory?.temp || [29.5])
  const humStats   = computeStats(telemetryHistory?.hum || [58])
  const coStats    = computeStats(telemetryHistory?.co || [2.5])
  const aqiStats   = computeStats(telemetryHistory?.aqi || [52])

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 transition-all">
      
      {/* ─── Header: Live Telemetry & Up/Down Stream Status ─────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all shadow-xs',
            pulsing ? 'bg-emerald-600 text-white scale-110' : 'bg-emerald-100 text-emerald-800'
          )}>
            📡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Live Sensor Telemetry & Trend Matrix
              </h2>
              <span className={clsx(
                'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 transition-all',
                usbConnected
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : pulsing
                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              )}>
                <span className={clsx('w-2 h-2 rounded-full', usbConnected || pulsing ? 'bg-white animate-ping' : 'bg-emerald-500')} />
                {usbConnected ? `COM7 LIVE SYNC (${usbPortName || 'USB'})` : 'DYNAMIC SAMPLING LIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-channel real-time sensor stream with live Upper & Down tracking and delta rate-of-change
            </p>
          </div>
        </div>

        {/* Live Controls & Sync Time */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-right hidden sm:block mr-1">
            <div className="text-[10px] text-slate-400 font-mono">
              {usbConnected ? `Packets RX: ${usbPacketCount}` : 'Continuous Stream (1.5s)'}
            </div>
            <div className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1">
              <span className={clsx('font-bold', pulsing ? 'text-emerald-500 scale-125' : 'text-emerald-600')}>●</span>
              <span>Sync: {lastSyncTime}</span>
            </div>
          </div>

          {/* Simulate Surge Spike Button */}
          <button
            type="button"
            onClick={toggleSurge}
            className={clsx(
              'text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1',
              surgeActive
                ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            )}
            title="Simulates rapid surge spikes to test real-time alarms"
          >
            <span>{surgeActive ? '🚨 Stop Surge' : '⚡ Simulate Surge'}</span>
          </button>

          {/* Pause / Resume Ticker */}
          <button
            type="button"
            onClick={() => setStreamActive(!streamActive)}
            className={clsx(
              'text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer',
              streamActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-100 text-amber-900 border-amber-300'
            )}
          >
            {streamActive ? '❚❚ Live Stream Active' : '▶ Resume Stream'}
          </button>

          {/* USB Modal Button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔌</span>
            <span>COM7 Port</span>
          </button>
        </div>
      </div>

      {/* ─── 6-Card Real-Time Telemetry Matrix with Up & Down Indicators ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">

        {/* 1. FLOOD / WATER LEVEL */}
        <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <span>🌊</span> Water Depth
              </span>
              {/* Up/Down badge: Distance dropping means water rising! */}
              <span className={clsx(
                'font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-colors',
                waterStats.delta < 0
                  ? 'bg-rose-100 text-rose-700'
                  : waterStats.delta > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              )}>
                {waterStats.delta < 0 ? '▲ Rising' : waterStats.delta > 0 ? '▼ Falling' : '— Steady'}
              </span>
            </div>

            {/* Current Value */}
            <div className="my-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-blue-950">
                {waterStats.current.toFixed(1)} <span className="text-xs font-normal text-slate-500">cm</span>
              </div>
              <Sparkline points={telemetryHistory?.water} color="#2563EB" />
            </div>
          </div>

          {/* Upper & Down Range Stats */}
          <div className="pt-2 border-t border-blue-100/80 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>▲ Upper Peak:</span>
              <b className="text-slate-800">{waterStats.upper.toFixed(1)} cm</b>
            </div>
            <div className="flex justify-between">
              <span>▼ Down Low:</span>
              <b className="text-slate-800">{waterStats.down.toFixed(1)} cm</b>
            </div>
            <div className="flex justify-between text-[9px] pt-0.5">
              <span>Live Delta:</span>
              <b className={waterStats.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {waterStats.delta > 0 ? `+${waterStats.delta}` : waterStats.delta} cm ({waterStats.pctChange}%)
              </b>
            </div>
          </div>
        </div>

        {/* 2. AMBIENT TEMPERATURE */}
        <div className="bg-gradient-to-br from-orange-50/70 to-slate-50 border border-orange-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-orange-900 flex items-center gap-1">
                <span>🌡️</span> Temperature
              </span>
              {/* Up/Down badge */}
              <span className={clsx(
                'font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-colors',
                tempStats.isUp
                  ? 'bg-rose-100 text-rose-700'
                  : tempStats.isDown
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              )}>
                {tempStats.isUp ? '▲ Warming' : tempStats.isDown ? '▼ Cooling' : '— Stable'}
              </span>
            </div>

            {/* Current Value */}
            <div className="my-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-orange-950">
                {tempStats.current.toFixed(1)} <span className="text-xs font-normal text-slate-500">°C</span>
              </div>
              <Sparkline points={telemetryHistory?.temp} color="#EA580C" />
            </div>
          </div>

          {/* Upper & Down Range Stats */}
          <div className="pt-2 border-t border-orange-100/80 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>▲ Upper High:</span>
              <b className="text-slate-800">{tempStats.upper.toFixed(1)}°C</b>
            </div>
            <div className="flex justify-between">
              <span>▼ Down Low:</span>
              <b className="text-slate-800">{tempStats.down.toFixed(1)}°C</b>
            </div>
            <div className="flex justify-between text-[9px] pt-0.5">
              <span>Live Delta:</span>
              <b className={tempStats.isUp ? 'text-rose-600' : 'text-blue-600'}>
                {tempStats.delta > 0 ? `+${tempStats.delta}` : tempStats.delta}°C ({tempStats.pctChange}%)
              </b>
            </div>
          </div>
        </div>

        {/* 3. RELATIVE HUMIDITY & SOIL */}
        <div className="bg-gradient-to-br from-teal-50/70 to-slate-50 border border-teal-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-900 flex items-center gap-1">
                <span>💧</span> Humidity
              </span>
              <span className={clsx(
                'font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-colors',
                humStats.isUp ? 'bg-teal-100 text-teal-800' : humStats.isDown ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
              )}>
                {humStats.isUp ? '▲ Rising' : humStats.isDown ? '▼ Drying' : '— Flat'}
              </span>
            </div>

            {/* Current Value */}
            <div className="my-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-teal-950">
                {humStats.current.toFixed(1)} <span className="text-xs font-normal text-slate-500">%</span>
              </div>
              <Sparkline points={telemetryHistory?.hum} color="#0D9488" />
            </div>
          </div>

          {/* Upper & Down Range Stats */}
          <div className="pt-2 border-t border-teal-100/80 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>▲ Upper Peak:</span>
              <b className="text-slate-800">{humStats.upper.toFixed(1)}%</b>
            </div>
            <div className="flex justify-between">
              <span>▼ Down Low:</span>
              <b className="text-slate-800">{humStats.down.toFixed(1)}%</b>
            </div>
            <div className="flex justify-between text-[9px] pt-0.5">
              <span>Soil Moisture:</span>
              <b className="text-teal-700">{soilStats.current.toFixed(1)}% ({soilStats.isUp ? '▲ Wet' : '▼ Dry'})</b>
            </div>
          </div>
        </div>

        {/* 4. CARBON MONOXIDE (MQ-7) */}
        <div className="bg-gradient-to-br from-rose-50/70 to-slate-50 border border-rose-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-900 flex items-center gap-1">
                <span>☣️</span> CO Gas (MQ-7)
              </span>
              <span className={clsx(
                'font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-colors',
                coStats.current > 6
                  ? 'bg-rose-600 text-white animate-pulse'
                  : coStats.isUp
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              )}>
                {coStats.current > 6 ? '▲ SPIKE' : coStats.isUp ? '▲ Rising' : '▼ Decaying'}
              </span>
            </div>

            {/* Current Value */}
            <div className="my-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-rose-950">
                {coStats.current.toFixed(2)} <span className="text-xs font-normal text-slate-500">ppm</span>
              </div>
              <Sparkline points={telemetryHistory?.co} color="#E11D48" />
            </div>
          </div>

          {/* Upper & Down Range Stats */}
          <div className="pt-2 border-t border-rose-100/80 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>▲ Upper Max:</span>
              <b className={coStats.upper > 6 ? 'text-rose-600 font-bold' : 'text-slate-800'}>{coStats.upper.toFixed(2)} ppm</b>
            </div>
            <div className="flex justify-between">
              <span>▼ Down Min:</span>
              <b className="text-slate-800">{coStats.down.toFixed(2)} ppm</b>
            </div>
            <div className="flex justify-between text-[9px] pt-0.5">
              <span>Live Delta:</span>
              <b className={coStats.delta > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {coStats.delta > 0 ? `+${coStats.delta}` : coStats.delta} ppm
              </b>
            </div>
          </div>
        </div>

        {/* 5. AIR QUALITY (PM2.5 AQI) */}
        <div className="bg-gradient-to-br from-purple-50/70 to-slate-50 border border-purple-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-900 flex items-center gap-1">
                <span>🌫️</span> PM2.5 AQI
              </span>
              <span className={clsx(
                'font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-colors',
                aqiStats.current > 90
                  ? 'bg-purple-600 text-white animate-pulse'
                  : aqiStats.isUp
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-emerald-100 text-emerald-800'
              )}>
                {aqiStats.current > 90 ? '▲ POOR' : aqiStats.isUp ? '▲ Rising' : '▼ Clearing'}
              </span>
            </div>

            {/* Current Value */}
            <div className="my-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-purple-950">
                {aqiStats.current} <span className="text-xs font-normal text-slate-500">AQI</span>
              </div>
              <Sparkline points={telemetryHistory?.aqi} color="#9333EA" />
            </div>
          </div>

          {/* Upper & Down Range Stats */}
          <div className="pt-2 border-t border-purple-100/80 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>▲ Upper Peak:</span>
              <b className="text-slate-800">{aqiStats.upper} AQI</b>
            </div>
            <div className="flex justify-between">
              <span>▼ Down Low:</span>
              <b className="text-slate-800">{aqiStats.down} AQI</b>
            </div>
            <div className="flex justify-between text-[9px] pt-0.5">
              <span>Live Delta:</span>
              <b className={aqiStats.delta > 0 ? 'text-purple-600' : 'text-emerald-600'}>
                {aqiStats.delta > 0 ? `+${aqiStats.delta}` : aqiStats.delta} AQI
              </b>
            </div>
          </div>
        </div>

        {/* 6. OPTICAL FLAME & SIREN TRIGGER */}
        <div className={clsx(
          'border rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all',
          surgeActive
            ? 'bg-red-50 border-red-400 animate-pulse'
            : 'bg-gradient-to-br from-emerald-50/70 to-slate-50 border-emerald-200/80'
        )}>
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <span>🔥</span> Flame Sensor
              </span>
              <span className={clsx(
                'font-mono text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors',
                surgeActive ? 'bg-red-600 text-white animate-bounce' : 'bg-emerald-100 text-emerald-800'
              )}>
                {surgeActive ? '🚨 FLAME ACTIVE' : '✓ CLEAR'}
              </span>
            </div>

            {/* Current Value */}
            <div className="my-2.5">
              <div className={clsx(
                'text-lg font-mono font-bold leading-tight',
                surgeActive ? 'text-red-700' : 'text-emerald-700'
              )}>
                {surgeActive ? 'FIRE DETECTED' : 'Zero Optical Flame'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {surgeActive ? 'Active IR emission in sector' : 'Normal ambient spectrum'}
              </div>
            </div>
          </div>

          {/* Upper & Down Range Stats */}
          <div className="pt-2 border-t border-slate-200/60 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Edge SLA:</span>
              <b className="text-slate-800">&lt;100ms Optical</b>
            </div>
            <div className="flex justify-between">
              <span>Autonomous Siren:</span>
              <b className={surgeActive ? 'text-red-600' : 'text-emerald-700'}>
                {surgeActive ? 'ENGAGED' : 'Standby'}
              </b>
            </div>
            <div className="flex justify-between text-[9px] pt-0.5">
              <span>Port COM7:</span>
              <b className="text-slate-700">{usbConnected ? 'USB Active' : 'Ready'}</b>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
