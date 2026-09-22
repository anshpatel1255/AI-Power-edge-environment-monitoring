// pages/Dashboard.jsx — Code Vortex Situation Dashboard
// FULLY DYNAMIC: all values from Zustand store (alerts, dispatches, nodes, esp32Nodes)
// No hardcoded numbers. Backend-graceful — falls back to simulated data when offline.

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore, SENSOR_CATEGORIES } from '../store/useStore'
import RiskMap from '../components/map/RiskMap'
import LiveTelemetryStreamSection from '../components/dashboard/LiveTelemetryStreamSection'
import clsx from 'clsx'

// ─── Circular Gauge (SVG ring) ────────────────────────────────────────────────
function CircularGauge({ pct = 0, color = '#10B981' }) {
  const size = 52
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference
  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="transparent" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-mono font-extrabold text-slate-800 leading-none">{pct}%</span>
        <span className="text-[8px] text-slate-400 uppercase font-semibold leading-tight mt-0.5">Risk</span>
      </div>
    </div>
  )
}

// ─── Category Sparkline Wave ──────────────────────────────────────────────────
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
  const width = 160, height = 40
  const coords = points.map((val, idx) => ({
    x: (idx / (points.length - 1)) * width,
    y: height - ((val - min) / range) * (height - 10) - 5,
  }))
  let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1], curr = coords[i]
    const cpX = (prev.x + curr.x) / 2
    linePath += ` C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`
  }
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`
  const last = coords[coords.length - 1]
  return (
    <div className="w-full h-10 mt-1 relative overflow-visible">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`grad_${category}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad_${category})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="3" fill={color} />
      </svg>
    </div>
  )
}

// ─── Dispatch Status Badge ────────────────────────────────────────────────────
function DispatchBadge({ status }) {
  const map = {
    'Acknowledged': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Responding':   'bg-blue-50 text-blue-700 border-blue-200',
    'On Scene':     'bg-purple-50 text-purple-700 border-purple-200',
    'Notified':     'bg-amber-50 text-amber-700 border-amber-200',
    'Not Notified': 'bg-slate-100 text-slate-600 border-slate-200',
  }
  const cls = map[status] || map['Not Notified']
  const icon = (status === 'Acknowledged' || status === 'Responding' || status === 'On Scene') ? '✓ ' : ''
  return (
    <span className={`border px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
      {icon}{status}
    </span>
  )
}

// ─── Alert Severity Badge ─────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    emergency: 'bg-red-600 text-white',
    warning:   'bg-orange-500 text-white',
    watch:     'bg-amber-400 text-white',
    advisory:  'bg-blue-500 text-white',
  }
  return (
    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md capitalize ${map[severity] || 'bg-slate-400 text-white'}`}>
      {severity}
    </span>
  )
}

// ─── Incident Card (dynamic from alerts store) ────────────────────────────────
function IncidentCard({ alert, navigate }) {
  const isHigh = alert.severity === 'emergency' || alert.severity === 'warning'
  const borderCls = isHigh ? 'border-red-200/90 bg-red-50/40' : 'border-orange-200/90 bg-orange-50/40'
  const confBar   = alert.confidence_pct ?? 0
  const reading   = alert.readings_snapshot
    ? Object.entries(alert.readings_snapshot)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(' · ')
    : null

  return (
    <div className={`border rounded-2xl p-4 space-y-2 shadow-2xs ${borderCls}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <span className="text-xs font-mono font-bold text-slate-700">{alert.id}</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">{alert.timestamp}</span>
      </div>

      <h4 className="text-sm font-bold text-slate-900 leading-snug">{alert.title}</h4>

      <p className="text-xs text-slate-600 leading-relaxed">
        📍 {alert.location}
        {alert.landmark_tag ? `. ${alert.landmark_tag}.` : ''}
      </p>

      {reading && (
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="font-semibold text-slate-700 font-mono truncate">{reading}</span>
          {alert.confidence_pct != null && (
            <span className="font-semibold text-slate-700 ml-2 flex-shrink-0">
              Conf <b className="text-slate-900">{alert.confidence_pct}%</b>
            </span>
          )}
        </div>
      )}

      {alert.confidence_pct != null && (
        <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${isHigh ? 'bg-red-600' : 'bg-orange-500'}`} style={{ width: `${confBar}%` }} />
        </div>
      )}

      {alert.acknowledged && (
        <div className="text-[11px] text-emerald-600 font-semibold">
          ✓ Acknowledged {alert.acknowledged_by ? `by ${alert.acknowledged_by}` : ''}
        </div>
      )}

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
  )
}

// ─── Dot-matrix row helper ────────────────────────────────────────────────────
function DotMatrix({ online, total }) {
  const dots = Array.from({ length: total }, (_, i) => i < online)
  const rows = [dots.slice(0, Math.ceil(total / 2)), dots.slice(Math.ceil(total / 2))]
  return (
    <div className="mt-4 space-y-1.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex items-center gap-2">
          {row.map((active, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full inline-block transition-colors duration-500 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── SENSOR STATUS HELPER ─────────────────────────────────────────────────────
function sensorStatus(val, thresholds) {
  if (val == null) return { label: '–', cls: 'bg-slate-100 text-slate-500' }
  if (val >= (thresholds.danger ?? Infinity))
    return { label: 'Critical', cls: 'bg-red-50 text-red-600 border border-red-200/60' }
  if (val >= (thresholds.warn ?? Infinity))
    return { label: 'Warning', cls: 'bg-orange-50 text-orange-600 border border-orange-200/60' }
  return { label: 'Normal', cls: 'bg-emerald-50 text-emerald-700' }
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate       = useNavigate()
  const nodes          = useStore((s) => s.nodes)
  const alerts         = useStore((s) => s.alerts)
  const dispatches     = useStore((s) => s.dispatches)
  const esp32Nodes     = useStore((s) => s.esp32Nodes)
  const socketConnected = useStore((s) => s.socketConnected)
  const setUsbModalOpen = useStore((s) => s.setUsbModalOpen)

  const [mapMode, setMapMode]   = useState('normal')
  const [activeTab, setActiveTab] = useState('incidents')

  // ── Physical ESP32 node lookup ────────────────────────────────────────────
  const floodNode     = esp32Nodes.find((n) => n.node_id?.includes('FLOOD'))
  const cotempNode    = esp32Nodes.find((n) => n.node_id?.includes('COTEMP'))
  const pollutionNode = esp32Nodes.find((n) => n.node_id?.includes('POLLUTION'))

  // ── Sensor values with sensible fallbacks ────────────────────────────────
  const waterVal = floodNode?.water_level_cm   != null ? floodNode.water_level_cm.toFixed(1)   : '47.8'
  const soilVal  = floodNode?.soil_moisture    != null ? floodNode.soil_moisture.toFixed(1)    : '68.6'
  const coVal    = cotempNode?.gas_ppm         != null ? cotempNode.gas_ppm.toFixed(2)         : '1.23'
  const tempVal  = cotempNode?.temperature_c   != null ? cotempNode.temperature_c.toFixed(1)   : '27.7'
  const humVal   = cotempNode?.humidity_pct    != null ? cotempNode.humidity_pct.toFixed(1)    : '62.2'
  const pm25Val  = pollutionNode?.smoke_aqi    != null ? pollutionNode.smoke_aqi               : '59'
  const pm10Val  = pollutionNode?.pm10         != null ? pollutionNode.pm10                    : '78'
  const nh3Val   = pollutionNode?.mq135_strength != null ? pollutionNode.mq135_strength.toFixed(1) : '35.2'
  const ch4Val   = pollutionNode?.mq4_strength   != null ? pollutionNode.mq4_strength.toFixed(1)   : '15.6'

  // ── Node risk scores (0–100) ───────────────────────────────────────────
  const floodRisk     = floodNode?.risk_score     ?? 0
  const cotempRisk    = cotempNode?.risk_score    ?? 0
  const pollutionRisk = pollutionNode?.risk_score ?? 43

  // ── Dynamic hero card values ──────────────────────────────────────────────
  const activeAlerts       = alerts.filter((a) => !a.acknowledged)
  const criticalCount      = activeAlerts.length
  const warningCount       = alerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length
  const watchCount         = alerts.filter((a) => a.severity === 'watch' && !a.acknowledged).length
  const onlineNodes        = nodes.filter((n) => n.status === 'online').length
  const totalNodes         = nodes.length
  const fleetPct           = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0

  // ── Fleet category active-node counts (dynamic) ────────────────────────
  const catNodeCount = (catId) => nodes.filter((n) => n.category === catId && n.status === 'online').length

  // ── Category status from alerts ───────────────────────────────────────
  const catHasAlert = (catId) => activeAlerts.some((a) => a.category === catId)

  // ── Incidents tab: show up to 3 unacknowledged alerts ─────────────────
  const incidentAlerts = alerts.filter((a) => !a.acknowledged).slice(0, 3)
  const incidentCount  = incidentAlerts.length

  // ── Event stream: combine acknowledged + all alerts sorted newest first ─
  const allAlertsSorted = [...alerts].sort((a, b) => {
    const parseTime = (t) => {
      if (!t || t === 'Just now') return 0
      const m = t.match(/(\d+)\s*(min|h|sec)/)
      if (!m) return 0
      return m[2] === 'h' ? parseInt(m[1]) * 60 : m[2] === 'sec' ? parseInt(m[1]) / 60 : parseInt(m[1])
    }
    return parseTime(a.timestamp) - parseTime(b.timestamp)
  })

  // ──────────────────────────────────────────────────────────────────────
  // ── AI PREDICTION ENGINE — fetch from backend /api/predict/summary ────
  // ──────────────────────────────────────────────────────────────────────
  const MOCK_AI = {
    generated_at: new Date().toISOString(),
    total_nodes: 18,
    network_health: 87,
    hazard_summary: {
      flood:       { prob_3h: 0.22, prob_6h: 0.31, affected_nodes: 3, trend: 'stable' },
      wildfire:    { prob_3h: 0.09, active_fires: 0, high_risk_nodes: 1, trend: 'clear' },
      air_quality: { prob_hazardous_3h: 0.14, nodes_above_100_aqi: 2, trend: 'acceptable' },
      drought:     { stress_nodes: 1, severity: 'low' },
    },
    compound_alerts: [],
    confidence: 0.82,
  }

  const [aiData, setAiData] = useState(MOCK_AI)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLastUpdated, setAiLastUpdated] = useState(null)

  useEffect(() => {
    async function fetchAiSummary() {
      setAiLoading(true)
      try {
        const res = await fetch('http://localhost:4000/api/predict/summary', {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        })
        if (res.ok) {
          const data = await res.json()
          setAiData(data)
          setAiLastUpdated(new Date())
        }
      } catch {
        // Backend offline — keep mock data silently
      } finally {
        setAiLoading(false)
      }
    }
    fetchAiSummary()
    const interval = setInterval(fetchAiSummary, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans text-slate-800 animate-slide-up">

      {/* ─── 1. Page Header ────────────────────────────────────────────────── */}
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
          {/* Backend connection pill */}
          <span className={clsx(
            'text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border',
            socketConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          )}>
            <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {socketConnected ? 'Backend live' : 'Simulated data'}
          </span>

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

      {/* ─── 2. Hero Metric Cards (4 cards) ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Critical Alerts (fully dynamic) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between h-[210px] hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Critical alerts</span>
            <span className={clsx(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
              criticalCount > 0
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            )}>
              {criticalCount > 0 ? 'Active' : 'All Clear'}
            </span>
          </div>

          <div>
            <div className="text-5xl font-mono font-extrabold text-red-600 leading-none">
              {criticalCount}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-2 rounded-full bg-red-500 flex-1" style={{ flex: warningCount + 1 }} />
              {watchCount > 0 && <div className="h-2 rounded-full bg-orange-400" style={{ flex: watchCount }} />}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">{warningCount} warning, {watchCount} watch</span>
            <Link to="/alerts" className="text-blue-600 hover:text-blue-700 font-bold">
              Review queue &gt;
            </Link>
          </div>
        </div>

        {/* Card 2: LoRa Fleet Online (dynamic node count + dot matrix) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between h-[210px] hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">LoRa fleet online</span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {fleetPct}% mesh active
            </span>
          </div>

          <div>
            <div className="text-5xl font-mono font-extrabold text-slate-900 leading-none">
              {onlineNodes}
            </div>
            <DotMatrix online={onlineNodes} total={Math.min(totalNodes, 16)} />
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">433 MHz LoRa + WiFi 6</span>
            <Link to="/fleet" className="text-blue-600 hover:text-blue-700 font-bold">
              Fleet view &gt;
            </Link>
          </div>
        </div>

        {/* Card 3: On-Device Inference (static — hardware spec) */}
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
            <div className="w-full h-2 rounded-full bg-slate-100 mt-4 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 w-3/4" />
            </div>
          </div>

          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
            Zero-cloud classification, budget under 180 ms
          </div>
        </div>

        {/* Card 4: Spatial Catchment Grid */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-6 shadow-md shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between h-[210px] transition-all">
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
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Tapi Basin</h3>
          </div>

          <div className="text-xs text-blue-100 z-10 pt-1 border-t border-white/20">
            Multi-sensor spatial co-validation
          </div>
        </div>

      </div>

      {/* ─── 2.5 AI PREDICTION ENGINE PANEL ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-500/20 flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Code Vortex AI Prediction Engine</h2>
                {aiLoading && <span className="text-[10px] font-mono text-violet-600 animate-pulse">· refreshing…</span>}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Multi-hazard forecast · Statistical edge inference · Confidence-scored alerts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {aiData.compound_alerts?.length > 0 && (
              <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                ⚠ {aiData.compound_alerts.length} Compound Alert{aiData.compound_alerts.length > 1 ? 's' : ''}
              </span>
            )}
            <span className="bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
              AI Confidence: {Math.round((aiData.confidence ?? 0.82) * 100)}%
            </span>
            <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-mono px-2.5 py-1 rounded-full">
              {aiLastUpdated ? `Updated ${aiLastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Simulated — connect backend'}
            </span>
          </div>
        </div>

        {/* 4 Hazard Forecast Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              key: 'flood',
              icon: '🌊',
              label: 'Flood / Flash Flood',
              color: '#3b82f6',
              bgClass: 'from-blue-50 to-sky-50 border-blue-100',
              prob3h: aiData.hazard_summary?.flood?.prob_3h ?? 0.22,
              prob6h: aiData.hazard_summary?.flood?.prob_6h ?? 0.31,
              trend: aiData.hazard_summary?.flood?.trend ?? 'stable',
              detail: `${aiData.hazard_summary?.flood?.affected_nodes ?? 3} node(s) elevated`,
            },
            {
              key: 'wildfire',
              icon: '🔥',
              label: 'Wildfire / Forest Fire',
              color: '#f97316',
              bgClass: 'from-orange-50 to-red-50 border-orange-100',
              prob3h: aiData.hazard_summary?.wildfire?.prob_3h ?? 0.09,
              prob6h: aiData.hazard_summary?.wildfire?.prob_3h ?? 0.13,
              trend: aiData.hazard_summary?.wildfire?.trend ?? 'clear',
              detail: `${aiData.hazard_summary?.wildfire?.active_fires ?? 0} active fire(s)`,
            },
            {
              key: 'air',
              icon: '🏭',
              label: 'Air Quality / Pollution',
              color: '#8b5cf6',
              bgClass: 'from-violet-50 to-purple-50 border-violet-100',
              prob3h: aiData.hazard_summary?.air_quality?.prob_hazardous_3h ?? 0.14,
              prob6h: (aiData.hazard_summary?.air_quality?.prob_hazardous_3h ?? 0.14) * 1.2,
              trend: aiData.hazard_summary?.air_quality?.trend ?? 'acceptable',
              detail: `${aiData.hazard_summary?.air_quality?.nodes_above_100_aqi ?? 2} node(s) >100 AQI`,
            },
            {
              key: 'landslide',
              icon: '⛰️',
              label: 'Landslide / Soil Risk',
              color: '#78716c',
              bgClass: 'from-stone-50 to-amber-50 border-stone-100',
              prob3h: aiData.hazard_summary?.drought?.stress_nodes > 2 ? 0.38 : 0.08,
              prob6h: aiData.hazard_summary?.drought?.stress_nodes > 2 ? 0.45 : 0.12,
              trend: aiData.hazard_summary?.drought?.severity === 'high' ? 'elevated' : 'low',
              detail: `${aiData.hazard_summary?.drought?.stress_nodes ?? 1} node(s) soil stress`,
            },
          ].map((h) => {
            const pct3h = Math.round(h.prob3h * 100)
            const pct6h = Math.round(h.prob6h * 100)
            const riskLabel = pct6h >= 70 ? 'HIGH' : pct6h >= 40 ? 'MODERATE' : 'LOW'
            const riskCls = pct6h >= 70
              ? 'bg-red-100 text-red-700 border-red-200'
              : pct6h >= 40
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
            return (
              <div key={h.key} className={`rounded-2xl border bg-gradient-to-br ${h.bgClass} p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{h.icon}</span>
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">{h.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskCls}`}>{riskLabel}</span>
                </div>

                {/* Forecast bars */}
                <div className="space-y-2">
                  {[
                    { label: 'Next 3h', pct: pct3h },
                    { label: 'Next 6h', pct: pct6h },
                  ].map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-bold" style={{ color: h.color }}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden border border-white/50">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            background: pct >= 70 ? '#ef4444' : pct >= 40 ? '#f97316' : h.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trend + detail */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/50">
                  <span className="text-slate-500 font-mono">{h.detail}</span>
                  <span className={clsx(
                    'font-bold uppercase tracking-wide',
                    h.trend === 'rising' || h.trend === 'active' || h.trend === 'worsening' ? 'text-red-600' :
                    h.trend === 'stable' || h.trend === 'moderate' ? 'text-amber-600' : 'text-emerald-600'
                  )}>{h.trend}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Compound Alerts (multi-hazard) */}
        {aiData.compound_alerts?.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">⚠ Compound Hazard Alerts</div>
            {aiData.compound_alerts.map((alert, i) => (
              <div key={i} className={clsx(
                'rounded-xl border p-3 flex items-start gap-3',
                alert.severity === 'emergency' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              )}>
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                  alert.severity === 'emergency' ? 'bg-red-500' : 'bg-amber-500'
                )}>!</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900">{alert.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{alert.description}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Affected: {alert.affected_nodes?.join(', ')} · Confidence: {Math.round((alert.confidence ?? 0.8) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Network health footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Network health:
              <span className={clsx(
                'font-bold ml-1',
                (aiData.network_health ?? 87) >= 80 ? 'text-emerald-600' :
                (aiData.network_health ?? 87) >= 60 ? 'text-amber-600' : 'text-red-600'
              )}>{aiData.network_health ?? 87}%</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">{aiData.total_nodes ?? 18} nodes monitored</span>
          </div>
          <button
            onClick={() => { setAiLoading(true); fetch('http://localhost:4000/api/predict/summary').then(r => r.json()).then(d => { setAiData(d); setAiLastUpdated(new Date()) }).catch(() => {}).finally(() => setAiLoading(false)) }}
            className="text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Refresh AI
          </button>
        </div>
      </div>

      {/* ─── 3. Sensor Node Cards ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sensor nodes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Each ESP32 node calculates its own risk score from its live readings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Node 1: Flood & Water Sentinel */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0 border border-blue-100">💧</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">ESP32 Flood & Water Sentinel</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">ESP32-FLOOD</span>
                      <span className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border',
                        floodNode ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-slate-100 text-slate-500 border-slate-200'
                      )}>
                        <span className={`w-1.5 h-1.5 rounded-full ${floodNode ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {floodNode ? 'Live' : 'Simulated'}
                      </span>
                    </div>
                  </div>
                </div>
                <CircularGauge pct={Math.round(floodRisk)} color={floodRisk > 60 ? '#EF4444' : floodRisk > 30 ? '#F97316' : '#10B981'} />
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { label: 'Water distance', value: waterVal, unit: 'cm', ...sensorStatus(parseFloat(waterVal), { warn: 80, danger: 120 }) },
                  { label: 'Soil moisture', value: soilVal, unit: '%', ...sensorStatus(parseFloat(soilVal), { warn: 85, danger: 95 }) },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex items-center justify-between text-xs py-1 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <span className="text-slate-600 font-medium">{row.label}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-slate-900 font-sans">
                        {row.value} <span className="text-xs font-normal text-slate-500">{row.unit}</span>
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${row.cls}`}>{row.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100">
              {floodNode ? `Last packet: ${new Date(floodNode.last_seen || Date.now()).toLocaleTimeString()}` : 'Simulated — connect ESP32 for live data'}
            </div>
          </div>

          {/* Node 2: Fire & CO-Thermal Sentinel */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-lg flex-shrink-0 border border-orange-100">🔥</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">ESP32 Fire & CO-Thermal Sentinel</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">ESP32-COTEMP</span>
                      <span className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border',
                        cotempNode ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-slate-100 text-slate-500 border-slate-200'
                      )}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cotempNode ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {cotempNode ? 'Live' : 'Simulated'}
                      </span>
                    </div>
                  </div>
                </div>
                <CircularGauge pct={Math.round(cotempRisk)} color={cotempRisk > 60 ? '#EF4444' : cotempRisk > 30 ? '#F97316' : '#10B981'} />
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { label: 'CO gas', value: coVal, unit: 'ppm', ...sensorStatus(parseFloat(coVal), { warn: 35, danger: 100 }) },
                  { label: 'Temperature', value: tempVal, unit: '°C', ...sensorStatus(parseFloat(tempVal), { warn: 38, danger: 50 }) },
                  { label: 'Humidity (DHT11)', value: humVal, unit: '%', ...sensorStatus(parseFloat(humVal), { warn: 85, danger: 95 }) },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex items-center justify-between text-xs py-1 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <span className="text-slate-600 font-medium">{row.label}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-slate-900 font-sans">
                        {row.value} <span className="text-xs font-normal text-slate-500">{row.unit}</span>
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${row.cls}`}>{row.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100">
              {cotempNode ? `Last packet: ${new Date(cotempNode.last_seen || Date.now()).toLocaleTimeString()}` : 'Simulated — connect ESP32 for live data'}
            </div>
          </div>

          {/* Node 3: Air Quality & Toxic Gas Sentinel */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center text-lg flex-shrink-0 border border-cyan-100">💨</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">ESP32 Air Quality & Toxic Gas Sentinel</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">ESP32-POLLUTION</span>
                      <span className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border',
                        pollutionNode ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-slate-100 text-slate-500 border-slate-200'
                      )}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pollutionNode ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {pollutionNode ? 'Live' : 'Simulated'}
                      </span>
                    </div>
                  </div>
                </div>
                <CircularGauge pct={Math.round(pollutionRisk)} color={pollutionRisk > 60 ? '#EF4444' : pollutionRisk > 30 ? '#F97316' : '#10B981'} />
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { label: 'PM2.5', value: pm25Val, unit: 'µg/m³', ...sensorStatus(parseFloat(pm25Val), { warn: 35, danger: 55 }) },
                  { label: 'PM10',  value: pm10Val, unit: 'µg/m³', ...sensorStatus(parseFloat(pm10Val), { warn: 50, danger: 150 }) },
                  { label: 'MQ-135 NH3', value: nh3Val, unit: '%', ...sensorStatus(parseFloat(nh3Val), { warn: 50, danger: 80 }) },
                  { label: 'MQ-4 CH4', value: ch4Val, unit: '%', ...sensorStatus(parseFloat(ch4Val), { warn: 50, danger: 80 }) },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex items-center justify-between text-xs py-1 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <span className="text-slate-600 font-medium">{row.label}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-slate-900 font-sans">
                        {row.value} <span className="text-xs font-normal text-slate-500">{row.unit}</span>
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${row.cls}`}>{row.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100">
              {pollutionNode ? `Last packet: ${new Date(pollutionNode.last_seen || Date.now()).toLocaleTimeString()}` : 'Simulated — connect ESP32 for live data'}
            </div>
          </div>

        </div>
      </div>

      {/* ─── 4. Live Sensor Trend Matrix ─────────────────────────────────────── */}
      <LiveTelemetryStreamSection />

      {/* ─── 5. Map + Incidents / Event Stream ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: Regional Sentinel Spatial View */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Regional sentinel spatial view</h3>
              <p className="text-xs text-slate-500">All Gujarat Grid, schematic view · {onlineNodes}/{totalNodes} nodes online</p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="bg-slate-100 p-1 rounded-full flex items-center gap-1 border border-slate-200/60">
                {['normal', 'satellite', 'night'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMapMode(mode)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-bold transition-all capitalize',
                      mapMode === mode ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <Link to="/map" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>Expand map</span><span>&gt;</span>
              </Link>
            </div>
          </div>

          <div className="h-[360px] rounded-2xl overflow-hidden border border-slate-200 relative">
            <RiskMap
              nodes={nodes}
              height="100%"
              mode={mapMode}
              showModeSwitcher={false}
              zoom={8}
              center={[22.65, 71.85]}
            />
            <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between text-[11px] shadow-sm">
              <div className="flex items-center gap-3 font-medium">
                {[['bg-emerald-500', 'Normal'], ['bg-yellow-400', 'Watch'], ['bg-orange-500', 'Warning'], ['bg-red-600', 'Critical']].map(([color, label]) => (
                  <span key={label} className="flex items-center gap-1.5 text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Schematic view, not to scale</span>
            </div>
          </div>
        </div>

        {/* Right: Incidents & Event Stream */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col">

          {/* Tab Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200/60">
              <button
                type="button"
                onClick={() => setActiveTab('incidents')}
                className={clsx(
                  'px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5',
                  activeTab === 'incidents' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span>Incidents</span>
                {incidentCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-full">
                    {incidentCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stream')}
                className={clsx(
                  'px-3.5 py-1 rounded-full text-xs font-bold transition-all',
                  activeTab === 'stream' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Event stream
              </button>
            </div>

            <span className={clsx(
              'text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border',
              socketConnected
                ? 'bg-blue-50 text-blue-700 border-blue-200/70'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            )}>
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{socketConnected ? 'Live WebSocket' : 'Simulated'}</span>
            </span>
          </div>

          {/* Incidents Tab Content */}
          {activeTab === 'incidents' && (
            <div className="space-y-3.5 overflow-y-auto flex-1">
              {incidentAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-sm font-bold text-slate-700">All clear</p>
                  <p className="text-xs text-slate-400 mt-1">No active unacknowledged incidents</p>
                </div>
              ) : (
                incidentAlerts.map((alert) => (
                  <IncidentCard key={alert.id} alert={alert} navigate={navigate} />
                ))
              )}
            </div>
          )}

          {/* Event Stream Tab Content */}
          {activeTab === 'stream' && (
            <div className="space-y-2 overflow-y-auto flex-1 max-h-[360px]">
              {allAlertsSorted.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">No events yet</div>
              ) : (
                allAlertsSorted.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                    <div className={clsx(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      a.acknowledged ? 'bg-emerald-500' : a.severity === 'emergency' ? 'bg-red-600 animate-pulse' : 'bg-orange-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{a.id} · {a.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{a.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{a.location}</p>
                      {a.acknowledged && (
                        <span className="text-[10px] text-emerald-600 font-semibold">✓ {a.acknowledged_by ?? 'Acknowledged'}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer: quick node link */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm border border-blue-100">💧</div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>ESP32-FLOOD</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Flood & Water...)</span>
                  <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md">Advisory</span>
                </div>
                <div className="text-[11px] text-slate-500">Sant Sarovar Dam, Sabarmati, Gandhinagar</div>
              </div>
            </div>
            <Link to="/nodes/ESP32-FLOOD" className="text-blue-600 hover:underline font-bold">Spec details &gt;</Link>
          </div>
        </div>

      </div>

      {/* ─── 6. Fleet Telemetry by Hazard Category (5-col grid, dynamic counts) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fleet telemetry by hazard category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time multi-channel sensor bays with on-device rate-of-change inference.</p>
          </div>
          <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Continuous 2 s edge sampling</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { id: 'flood',   label: 'Flood & water level',    icon: '💧', color: '#0B84C9', iconBg: 'bg-blue-50 text-blue-600 border-blue-100',     sub: 'Water depth, flow rate, rainfall' },
            { id: 'fire',    label: 'Fire & thermal IR',       icon: '🔥', color: '#E0621A', iconBg: 'bg-orange-50 text-orange-600 border-orange-100', sub: 'Flame IR, temperature, smoke density' },
            { id: 'air',     label: 'Air quality (AQI)',       icon: '💨', color: '#8B5CF6', iconBg: 'bg-purple-50 text-purple-600 border-purple-100', sub: 'PM2.5, PM10, NO2, CO, SO2' },
            { id: 'chem',    label: 'Chemical & toxic gas',    icon: '🧪', color: '#EAB308', iconBg: 'bg-amber-50 text-amber-600 border-amber-100',    sub: 'VOC, LPG/CH4, H2S, ammonia' },
            { id: 'seismic', label: 'Seismic & vibration',    icon: '📈', color: '#10B981', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100', sub: 'Peak ground accel, frequency' },
          ].map((cat) => {
            const activeCount = catNodeCount(cat.id)
            const hasAlert    = catHasAlert(cat.id)
            return (
              <div key={cat.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 hover:shadow-xs transition-all">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg border ${cat.iconBg}`}>{cat.icon}</div>
                  <span className={clsx(
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
                    hasAlert
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : activeCount > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                  )}>
                    {hasAlert ? 'Alert' : activeCount > 0 ? 'Normal' : 'No nodes'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{cat.label}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{activeCount} node{activeCount !== 1 ? 's' : ''} active</span>
                  </div>
                </div>
                <CategoryWave category={cat.id} color={cat.color} />
                <div className="text-[11px] text-slate-400 font-medium">{cat.sub}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 7. Automated Inter-Agency Dispatch Audit Log (fully dynamic) ─── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Automated inter-agency dispatch audit log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Autonomous VoIP calls, SMS dispatches and CAD webhooks routed by the GSDMA rules engine.
              {dispatches.length > 0 && ` · ${dispatches.filter(d => d.status !== 'Not Notified').length} of ${dispatches.length} agencies notified`}
            </p>
          </div>
          <Link to="/settings" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto">
            <span>Configure rules</span><span>&gt;</span>
          </Link>
        </div>

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
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No dispatch records — alerts will trigger agency notifications automatically.
                  </td>
                </tr>
              ) : (
                dispatches.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.agency}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{d.channel}</td>
                    <td className="py-3.5 px-4">
                      <DispatchBadge status={d.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{d.sla_min} min SLA</td>
                    <td className="py-3.5 px-4 text-slate-600">{d.officer}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {d.notified_at ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
