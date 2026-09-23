// pages/AlertsPage.jsx — Immediate Warnings, GSDMA Triage Queue & Audit Acknowledgment
// Exact visual match to user-uploaded GSDMA Alerts Queue specifications

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

// Circular SVG Confidence Gauge Component
function ConfidenceGauge({ percent, color = '#f59e0b', trackColor = '#fef3c7', size = 52 }) {
  const strokeWidth = 4.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference

  return (
    <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-black text-slate-800 text-[11px] font-mono">
        {Math.round(percent)}%
      </span>
    </div>
  )
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const storeAlerts = useStore((s) => s.alerts)
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert)

  // Local state for interactive alerts list matching screenshot exactly
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('highest_confidence')
  const [selectedAlertForAck, setSelectedAlertForAck] = useState(null)
  const [ackOfficer, setAckOfficer] = useState('Officer R. Sharma (GSDMA)')
  const [showResolvedModal, setShowResolvedModal] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // Auto-escalation countdown (starting from 07:42)
  const [countdownSeconds, setCountdownSeconds] = useState(462)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (totalSec) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3200)
  }

  // Pre-seeded high-fidelity alerts matching the exact user screenshot
  const [alertsList, setAlertsList] = useState([
    {
      id: 'ALT-101',
      index: 1,
      title: 'Elevated Volatile Organic Chemical Plume',
      severity: 'warning', // WARNING
      hazard: 'chemical',
      landmark: 'Narol–Vatva GIDC Industrial Corridor, Ahmedabad',
      landmarkTag: 'Near Vatva GIDC Pumping Station',
      rootCause: {
        sensors: ['MQ-135', 'PID'],
        text: 'sensors detected a sustained VOC surge (>45 ppm) across 2 adjacent nodes.',
      },
      confidence: 86,
      detectedAt: '12 min ago',
      correlatedNodes: 2,
      nodeBadges: ['M', 'P2'],
      borderAccent: 'border-l-4 border-amber-500',
      badgeClass: 'bg-[#fef3c7] text-[#b45309]',
      gaugeColor: '#f59e0b',
      gaugeTrack: '#fef3c7',
      steps: [
        { label: 'Detected', completed: true },
        { label: 'Notified', completed: true },
        { label: 'Acknowledged', completed: false, stepNum: 3 },
        { label: 'Resolved', completed: false, stepNum: 4 },
      ],
      acknowledged: false,
      acknowledgedBy: null,
    },
    {
      id: 'ALT-102',
      index: 2,
      title: 'Upstream Discharge Advisory: Sabarmati Vasna',
      severity: 'watch', // WATCH
      hazard: 'flood',
      landmark: 'Vasna Barrage & Riverfront, Ahmedabad',
      landmarkTag: 'Vasna Barrage Gate 14',
      rootCause: {
        sensors: [],
        text: 'Ultrasonic sensor registered a steady inflow rate change of',
        highlight: '+8 cm/hr',
      },
      confidence: 78,
      detectedAt: '28 min ago',
      correlatedNodes: 1,
      nodeBadges: ['U1'],
      borderAccent: 'border-l-4 border-sky-400',
      badgeClass: 'bg-[#e0f2fe] text-[#0369a1]',
      gaugeColor: '#0ea5e9',
      gaugeTrack: '#e0f2fe',
      steps: [
        { label: 'Detected', completed: true },
        { label: 'Notified', completed: true },
        { label: 'Acknowledged', completed: true },
        { label: 'Resolved', completed: false, stepNum: 4 },
      ],
      acknowledged: true,
      acknowledgedBy: 'Officer R. Sharma (GSDMA)',
    },
  ])

  // Resolved alert banner
  const resolvedAlert = {
    id: 'ALT-098',
    title: 'Heat Advisory',
    meta: 'Rajkot & Saurashtra belt · resolved yesterday, 6:40 PM · closed by Officer R. Sharma',
  }

  // Count metrics
  const activeCount = alertsList.filter((a) => !a.acknowledged).length
  const emergencyCount = alertsList.filter((a) => a.severity === 'emergency').length
  const warningCount = alertsList.filter((a) => a.severity === 'warning').length
  const watchCount = alertsList.filter((a) => a.severity === 'watch').length
  const advisoryCount = alertsList.filter((a) => a.severity === 'advisory').length
  const resolvedCount = 1

  // Handle acknowledge
  const handleAcknowledge = (alertId) => {
    setAlertsList((prev) =>
      prev.map((a) => {
        if (a.id === alertId) {
          return {
            ...a,
            acknowledged: true,
            acknowledgedBy: ackOfficer,
            steps: [
              { label: 'Detected', completed: true },
              { label: 'Notified', completed: true },
              { label: 'Acknowledged', completed: true },
              { label: 'Resolved', completed: false, stepNum: 4 },
            ],
          }
        }
        return a
      })
    )
    if (acknowledgeAlert) acknowledgeAlert(alertId, ackOfficer)
    setSelectedAlertForAck(null)
    showToast(`✓ Alert ${alertId} verified & acknowledged by ${ackOfficer}`)
  }

  // Filtered & Sorted Alerts
  const filteredAlerts = useMemo(() => {
    return alertsList
      .filter((a) => {
        // Tab filtering
        if (activeTab === 'Emergency') return a.severity === 'emergency'
        if (activeTab === 'Warning') return a.severity === 'warning'
        if (activeTab === 'Watch') return a.severity === 'watch'
        if (activeTab === 'Advisory') return a.severity === 'advisory'
        if (activeTab === 'Resolved') return false // handled in resolved card
        return true
      })
      .filter((a) => {
        // Search query
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.landmark.toLowerCase().includes(q) ||
          a.severity.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortBy === 'highest_confidence') return b.confidence - a.confidence
        if (sortBy === 'newest') return a.index - b.index
        if (sortBy === 'pending') return (a.acknowledged ? 1 : 0) - (b.acknowledged ? 1 : 0)
        return 0
      })
  }, [alertsList, activeTab, searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans pb-24">
      {/* ─── Main Content Canvas ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-5">

        {/* ─── TOP HEADER CARD ───────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Icon & Titles */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fff1f2] border border-rose-100 text-rose-500 flex items-center justify-center text-2xl shadow-2xs flex-shrink-0">
              🚨
            </div>
            <div>
              <h1 className="text-xl sm:text-[22px] font-black text-slate-900 tracking-tight leading-snug">
                Immediate Warnings & <span className="text-red-500">Alerts Queue</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Action-oriented triage queue for multi-channel hazard incidents &{' '}
                <strong className="text-amber-500 font-bold">GSDMA escalation</strong>
              </p>
            </div>
          </div>

          {/* Right: Escalation Countdown Pill */}
          <div className="inline-flex items-center gap-2.5 bg-[#fff1f2] border border-rose-200/90 rounded-2xl px-4 py-2.5 text-xs text-rose-700 shadow-2xs font-medium self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              <b className="font-bold">{activeCount} pending</b> · auto-escalates in
            </span>
            <span className="font-mono font-bold text-rose-600 bg-white/90 border border-rose-200 px-2 py-0.5 rounded-lg text-xs shadow-2xs">
              {formatCountdown(countdownSeconds)}
            </span>
          </div>
        </div>

        {/* ─── 4 METRIC STAT CARDS ROW ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Incidents */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              ACTIVE INCIDENTS
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">2</span>
              <span className="text-xs text-slate-500 font-medium">open</span>
            </div>
          </div>

          {/* Card 2: Avg. Time to Acknowledge */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              AVG. TIME TO ACKNOWLEDGE
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">4.2</span>
              <span className="text-xs text-slate-500 font-medium">min</span>
            </div>
          </div>

          {/* Card 3: SLA Compliance (30D) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              SLA COMPLIANCE (30D)
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">96%</span>
              <span className="text-xs text-slate-500 font-medium">on target</span>
            </div>
          </div>

          {/* Card 4: Avg. Detection Confidence */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              AVG. DETECTION CONFIDENCE
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">82.3</span>
              <span className="text-xs text-slate-500 font-medium">%</span>
            </div>
          </div>
        </div>

        {/* ─── FILTER TABS & SEARCH BAR ROW ──────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Severity Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              {/* All */}
              <button
                type="button"
                onClick={() => setActiveTab('All')}
                className={clsx(
                  'px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-2xs',
                  activeTab === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span>All</span>
                <span className={clsx('text-[11px] px-1.5 py-0.2 rounded-full font-bold', activeTab === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')}>
                  2
                </span>
              </button>

              {/* Emergency */}
              <button
                type="button"
                onClick={() => setActiveTab('Emergency')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'Emergency'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Emergency</span>
                <span className="text-[11px] text-slate-400 font-mono">0</span>
              </button>

              {/* Warning */}
              <button
                type="button"
                onClick={() => setActiveTab('Warning')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'Warning'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Warning</span>
                <span className="text-[11px] text-slate-400 font-mono">1</span>
              </button>

              {/* Watch */}
              <button
                type="button"
                onClick={() => setActiveTab('Watch')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'Watch'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Watch</span>
                <span className="text-[11px] text-slate-400 font-mono">1</span>
              </button>

              {/* Advisory */}
              <button
                type="button"
                onClick={() => setActiveTab('Advisory')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'Advisory'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Advisory</span>
                <span className="text-[11px] text-slate-400 font-mono">0</span>
              </button>

              {/* Resolved */}
              <button
                type="button"
                onClick={() => setActiveTab('Resolved')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  activeTab === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Resolved</span>
                <span className="text-[11px] text-slate-400 font-mono">1</span>
              </button>
            </div>

            {/* Right Search Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by node, zone, ID..."
                className="w-full sm:w-64 pl-9 pr-4 py-1.5 text-xs bg-[#f8fafc] border border-slate-200/80 rounded-full text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>

          {/* Sub-Row: Sort Dropdown */}
          <div className="flex items-center gap-2 pt-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-2xs hover:bg-slate-50"
            >
              <option value="highest_confidence">Sort: Highest confidence</option>
              <option value="newest">Sort: Newest first</option>
              <option value="pending">Sort: Pending action first</option>
            </select>
          </div>
        </div>

        {/* ─── ALERT INCIDENT CARDS LIST ─────────────────────────────────── */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 && activeTab !== 'Resolved' ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center text-xs text-slate-500 shadow-xs">
              <span className="text-3xl block mb-2 text-emerald-600">✓</span>
              <span className="font-bold text-slate-800 text-sm">No incidents match this filter</span>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={clsx(
                  'bg-white rounded-2xl border-t border-r border-b border-slate-100 p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:shadow-md relative',
                  alert.borderAccent
                )}
              >
                {/* Top Row: #Index, Icon, Title, Badge, Confidence Gauge, Metadata */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left Group */}
                  <div className="flex items-start gap-3.5">
                    {/* Index badge */}
                    <div className="bg-slate-50 border border-slate-200 text-slate-500 font-mono text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5">
                      #{alert.index}
                    </div>

                    {/* Squircle icon */}
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-2xs',
                        alert.severity === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
                      )}
                    >
                      {alert.severity === 'warning' ? '☣️' : '🌧️'}
                    </div>

                    {/* Title and ID */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-700">
                          {alert.id}
                        </span>
                        <span
                          className={clsx(
                            'text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            alert.badgeClass
                          )}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                        {alert.title}
                      </h3>
                    </div>
                  </div>

                  {/* Right Group: Confidence Gauge & Metadata */}
                  <div className="flex items-center gap-4 ml-auto">
                    {/* Gauge */}
                    <ConfidenceGauge
                      percent={alert.confidence}
                      color={alert.gaugeColor}
                      trackColor={alert.gaugeTrack}
                      size={52}
                    />

                    {/* Meta info */}
                    <div className="text-right text-xs">
                      <div className="text-slate-400">
                        Detected <b className="text-slate-900 font-bold">{alert.detectedAt}</b>
                      </div>
                      <div className="text-slate-400 mt-0.5 flex items-center justify-end gap-1.5">
                        <span>
                          Correlated <b className="text-slate-900 font-bold">{alert.correlatedNodes} {alert.correlatedNodes > 1 ? 'nodes' : 'node'}</b>
                        </span>
                        <div className="flex items-center gap-1">
                          {alert.nodeBadges.map((badge, bIdx) => (
                            <span
                              key={bIdx}
                              className={clsx(
                                'text-[10px] font-mono font-bold text-white px-1.5 py-0.2 rounded-full',
                                alert.severity === 'warning' ? 'bg-blue-600' : 'bg-sky-500'
                              )}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle 2-Column Info Box: Affected Landmark & Root Cause Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Box: Affected Landmark */}
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      AFFECTED LANDMARK
                    </div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm mt-1">
                      {alert.landmark}
                    </div>
                    <div className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <span>📍</span>
                      <span>{alert.landmarkTag}</span>
                    </div>
                  </div>

                  {/* Right Box: Root Cause Analysis */}
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      ROOT CAUSE ANALYSIS
                    </div>
                    <div className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {alert.rootCause.sensors && alert.rootCause.sensors.length > 0 ? (
                        <>
                          {alert.rootCause.sensors.map((sName, sIdx) => (
                            <span key={sIdx}>
                              <span className="bg-blue-100 text-blue-700 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded">
                                {sName}
                              </span>
                              {sIdx < alert.rootCause.sensors.length - 1 ? ' and ' : ' '}
                            </span>
                          ))}
                          {alert.rootCause.text}
                        </>
                      ) : (
                        <>
                          {alert.rootCause.text}{' '}
                          {alert.rootCause.highlight && (
                            <span className="bg-blue-50 text-blue-600 font-mono font-bold px-1.5 py-0.5 rounded">
                              {alert.rootCause.highlight}
                            </span>
                          )}
                          .
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workflow Stepper Line */}
                <div className="pt-2">
                  <div className="flex items-center max-w-lg text-xs">
                    {alert.steps.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-center flex-1 last:flex-initial">
                        {/* Step Circle */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {st.completed ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
                              ✓
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-bold font-mono">
                              {st.stepNum}
                            </div>
                          )}
                          <span className={clsx('font-bold text-xs', st.completed ? 'text-slate-900' : 'text-slate-400')}>
                            {st.label}
                          </span>
                        </div>

                        {/* Connector line between steps */}
                        {sIdx < alert.steps.length - 1 && (
                          <div
                            className={clsx(
                              'flex-1 h-0.5 mx-3',
                              st.completed && alert.steps[sIdx + 1]?.completed ? 'bg-blue-600' : 'bg-slate-200'
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                  {/* Left: Acknowledge Button OR Status Badges */}
                  <div>
                    {!alert.acknowledged ? (
                      <button
                        type="button"
                        onClick={() => setSelectedAlertForAck(alert)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <span>✓</span>
                        <span>Acknowledge Alert</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <span>✓</span>
                          <span>Verified by {alert.acknowledgedBy || 'Officer R. Sharma (GSDMA)'}</span>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <span>✓</span>
                          <span>Acknowledged</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Open Command Console & Menu */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/console')}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>Open Command Console</span>
                      <span>→</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === alert.id ? null : alert.id)}
                        className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-2xs cursor-pointer font-bold"
                      >
                        ⋮
                      </button>

                      {/* Dropdown menu */}
                      {activeMenuId === alert.id && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-20 space-y-1 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              navigate('/console')
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            🚔 Dispatch Response Unit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              showToast(`Siren triggered in ${alert.landmarkTag}`)
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            🔊 Sound Perimeter Siren
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              showToast(`Escalated ${alert.id} to Gandhinagar SEOC`)
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            🏛️ Escalate to State SEOC
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* ─── RESOLVED ALERT BANNER (ALT-098) ─────────────────────────── */}
          {(activeTab === 'All' || activeTab === 'Resolved') && (
            <div className="border-l-4 border-emerald-500 rounded-2xl bg-white border-t border-r border-b border-slate-100 px-5 py-3.5 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  ✓
                </div>
                <div className="text-xs sm:text-sm">
                  <b className="text-slate-900 font-bold">{resolvedAlert.id} · {resolvedAlert.title}</b>
                  <span className="text-slate-500 text-xs"> — {resolvedAlert.meta}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResolvedModal(true)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-4 py-1.5 rounded-xl hover:bg-slate-50 shadow-2xs cursor-pointer transition-all"
              >
                View details
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── POPUP / MODAL: ACKNOWLEDGE INCIDENT ───────────────────────────── */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-blue-600">
                  {selectedAlertForAck.id} • Verification Audit
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                  Confirm Incident Acknowledgment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertForAck(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <div className="font-bold text-slate-800">{selectedAlertForAck.title}</div>
                <div className="text-slate-500">{selectedAlertForAck.landmark}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Acknowledging Officer Name
                </label>
                <input
                  type="text"
                  value={ackOfficer}
                  onChange={(e) => setAckOfficer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Acknowledging this event marks Step 3 in the state emergency audit trail, pauses the escalation countdown timer, and notifies connected dispatch units.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAlertForAck(null)}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAcknowledge(selectedAlertForAck.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/25 cursor-pointer transition-all"
              >
                Confirm & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── POPUP / MODAL: RESOLVED INCIDENT DETAILS (ALT-098) ──────────── */}
      {showResolvedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-slide-up space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  ✓
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    ALT-098 · Heat Advisory Post-Incident Audit
                  </h3>
                  <p className="text-xs text-slate-500">Rajkot & Saurashtra Belt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResolvedModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Peak Thermal Reading</span>
                  <span className="font-bold text-slate-800">44.6 °C</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Resolution Timestamp</span>
                  <span className="font-bold text-slate-800">Yesterday, 6:40 PM</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Resolution Authority</span>
                  <span className="font-bold text-emerald-700">Officer R. Sharma (GSDMA)</span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-600">
                Ambient surface temperatures stabilized below 38°C following sunset and north-westerly wind influx. Hydration points demobilized with zero heatstroke casualties reported.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResolvedModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
