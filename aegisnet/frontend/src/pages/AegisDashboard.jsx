// pages/AegisDashboard.jsx — AegisNet SIH 2026 Master Environmental Monitoring Dashboard
// Real hardware data from Master ESP32 Gateway (ESP-NOW + Wi-Fi / USB Serial)
// ZERO fake data, ZERO invented PPM values, strictly separate nodes, real-time Socket.IO + REST.

import { useState, useEffect, useMemo, useRef } from 'react'
import { io } from 'socket.io-client'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const BACKEND_URL = 'http://localhost:4000'
const TIME_RANGES = [
  { id: '5m', label: 'Last 5 min' },
  { id: '15m', label: 'Last 15 min' },
  { id: '1h', label: 'Last 1 hour' },
  { id: '6h', label: 'Last 6 hours' },
  { id: '24h', label: 'Last 24 hours' },
  { id: 'all', label: 'All History' },
]

// ─── Format Timestamp in Indian Standard Time (Asia/Kolkata UTC+05:30) ─────────
function formatIST(isoOrEpoch, formatType = 'time') {
  if (!isoOrEpoch) return '—'
  const date = new Date(isoOrEpoch)
  if (isNaN(date.getTime())) return '—'

  if (formatType === 'time') {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ─── Custom Tooltip for Charts ─────────────────────────────────────────────────
function CustomChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-slate-900/95 backdrop-blur text-white text-xs p-2.5 rounded-lg shadow-xl border border-slate-700/60 font-sans">
      <div className="text-slate-400 font-mono text-[10px] mb-1">Time: {label} (IST)</div>
      {payload.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 my-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
          <span className="text-slate-300">{item.name}:</span>
          <span className="font-bold text-white font-mono">
            {item.value !== null && item.value !== undefined ? item.value : '—'} {unit}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Empty/Standby Chart State ─────────────────────────────────────────────────
function EmptyChartNotice({ count, metricName }) {
  if (count === 1) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <span className="text-xl mb-1">📈</span>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          1 reading received for {metricName}
        </div>
        <div className="text-[11px] text-slate-500 max-w-xs mt-1">
          Historical line curve will automatically connect points as subsequent readings arrive from Master ESP32.
        </div>
      </div>
    )
  }
  return (
    <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
      <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping mb-2" />
      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        Waiting for sensor data...
      </div>
      <div className="text-[11px] text-slate-400 mt-1">
        Real hardware readings will plot here automatically.
      </div>
    </div>
  )
}

// ─── Metric Value Card ─────────────────────────────────────────────────────────
function MetricCard({ title, value, unit, subtitle, status, tone = 'normal', badge }) {
  const toneClasses = {
    normal: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    safe: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100',
    alarm: 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-100 animate-pulse',
    alert: 'border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100',
  }

  return (
    <div className={`p-4 rounded-2xl border shadow-xs transition-all ${toneClasses[tone] || toneClasses.normal}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {badge && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            badge === 'DETECTED' || badge === 'ALARM'
              ? 'bg-red-600 text-white'
              : badge === 'CLEAR' || badge === 'SAFE'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 my-1">
        {value !== null && value !== undefined ? (
          <>
            <span className="text-2xl lg:text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
              {typeof value === 'number' ? Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }) : value}
            </span>
            {unit && <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{unit}</span>}
          </>
        ) : (
          <span className="text-sm font-mono text-slate-400 italic">Waiting for data...</span>
        )}
      </div>
      {subtitle && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{subtitle}</div>}
      {status && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{status}</div>}
    </div>
  )
}

export default function AegisDashboard() {
  const [systemData, setSystemData] = useState(null)
  const [readingsHistory, setReadingsHistory] = useState([])
  const [alerts, setAlerts] = useState([])
  const [activeRange, setActiveRange] = useState('1h')
  const [selectedAnalyticsMetric, setSelectedAnalyticsMetric] = useState('distance')
  const [connectedSocket, setConnectedSocket] = useState(false)
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now())
  const socketRef = useRef(null)

  // ─── Fetch Latest & History from Backend ──────────────────────────────────────
  const fetchData = async () => {
    try {
      const [latestRes, histRes, alertsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/sensor-data/latest`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${BACKEND_URL}/api/sensor-data/history?range=${activeRange}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${BACKEND_URL}/api/sensor-data/alerts`).then((r) => (r.ok ? r.json() : null)),
      ])
      if (latestRes) setSystemData(latestRes)
      if (histRes && Array.isArray(histRes.data)) setReadingsHistory(histRes.data)
      if (alertsRes && Array.isArray(alertsRes.data)) setAlerts(alertsRes.data)
    } catch {
      // Backend may be starting up
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [activeRange])

  // ─── Socket.IO Real-Time Stream ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const socket = io(BACKEND_URL, {
        reconnectionDelay: 2000,
        transports: ['websocket', 'polling'],
      })
      socketRef.current = socket

      socket.on('connect', () => {
        setConnectedSocket(true)
      })

      socket.on('disconnect', () => {
        setConnectedSocket(false)
      })

      socket.on('sensor:data', (newRecord) => {
        setLastHeartbeat(Date.now())
        // Immediately update latest state
        setSystemData((prev) => {
          if (!prev) return prev
          const updatedNodes = { ...prev.nodes }
          updatedNodes[newRecord.node] = {
            status: 'ONLINE',
            latest: newRecord,
            lastSeen: newRecord.ist_time,
          }
          return {
            ...prev,
            master: {
              ...prev.master,
              status: 'ONLINE',
              lastSeen: newRecord.ist_time,
            },
            nodes: updatedNodes,
          }
        })

        // Append to history
        setReadingsHistory((prev) => [...prev, newRecord])
      })

      socket.on('alert:new', (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev].slice(0, 50))
      })

      return () => {
        socket.disconnect()
      }
    } catch {
      // Fallback to REST polling
    }
  }, [])

  // ─── Sliced Datasets for Each Node's Charts ──────────────────────────────────
  const floodData = useMemo(() => {
    return readingsHistory
      .filter((r) => r.node === 'FLOOD' && r.distance !== null && r.distance !== undefined)
      .map((r) => ({
        time: formatIST(r.epoch_ms || r.timestamp, 'time'),
        rawTime: r.epoch_ms || new Date(r.timestamp).getTime(),
        distance: r.distance,
        soilMoisture: r.soilMoisture,
      }))
  }, [readingsHistory])

  const coTempData = useMemo(() => {
    return readingsHistory
      .filter((r) => r.node === 'CO_TEMP')
      .map((r) => ({
        time: formatIST(r.epoch_ms || r.timestamp, 'time'),
        rawTime: r.epoch_ms || new Date(r.timestamp).getTime(),
        coPPM: r.coPPM,
        dhtTemperature: r.dhtTemperature,
        humidity: r.humidity,
        ds18b20Temperature: r.ds18b20Temperature,
      }))
  }, [readingsHistory])

  const pollutionData = useMemo(() => {
    return readingsHistory
      .filter((r) => r.node === 'POLLUTION')
      .map((r) => ({
        time: formatIST(r.epoch_ms || r.timestamp, 'time'),
        rawTime: r.epoch_ms || new Date(r.timestamp).getTime(),
        mq135_strength: r.mq135_strength,
        mq7_strength: r.mq7_strength,
        mq4_strength: r.mq4_strength,
        PM1_0: r.PM1_0,
        PM2_5: r.PM2_5,
        PM10: r.PM10,
        gas_status: r.gas_status,
      }))
  }, [readingsHistory])

  // Latest records per node
  const latestFlood = systemData?.nodes?.FLOOD?.latest
  const latestCoTemp = systemData?.nodes?.CO_TEMP?.latest
  const latestPollution = systemData?.nodes?.POLLUTION?.latest

  // Master gateway connection status
  const masterOnline = systemData?.master?.status === 'ONLINE'
  const floodOnline = systemData?.nodes?.FLOOD?.status === 'ONLINE'
  const coTempOnline = systemData?.nodes?.CO_TEMP?.status === 'ONLINE'
  const pollutionOnline = systemData?.nodes?.POLLUTION?.status === 'ONLINE'

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 font-sans">
      {/* ─── STICKY TOP HEADER ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white uppercase font-mono">
                AegisNet
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                SIH 2026 Edge-AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              AI-Powered Environmental Monitoring Network for Floods, Fires & Pollution
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 text-xs font-mono">
            {/* Master ESP32 Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 font-bold">GATEWAY:</span>
              <span className={`inline-flex items-center gap-1.5 font-extrabold ${masterOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${masterOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {masterOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* Last Data Received */}
            <div className="px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 mr-1">Last Rx (IST):</span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {systemData?.master?.lastSeen || 'Waiting...'}
              </strong>
            </div>

            {/* Communication Protocol */}
            <div className="px-3 py-1.5 rounded-xl border bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
              ESP-NOW + Wi-Fi
            </div>
          </div>
        </div>
      </header>

      {/* ─── QUICK NAVIGATION BAR ─────────────────────────────────────────── */}
      <nav className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 scrollbar-none text-xs font-bold">
          <div className="flex items-center gap-2">
            <a href="#overview" className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              Dashboard Overview
            </a>
            <a href="#flood" className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400">
              🌊 Flood Node
            </a>
            <a href="#cotemp" className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-orange-600 dark:text-orange-400">
              ☁️ CO & Temperature
            </a>
            <a href="#pollution" className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400">
              🌫️ Pollution
            </a>
            <a href="#alerts" className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400">
              ⚠️ Alerts ({alerts.length})
            </a>
            <a href="#analytics" className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              📊 Analytics
            </a>
            <a href="#system" className="px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              ⚙️ System Status
            </a>
          </div>

          {/* Time Window Selector for Graphs */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-400 hidden sm:inline">Range:</span>
            {TIME_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRange(r.id)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeRange === r.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── MAIN CONTENT CONTAINER ───────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        
        {/* ─── 1. MAIN OVERVIEW CARDS ─────────────────────────────────────── */}
        <section id="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold tracking-tight uppercase font-mono text-slate-700 dark:text-slate-300">
              Node Architecture Overview
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              3 Physical Sensor Nodes → ESP-NOW → 1 Master ESP32
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Flood Node Overview */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌊</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Flood Node</h3>
                </div>
                <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  floodOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {floodOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                HC-SR04 Ultrasonic Distance + Analog Soil Moisture
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">DISTANCE</span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100">
                    {latestFlood?.distance != null ? `${latestFlood.distance} cm` : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SOIL MOISTURE</span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100">
                    {latestFlood?.soilMoisture != null ? `${latestFlood.soilMoisture} %` : '—'}
                  </strong>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-3">
                Last seen: {latestFlood?.ist_time || 'Awaiting signal'}
              </div>
            </div>

            {/* CO + Temperature Node Overview */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">☁️</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">CO + Temp Node</h3>
                </div>
                <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  coTempOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {coTempOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                ZE07-CO (ppm) + DHT11 Temp/Hum + DS18B20 Temp
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">CO CONCENTRATION</span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100">
                    {latestCoTemp?.coPPM != null ? `${latestCoTemp.coPPM} ppm` : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DHT11 / DS18B20</span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100">
                    {latestCoTemp?.dhtTemperature != null ? `${latestCoTemp.dhtTemperature}°C` : '—'} / {latestCoTemp?.ds18b20Temperature != null ? `${latestCoTemp.ds18b20Temperature}°C` : '—'}
                  </strong>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-3">
                Last seen: {latestCoTemp?.ist_time || 'Awaiting signal'}
              </div>
            </div>

            {/* Pollution Node Overview */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌫️</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pollution Node</h3>
                </div>
                <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  pollutionOnline ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {pollutionOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                MQ-135 + MQ-7 + MQ-4 (Gas Strength) + PMS5003 Dust
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">GAS ALARM</span>
                  <span className={`font-bold text-xs px-2 py-0.5 rounded ${
                    latestPollution?.gas_status === 'ALARM' ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {latestPollution?.gas_status || 'SAFE'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PMS5003 PM2.5</span>
                  <strong className="text-sm text-slate-800 dark:text-slate-100">
                    {latestPollution?.PM2_5 != null ? `${latestPollution.PM2_5} µg/m³` : '—'}
                  </strong>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-3">
                Last seen: {latestPollution?.ist_time || 'Awaiting signal'}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. CURRENT ENVIRONMENT QUICK SUMMARY ───────────────────────── */}
        <section className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-blue-200/70 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <span>🌐</span> Current Environment Summary
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Live Telemetry Snapshot</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-400 block font-mono text-[10px]">🌊 FLOOD MONITORING</span>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                Distance: {latestFlood?.distance != null ? `${latestFlood.distance} cm` : '—'}
              </div>
              <div className="font-mono text-slate-600 dark:text-slate-300">
                Soil Moisture: {latestFlood?.soilMoisture != null ? `${latestFlood.soilMoisture} %` : '—'}
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-400 block font-mono text-[10px]">☁️ GAS & TEMPERATURE</span>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                CO: {latestCoTemp?.coPPM != null ? `${latestCoTemp.coPPM} ppm` : '—'}
              </div>
              <div className="font-mono text-slate-600 dark:text-slate-300">
                Temp: {latestCoTemp?.dhtTemperature != null ? `${latestCoTemp.dhtTemperature} °C` : '—'} · Hum: {latestCoTemp?.humidity != null ? `${latestCoTemp.humidity} %` : '—'}
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-400 block font-mono text-[10px]">🌫️ PARTICULATE MATTER</span>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                PM2.5: {latestPollution?.PM2_5 != null ? `${latestPollution.PM2_5} µg/m³` : '—'}
              </div>
              <div className="font-mono text-slate-600 dark:text-slate-300">
                PM10: {latestPollution?.PM10 != null ? `${latestPollution.PM10} µg/m³` : '—'} · PM1.0: {latestPollution?.PM1_0 != null ? `${latestPollution.PM1_0} µg/m³` : '—'}
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-400 block font-mono text-[10px]">☣️ MQ DIGITAL THRESHOLDS</span>
              <div className="font-mono text-xs space-y-0.5 mt-1">
                <div>NH3 (MQ-135): <strong className={latestPollution?.mq135_alarm ? 'text-red-600 font-bold' : 'text-emerald-600'}>{latestPollution?.mq135_alarm ? 'DETECTED' : 'CLEAR'}</strong></div>
                <div>CO (MQ-7): <strong className={latestPollution?.mq7_alarm ? 'text-red-600 font-bold' : 'text-emerald-600'}>{latestPollution?.mq7_alarm ? 'DETECTED' : 'CLEAR'}</strong></div>
                <div>CH4 (MQ-4): <strong className={latestPollution?.mq4_alarm ? 'text-red-600 font-bold' : 'text-emerald-600'}>{latestPollution?.mq4_alarm ? 'DETECTED' : 'CLEAR'}</strong></div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. NODE 1: FLOOD MONITORING NODE SECTION ─────────────────────── */}
        <section id="flood" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌊</span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono uppercase">
                  Flood Monitoring Node
                </h3>
                <span className="text-xs text-slate-500">HC-SR04 Ultrasonic Distance Sensor + Soil Moisture Sensor</span>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Data Points in Window: <strong className="text-slate-700 dark:text-slate-200">{floodData.length}</strong>
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              title="Water Surface Distance"
              value={latestFlood?.distance}
              unit="cm"
              subtitle="Measured from HC-SR04 ultrasonic sensor (TRIG: GPIO 5, ECHO: GPIO 18)"
              status={latestFlood ? `Recorded: ${latestFlood.ist_time}` : null}
              tone={latestFlood?.distance != null && latestFlood.distance < 20 ? 'alert' : 'normal'}
            />
            <MetricCard
              title="Soil Moisture Saturation"
              value={latestFlood?.soilMoisture}
              unit="%"
              subtitle="Calibrated: map(raw, 3200 (dry), 1300 (wet), 0, 100%) on GPIO 34"
              status={latestFlood ? `Recorded: ${latestFlood.ist_time}` : null}
              tone={latestFlood?.soilMoisture != null && latestFlood.soilMoisture > 85 ? 'alert' : 'normal'}
            />
          </div>

          {/* Time-Series Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Distance vs Time */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Distance vs Time (cm)
                </h4>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">HC-SR04</span>
              </div>
              {floodData.length >= 2 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={floodData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit=" cm" domain={['auto', 'auto']} />
                      <Tooltip content={<CustomChartTooltip unit="cm" />} />
                      <Line type="monotone" dataKey="distance" name="Distance" stroke="#2563eb" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartNotice count={floodData.length} metricName="Water Distance" />
              )}
            </div>

            {/* Soil Moisture vs Time */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Soil Moisture History (%)
                </h4>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Soil Sensor</span>
              </div>
              {floodData.length >= 2 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={floodData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit=" %" domain={[0, 100]} />
                      <Tooltip content={<CustomChartTooltip unit="%" />} />
                      <Line type="monotone" dataKey="soilMoisture" name="Soil Moisture" stroke="#10b981" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartNotice count={floodData.length} metricName="Soil Moisture" />
              )}
            </div>
          </div>
        </section>

        {/* ─── 4. NODE 2: CO & TEMPERATURE NODE SECTION ─────────────────────── */}
        <section id="cotemp" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">☁️</span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono uppercase">
                  CO & Temperature Node
                </h3>
                <span className="text-xs text-slate-500">
                  ZE07-CO (Electrochemical UART CO ppm) + DHT11 Temp/Humidity + DS18B20 Temp
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Data Points in Window: <strong className="text-slate-700 dark:text-slate-200">{coTempData.length}</strong>
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="CO Concentration"
              value={latestCoTemp?.coPPM}
              unit="ppm"
              subtitle="Dedicated electrochemical ZE07-CO sensor (UART 9600 baud, GPIO 16/17)"
              badge="ZE07-CO"
              status={latestCoTemp ? `Recorded: ${latestCoTemp.ist_time}` : null}
              tone={latestCoTemp?.coPPM != null && latestCoTemp.coPPM > 5.0 ? 'alert' : 'normal'}
            />
            <MetricCard
              title="DHT11 Temperature"
              value={latestCoTemp?.dhtTemperature}
              unit="°C"
              subtitle="Ambient temperature from DHT11 on GPIO 4"
              badge="DHT11"
              status={latestCoTemp ? `Recorded: ${latestCoTemp.ist_time}` : null}
            />
            <MetricCard
              title="Relative Humidity"
              value={latestCoTemp?.humidity}
              unit="%"
              subtitle="Ambient relative humidity from DHT11 on GPIO 4"
              badge="DHT11"
              status={latestCoTemp ? `Recorded: ${latestCoTemp.ist_time}` : null}
            />
            <MetricCard
              title="DS18B20 Temperature"
              value={latestCoTemp?.ds18b20Temperature}
              unit="°C"
              subtitle="High-precision digital 1-Wire temperature sensor on GPIO 5"
              badge="DS18B20"
              status={latestCoTemp ? `Recorded: ${latestCoTemp.ist_time}` : null}
            />
          </div>

          {/* Time-Series Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* CO PPM History */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  CO ppm History
                </h4>
                <span className="text-[10px] text-amber-600 font-mono font-bold">ZE07-CO</span>
              </div>
              {coTempData.length >= 2 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coTempData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit=" ppm" domain={['auto', 'auto']} />
                      <Tooltip content={<CustomChartTooltip unit="ppm" />} />
                      <Line type="monotone" dataKey="coPPM" name="CO ppm" stroke="#f59e0b" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartNotice count={coTempData.length} metricName="CO ppm" />
              )}
            </div>

            {/* Temperature Comparison: DHT11 vs DS18B20 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Temperature: DHT11 vs DS18B20
                </h4>
                <span className="text-[10px] text-orange-600 font-mono font-bold">Dual Sensors</span>
              </div>
              {coTempData.length >= 2 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coTempData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit=" °C" domain={['auto', 'auto']} />
                      <Tooltip content={<CustomChartTooltip unit="°C" />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <Line type="monotone" dataKey="dhtTemperature" name="DHT11 Temp" stroke="#ea580c" strokeWidth={2.2} dot={{ r: 2.5 }} />
                      <Line type="monotone" dataKey="ds18b20Temperature" name="DS18B20 Temp" stroke="#ef4444" strokeWidth={2.2} strokeDasharray="4 2" dot={{ r: 2.5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartNotice count={coTempData.length} metricName="Temperature Comparison" />
              )}
            </div>

            {/* Humidity vs Time */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Humidity History (%)
                </h4>
                <span className="text-[10px] text-cyan-600 font-mono font-bold">DHT11</span>
              </div>
              {coTempData.length >= 2 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coTempData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit=" %" domain={[0, 100]} />
                      <Tooltip content={<CustomChartTooltip unit="%" />} />
                      <Line type="monotone" dataKey="humidity" name="Humidity" stroke="#06b6d4" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartNotice count={coTempData.length} metricName="Humidity" />
              )}
            </div>
          </div>
        </section>

        {/* ─── 5. NODE 3: POLLUTION NODE SECTION ────────────────────────────── */}
        <section id="pollution" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌫️</span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono uppercase">
                  Pollution & Air Quality Node
                </h3>
                <span className="text-xs text-slate-500">
                  MQ-135, MQ-7, MQ-4 (Relative Strength & Digital Alarms) + PMS5003 Laser Particulate Matter
                </span>
              </div>
            </div>

            {/* Overall Gas Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">GAS STATUS:</span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full font-mono ${
                latestPollution?.gas_status === 'ALARM'
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                {latestPollution?.gas_status === 'ALARM' ? '🚨 GAS ALARM ACTIVE' : '✓ ALL GASES SAFE'}
              </span>
            </div>
          </div>

          {/* Gas Sensor Cards (MQ-135, MQ-7, MQ-4) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MQ-135 / NH3 */}
            <div className={`p-4 rounded-2xl border shadow-xs ${
              latestPollution?.mq135_alarm ? 'border-red-400 bg-red-50/60 dark:bg-red-950/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold font-mono text-slate-800 dark:text-white">MQ-135 / NH3 Air Quality</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  latestPollution?.mq135_alarm ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {latestPollution?.mq135_alarm ? 'DETECTED' : 'CLEAR'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 my-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">ADC RAW</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{latestPollution?.mq135_raw ?? '—'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">VOLTAGE</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{latestPollution?.mq135_voltage != null ? `${latestPollution.mq135_voltage} V` : '—'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">STRENGTH</span>
                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">{latestPollution?.mq135_strength != null ? `${latestPollution.mq135_strength} %` : '—'}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                *Relative gas strength. Digital pin DO: GPIO 25, AO: GPIO 34.
              </p>
            </div>

            {/* MQ-7 / CO (Relative Strength) */}
            <div className={`p-4 rounded-2xl border shadow-xs ${
              latestPollution?.mq7_alarm ? 'border-red-400 bg-red-50/60 dark:bg-red-950/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold font-mono text-slate-800 dark:text-white">MQ-7 / CO Trend Gas</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  latestPollution?.mq7_alarm ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {latestPollution?.mq7_alarm ? 'DETECTED' : 'CLEAR'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 my-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">ADC RAW</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{latestPollution?.mq7_raw ?? '—'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">VOLTAGE</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{latestPollution?.mq7_voltage != null ? `${latestPollution.mq7_voltage} V` : '—'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">STRENGTH</span>
                  <span className="font-mono font-bold text-sm text-orange-600 dark:text-orange-400">{latestPollution?.mq7_strength != null ? `${latestPollution.mq7_strength} %` : '—'}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                *Relative gas strength. Digital pin DO: GPIO 26, AO: GPIO 35.
              </p>
            </div>

            {/* MQ-4 / CH4 Methane */}
            <div className={`p-4 rounded-2xl border shadow-xs ${
              latestPollution?.mq4_alarm ? 'border-red-400 bg-red-50/60 dark:bg-red-950/30' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold font-mono text-slate-800 dark:text-white">MQ-4 / CH4 Combustible Gas</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  latestPollution?.mq4_alarm ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {latestPollution?.mq4_alarm ? 'DETECTED' : 'CLEAR'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 my-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">ADC RAW</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{latestPollution?.mq4_raw ?? '—'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">VOLTAGE</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{latestPollution?.mq4_voltage != null ? `${latestPollution.mq4_voltage} V` : '—'}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-mono">STRENGTH</span>
                  <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">{latestPollution?.mq4_strength != null ? `${latestPollution.mq4_strength} %` : '—'}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                *Relative gas strength. Digital pin DO: GPIO 27, AO: GPIO 32.
              </p>
            </div>
          </div>

          {/* PMS5003 Laser Particulate Matter Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔬</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">PMS5003 Laser Particulate Matter</h4>
                  <span className="text-[11px] text-slate-500">UART 9600 baud (GPIO 16 RX / GPIO 17 TX)</span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">Unit: µg/m³</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl text-center">
                <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">PM1.0 Ultrafine</span>
                <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white my-1">
                  {latestPollution?.PM1_0 ?? '—'} <span className="text-xs text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Sub-micron particles</span>
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl text-center">
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300">PM2.5 Fine</span>
                <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white my-1">
                  {latestPollution?.PM2_5 ?? '—'} <span className="text-xs text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Fine respirable particles</span>
              </div>

              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-xl text-center">
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">PM10 Coarse</span>
                <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white my-1">
                  {latestPollution?.PM10 ?? '—'} <span className="text-xs text-slate-400">µg/m³</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Coarse inhalable dust</span>
              </div>
            </div>
          </div>

          {/* Pollution Historical Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* MQ Relative Gas Strengths History */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  MQ Gas Relative Strengths (%)
                </h4>
                <span className="text-[10px] text-purple-600 font-mono font-bold">MQ-135 / MQ-7 / MQ-4</span>
              </div>
              {pollutionData.length >= 2 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pollutionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit=" %" domain={[0, 100]} />
                      <Tooltip content={<CustomChartTooltip unit="%" />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <Line type="monotone" dataKey="mq135_strength" name="MQ-135 (NH3 %)" stroke="#8b5cf6" strokeWidth={2.2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="mq7_strength" name="MQ-7 (CO %)" stroke="#f97316" strokeWidth={2.2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="mq4_strength" name="MQ-4 (CH4 %)" stroke="#ef4444" strokeWidth={2.2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartNotice count={pollutionData.length} metricName="MQ Gas Strengths" />
              )}
            </div>

            {/* PMS5003 Particulate Matter History */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  PMS5003 Particulate Density History (µg/m³)
                </h4>
                <span className="text-[10px] text-indigo-600 font-mono font-bold">PMS5003 Laser</span>
              </div>
              {pollutionData.length >= 2 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pollutionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} unit=" µg" domain={['auto', 'auto']} />
                      <Tooltip content={<CustomChartTooltip unit="µg/m³" />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <Line type="monotone" dataKey="PM1_0" name="PM1.0" stroke="#3b82f6" strokeWidth={2.2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="PM2_5" name="PM2.5" stroke="#6366f1" strokeWidth={2.4} dot={{ r: 2.5 }} />
                      <Line type="monotone" dataKey="PM10" name="PM10" stroke="#a855f7" strokeWidth={2.2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartNotice count={pollutionData.length} metricName="PMS5003 Particulate" />
              )}
            </div>
          </div>
        </section>

        {/* ─── 6. REAL-TIME ALERTS PANEL ────────────────────────────────────── */}
        <section id="alerts" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono uppercase">
                Active Hazard & Hardware Alerts
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Newest Alerts Displayed First
            </span>
          </div>

          <div className="space-y-2.5">
            {alerts.length > 0 ? (
              alerts.map((al, idx) => (
                <div
                  key={al.id || idx}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚨</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-red-600 dark:text-red-400">
                          {al.type || 'HAZARD_ALERT'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {al.sensor || al.title || 'Sensor Alert'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold">
                          {al.status || 'DETECTED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {al.message || 'Threshold breached.'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 block">
                      {al.ist_time || formatIST(al.created_at || al.timestamp, 'time')}
                    </span>
                    <span className="text-[10px] text-slate-400">IST (UTC+05:30)</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-center">
                <span className="text-2xl block mb-1">✅</span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  All Sensors Operating Within Safe Parameters
                </span>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  No MQ digital alarms triggered, no flood surge detected.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── 7. ANALYTICS & HISTORICAL EXPLORER ──────────────────────────── */}
        <section id="analytics" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono uppercase">
                Sensor Historical Analytics Explorer
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Select Sensor:</span>
              <select
                value={selectedAnalyticsMetric}
                onChange={(e) => setSelectedAnalyticsMetric(e.target.value)}
                className="text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5"
              >
                <optgroup label="🌊 Flood Node">
                  <option value="distance">Water Distance (cm)</option>
                  <option value="soilMoisture">Soil Moisture (%)</option>
                </optgroup>
                <optgroup label="☁️ CO + Temp Node">
                  <option value="coPPM">CO Concentration (ppm)</option>
                  <option value="dhtTemperature">DHT11 Temperature (°C)</option>
                  <option value="humidity">Relative Humidity (%)</option>
                  <option value="ds18b20Temperature">DS18B20 Temperature (°C)</option>
                </optgroup>
                <optgroup label="🌫️ Pollution Node">
                  <option value="mq135_strength">MQ-135 NH3 Gas Strength (%)</option>
                  <option value="mq7_strength">MQ-7 CO Gas Strength (%)</option>
                  <option value="mq4_strength">MQ-4 CH4 Gas Strength (%)</option>
                  <option value="PM1_0">PMS5003 PM1.0 (µg/m³)</option>
                  <option value="PM2_5">PMS5003 PM2.5 (µg/m³)</option>
                  <option value="PM10">PMS5003 PM10 (µg/m³)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            {readingsHistory.length >= 2 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={readingsHistory
                      .filter((r) => r[selectedAnalyticsMetric] != null)
                      .map((r) => ({
                        time: formatIST(r.epoch_ms || r.timestamp, 'time'),
                        val: r[selectedAnalyticsMetric],
                      }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line type="monotone" dataKey="val" name={selectedAnalyticsMetric} stroke="#3b82f6" strokeWidth={2.4} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChartNotice count={readingsHistory.length} metricName={selectedAnalyticsMetric} />
            )}
          </div>
        </section>

        {/* ─── 8. SYSTEM STATUS SECTION ────────────────────────────────────── */}
        <section id="system" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono uppercase">
                System & Gateway Health Status
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Auto-refreshes every 2s
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">MASTER ESP32</span>
              <span className={`font-extrabold text-sm block my-1 ${masterOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                {masterOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </span>
              <span className="text-[10px] text-slate-400">{systemData?.master?.lastSeen || 'Awaiting signal'}</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">FLOOD NODE</span>
              <span className={`font-extrabold text-sm block my-1 ${floodOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                {floodOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </span>
              <span className="text-[10px] text-slate-400">{latestFlood?.ist_time || 'Awaiting signal'}</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">CO + TEMP NODE</span>
              <span className={`font-extrabold text-sm block my-1 ${coTempOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                {coTempOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </span>
              <span className="text-[10px] text-slate-400">{latestCoTemp?.ist_time || 'Awaiting signal'}</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">POLLUTION NODE</span>
              <span className={`font-extrabold text-sm block my-1 ${pollutionOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                {pollutionOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
              </span>
              <span className="text-[10px] text-slate-400">{latestPollution?.ist_time || 'Awaiting signal'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">ESP-NOW RADIO</span>
              <strong className="text-slate-800 dark:text-slate-200 text-sm">
                {masterOnline ? 'CONNECTED' : 'NOT RECEIVING'}
              </strong>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">BACKEND API</span>
              <strong className="text-emerald-600 text-sm">CONNECTED (4000)</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">DATABASE ENGINE</span>
              <strong className="text-emerald-600 text-sm">TIME-SERIES STORE</strong>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">SOCKET.IO LIVE FEED</span>
              <strong className={connectedSocket ? 'text-emerald-600 text-sm' : 'text-amber-600 text-sm'}>
                {connectedSocket ? 'LIVE STREAMING' : 'POLLING MODE'}
              </strong>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
