import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function AlertsPage() {
  const navigate = useNavigate()
  const alerts = useStore((s) => s.alerts)
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert)

  const [filter, setFilter] = useState('All')
  const [criticalAcked, setCriticalAcked] = useState(false)
  const [advisoriesAcked, setAdvisoriesAcked] = useState({ 7: false, 19: false, 31: false })
  const [channels, setChannels] = useState({
    sms: true,
    roster: true,
    webhook: true,
    siren: false,
  })
  const [toast, setToast] = useState({
    visible: false,
    title: '',
    desc: '',
    isError: false,
  })

  const showNotification = (title, desc, isError = false) => {
    setToast({ visible: true, title, desc, isError })
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 4500)
  }

  const handleAcknowledgeCritical = () => {
    setCriticalAcked(true)
    showNotification(
      'Alert Acknowledged',
      'Cmdr Vance verified Zone 3 Flood Status. Incident escalated to Active Handling.'
    )
  }

  const handleTriggerSiren = () => {
    const confirmation = window.confirm(
      'TACTICAL PROTOCOL WARNING:\nAre you sure you want to broadcast public emergency siren and SMS to Catchment Zone 3 residents?'
    )
    if (confirmation) {
      showNotification(
        'Siren Array Dispatched',
        'Civil Evacuation Siren activated in Sector 3 (135dB broadcast in progress).',
        true
      )
    }
  }

  const handleCreateTicket = () => {
    showNotification(
      'Ticket Generated',
      'Incident ticket #INC-FLOOD-8820 synched to Jira & Civil Defense Hub.'
    )
  }

  const handleAckAdvisory = (id, name) => {
    setAdvisoriesAcked((prev) => ({ ...prev, [id]: true }))
    showNotification('Advisory Acknowledged', `${name} verified and logged to audit trail.`)
  }

  const handleMaintenanceModal = () => {
    showNotification(
      'Work Order Dispatched',
      'Maintenance order #MNT-031 created for Delta Marsh East solar clearing.'
    )
  }

  const toggleChannel = (ch) => {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }))
  }

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Command Broadcast Warning Ticker Strip */}
      <div className="w-full bg-error-container text-on-error-container px-space-lg py-space-xs flex items-center justify-between shadow-md">
        <div className="flex items-center gap-space-md min-w-0">
          <span className="inline-flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-error text-error font-label-caps text-label-caps uppercase animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-on-error"></span>
            Priority DEFCON 2
          </span>
          <span className="font-telemetry-sm text-telemetry-sm truncate">
            RESERVOIR HYDRAULIC SURGE DETECTED IN ZONE 3 SOUTHERN CATCHMENT • PROTOCOL OMEGA ACTIVATED
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-space-lg shrink-0">
          <span className="font-label-caps text-label-caps text-error">ESCALATION TIMER: 00:06:52</span>
          <span className="font-telemetry-sm text-telemetry-sm text-on-error-container/80">CHANNEL: SECURE-RELAY-B</span>
        </div>
      </div>

      <div className="px-space-lg py-space-lg flex flex-col gap-space-lg">
        {/* 1. Alerts Header & Severity Summary Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-stretch">
          {/* Critical Badge Stat Card */}
          <div className="md:col-span-3 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm group">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-error/10 blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                <span className="w-2 h-2 -ml-2.5 rounded-full bg-error"></span>
                <span className="font-label-caps text-label-caps text-error uppercase">Critical Alerts</span>
              </div>
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
            </div>
            <div className="flex items-baseline gap-space-sm mt-space-md">
              <span className="font-display-lg text-display-lg text-error leading-none">01</span>
              <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">Active Breach</span>
            </div>
            <div className="mt-space-sm flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs bg-surface-container/50 px-space-xs rounded">
              <span>Evac threshold</span>
              <span className="font-telemetry-sm text-telemetry-sm text-error">+12.8% over limit</span>
            </div>
          </div>

          {/* Warning Badge Stat Card */}
          <div className="md:col-span-3 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-secondary-container/10 blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="font-label-caps text-label-caps text-secondary uppercase">Warning Advisories</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[20px]">farsight_digital</span>
            </div>
            <div className="flex items-baseline gap-space-sm mt-space-md">
              <span className="font-display-lg text-display-lg text-secondary leading-none">03</span>
              <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">Action Required</span>
            </div>
            <div className="mt-space-sm flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs bg-surface-container/50 px-space-xs rounded">
              <span>Unresolved span</span>
              <span className="font-telemetry-sm text-telemetry-sm text-secondary">12m - 110m</span>
            </div>
          </div>

          {/* Resolved Today Stat Card */}
          <div className="md:col-span-3 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-label-caps text-label-caps text-primary uppercase">Resolved (24h)</span>
              </div>
              <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
            </div>
            <div className="flex items-baseline gap-space-sm mt-space-md">
              <span className="font-display-lg text-display-lg text-primary leading-none">18</span>
              <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">Telemetry Cleared</span>
            </div>
            <div className="mt-space-sm flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs bg-surface-container/50 px-space-xs rounded">
              <span>Mean MTTR</span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary">14.2 minutes</span>
            </div>
          </div>

          {/* Command Filter Navigation Selector */}
          <div className="md:col-span-3 bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase">Scope Selector</span>
              <span className="material-symbols-outlined text-outline text-[18px]">tune</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-space-xs" id="alert-filter-bar">
              {['All', 'Critical', 'Warning', 'Ack', 'Archive'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-space-sm py-0.5 rounded font-label-caps text-label-caps transition-all ${
                    filter === tab
                      ? 'bg-primary-container text-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {tab === 'All' && 'All (4)'}
                  {tab === 'Critical' && 'Critical (1)'}
                  {tab === 'Warning' && 'Warning (3)'}
                  {tab === 'Ack' && 'Ack (0)'}
                  {tab === 'Archive' && 'Archive'}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-telemetry-sm text-telemetry-sm">
              <span>Auto-refresh</span>
              <span className="text-primary font-semibold">1s Heartbeat</span>
            </div>
          </div>
        </div>

        {/* 2. Priority Incident Command Card (The Critical Flood Alert) */}
        {(filter === 'All' || filter === 'Critical') && (
          <div className="w-full bg-surface-container rounded-xl shadow-xl overflow-hidden relative" id="priority-card">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-error/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Tactical Header Banner */}
            <div className="bg-surface-container-high px-space-lg py-space-sm flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-md">
                <div className="w-3 h-3 rounded-full bg-error animate-ping"></div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-error tracking-tight font-bold">CRITICAL INCIDENT</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">#INC-FLOOD-8820</span>
                </div>
                <span className="px-space-xs py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-label-caps">
                  HYDROLOGIC RUNAWAY
                </span>
              </div>
              <div className="flex items-center gap-space-lg">
                <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-error">timer</span>
                  <span>Elapsed: <strong className="text-on-surface font-semibold">08m 42s</strong></span>
                </div>
                <div className={`px-space-sm py-0.5 rounded font-label-caps text-label-caps flex items-center gap-1 ${
                  criticalAcked ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {criticalAcked ? 'check_circle' : 'notifications_active'}
                  </span>
                  {criticalAcked ? 'ACKNOWLEDGED' : 'UNACKNOWLEDGED'}
                </div>
              </div>
            </div>

            {/* Main Body: Data Visualization + Tactical Specs */}
            <div className="p-space-lg grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* Left: Incident Telemetry Core (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-md">
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs text-error font-label-caps text-label-caps uppercase">
                    <span className="material-symbols-outlined text-[16px]">tsunami</span>
                    Zone 3 Southern Catchment Basin • Catchment Gate Alpha
                  </div>
                  <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight mt-0.5">
                    Flood Risk &amp; Reservoir Surge Breach
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Downstream acoustic wave telemetry confirms water column acceleration exceeding safe retention gradient by 28%. Runoff from upstream Sector 9 culvert is compounding pressure on the primary spillway.
                  </p>
                </div>

                {/* Live Telemetry KPI Matrix */}
                <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
                  <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-col">
                    <span className="font-label-caps text-label-caps text-outline uppercase">Current Water Level</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-telemetry-lg text-telemetry-lg text-error">2.82</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">m</span>
                    </div>
                    <span className="font-telemetry-sm text-telemetry-sm text-error mt-1 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +0.32m over limit
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-col">
                    <span className="font-label-caps text-label-caps text-outline uppercase">Spillway Threshold</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-telemetry-lg text-telemetry-lg text-on-surface">2.50</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">m MAX</span>
                    </div>
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant mt-1">Level 4 Dam Spec</span>
                  </div>
                  <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-col">
                    <span className="font-label-caps text-label-caps text-outline uppercase">Surge Velocity</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-telemetry-lg text-telemetry-lg text-secondary">+18</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">cm / 15m</span>
                    </div>
                    <span className="font-telemetry-sm text-telemetry-sm text-secondary mt-1">Exponential trend</span>
                  </div>
                </div>

                {/* Inline Realtime Sparkline & Hydraulic Projection */}
                <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps text-outline uppercase">Dynamic Water Column Profile (Last 60 Minutes)</span>
                    <span className="font-telemetry-sm text-telemetry-sm text-error">PROJECTED SPILL IN 22 MIN</span>
                  </div>
                  <div className="w-full h-24 relative flex items-end">
                    {/* Threshold guideline */}
                    <div className="absolute w-full top-7 border-t border-dashed border-error/50 flex justify-between items-center text-[9px] font-label-caps text-error px-1">
                      <span>THRESHOLD 2.50m</span>
                      <span className="bg-surface-container-lowest px-1">BREACH LEVEL</span>
                    </div>
                    {/* SVG Curve */}
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 80">
                      <defs>
                        <linearGradient id="surgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffb4ab" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#ffb4ab" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0,72 L 45,70 L 90,68 L 135,67 L 180,63 L 225,58 L 270,52 L 315,44 L 360,33 L 405,24 L 450,15 L 500,8 L 500,80 L 0,80 Z" fill="url(#surgeGrad)" />
                      <path d="M 0,72 L 45,70 L 90,68 L 135,67 L 180,63 L 225,58 L 270,52 L 315,44 L 360,33 L 405,24 L 450,15 L 500,8" fill="none" stroke="#ffb4ab" strokeLinecap="round" strokeWidth="2.5" />
                      <circle className="animate-ping" cx="500" cy="8" fill="#ffb4ab" r="4" />
                      <circle cx="500" cy="8" fill="#690005" r="3" />
                    </svg>
                  </div>
                  <div className="flex justify-between font-telemetry-sm text-telemetry-sm text-outline pt-1">
                    <span>13:30 UTC</span>
                    <span>13:50 UTC</span>
                    <span>14:10 UTC</span>
                    <span className="text-error font-semibold">14:32 UTC (NOW: 2.82m)</span>
                  </div>
                </div>
              </div>

              {/* Right: Geo-Context & Action Protocols (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-space-md">
                {/* Static Tactical Map View */}
                <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container-lowest flex flex-col justify-between p-space-sm">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-luminosity"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2PjaUJTmqiwBSTH6XHean5GSiduJ8MNH42dXF6rl8474xW1z-pkl6MT_QKY8WLoLJV9TY05JQMOFs_O81x093RDuOCw9oV-FYGuY2LejEyzSezWmkn607apRqwtwSaBIqvzDXmcsZfcIylIAB3MsY6yOwR6iQZwc6Z6h2ncq6tjHD3dLfo1qt563rEvAOe6JdVZtyiWYCnhKZpvynmjo_56s9z9GDvPnuXcVIGIhChEdWOH5va8TS')`,
                    }}
                  ></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-space-xs py-0.5 rounded bg-surface/90 text-on-surface font-label-caps text-label-caps backdrop-blur">
                      GPS: 34.0390° N, 118.2390° W
                    </span>
                    <span className="px-space-xs py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps">
                      NODE S-014 ONLINE
                    </span>
                  </div>
                  {/* Sensor Target Ring in Center */}
                  <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                    <div className="relative flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-error/30 animate-ping absolute"></div>
                      <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center text-error shadow-lg">
                        <span className="material-symbols-outlined text-[14px]">water_drop</span>
                      </div>
                    </div>
                    <span className="mt-1 font-label-caps text-label-caps text-white bg-black/70 px-space-xs py-0.5 rounded">
                      Hydro-Sonic Gauge 14
                    </span>
                  </div>
                  <div className="relative z-10 flex items-center justify-between font-telemetry-sm text-telemetry-sm text-on-surface/90 bg-surface/80 backdrop-blur px-space-xs py-0.5 rounded">
                    <span>Station Elevation: 112m MSL</span>
                    <span className="text-tertiary">Ping: 18ms (Starlink Mesh)</span>
                  </div>
                </div>

                {/* High-Priority Command Actions Grid */}
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-caps text-label-caps text-outline uppercase">Rapid Emergency Execution</span>
                  <div className="grid grid-cols-2 gap-space-xs">
                    <button
                      onClick={handleAcknowledgeCritical}
                      disabled={criticalAcked}
                      className={`flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg font-headline-sm text-headline-sm tracking-wide transition-all shadow-md active:scale-95 ${
                        criticalAcked
                          ? 'bg-surface-container-high text-primary cursor-default'
                          : 'bg-primary-container hover:bg-primary text-primary hover:text-on-primary-fixed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {criticalAcked ? 'task_alt' : 'verified'}
                      </span>
                      <span>{criticalAcked ? 'Acknowledged' : 'Acknowledge'}</span>
                    </button>
                    <button
                      onClick={handleTriggerSiren}
                      className="flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-secondary font-headline-sm text-headline-sm tracking-wide transition-all shadow-md active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">campaign</span>
                      <span>Broadcast Siren</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs">
                    <button
                      onClick={() => navigate('/map')}
                      className="flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-body-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                      <span>Route on Map</span>
                    </button>
                    <button
                      onClick={handleCreateTicket}
                      className="flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface font-body-sm text-body-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      <span>Create Ticket</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Active Warning & Advisory Cards List (Secondary Incidents) */}
        {(filter === 'All' || filter === 'Warning') && (
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Active Warnings &amp; Advisory Queue</h3>
                <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps">
                  3 UNRESOLVED
                </span>
              </div>
              <span className="font-telemetry-sm text-telemetry-sm text-outline">PRIORITY SORT: SEVERITY DESC</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
              {/* Warning Card 1: Toxic Particulate */}
              <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between gap-space-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary"></div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="px-space-xs py-0.5 rounded bg-secondary-container/30 text-secondary font-label-caps text-label-caps uppercase">
                        Advisory S-007
                      </span>
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">14:10 UTC</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[18px]">masks</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mt-1 leading-snug">
                    Toxic Particulate Spike
                  </h4>
                  <span className="font-body-sm text-body-sm text-outline">Industrial Sector 4 • Chimney Flue Cluster</span>
                  <div className="mt-space-xs bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline">Air Quality Index</span>
                      <span className="font-telemetry-lg text-telemetry-lg text-secondary">186 AQI</span>
                    </div>
                    <div className="h-8 w-px bg-[#1a261d]"></div>
                    <div className="flex flex-col text-right">
                      <span className="font-label-caps text-label-caps text-outline">PM2.5 Load</span>
                      <span className="font-telemetry-md text-telemetry-md text-on-surface">84 µg/m³</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Particulate surge detected downwind of metallurgical smelter. Ventilation advisory dispatched.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs pt-space-xs">
                  <button
                    onClick={() => navigate('/map')}
                    className="flex-1 py-1.5 px-space-sm rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    Map
                  </button>
                  <button
                    onClick={() => handleAckAdvisory(7, 'S-007 Toxic Particulate')}
                    className={`flex-1 py-1.5 px-space-sm rounded font-body-sm text-body-sm flex items-center justify-center gap-1 transition-colors ${
                      advisoriesAcked[7]
                        ? 'bg-surface-container-high text-primary'
                        : 'bg-primary-container hover:bg-primary text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {advisoriesAcked[7] ? 'task_alt' : 'check'}
                    </span>
                    {advisoriesAcked[7] ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                </div>
              </div>

              {/* Warning Card 2: Temperature Spike */}
              <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between gap-space-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary"></div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="px-space-xs py-0.5 rounded bg-secondary-container/30 text-secondary font-label-caps text-label-caps uppercase">
                        Advisory S-019
                      </span>
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">13:55 UTC</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[18px]">thermostat</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mt-1 leading-snug">
                    Ambient Temperature Spike
                  </h4>
                  <span className="font-body-sm text-body-sm text-outline">Solar Array Substation • Inverter Bay C</span>
                  <div className="mt-space-xs bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline">Cabinet Temp</span>
                      <span className="font-telemetry-lg text-telemetry-lg text-secondary">44.8°C</span>
                    </div>
                    <div className="h-8 w-px bg-[#1a261d]"></div>
                    <div className="flex flex-col text-right">
                      <span className="font-label-caps text-label-caps text-outline">Max Safety</span>
                      <span className="font-telemetry-md text-telemetry-md text-on-surface">42.0°C</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Cooling fan auxiliary loop failure suspected. Thermal throttling engaged automatically.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs pt-space-xs">
                  <button
                    onClick={() => navigate('/map')}
                    className="flex-1 py-1.5 px-space-sm rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    Map
                  </button>
                  <button
                    onClick={() => handleAckAdvisory(19, 'S-019 Ambient Temp')}
                    className={`flex-1 py-1.5 px-space-sm rounded font-body-sm text-body-sm flex items-center justify-center gap-1 transition-colors ${
                      advisoriesAcked[19]
                        ? 'bg-surface-container-high text-primary'
                        : 'bg-primary-container hover:bg-primary text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {advisoriesAcked[19] ? 'task_alt' : 'check'}
                    </span>
                    {advisoriesAcked[19] ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                </div>
              </div>

              {/* Warning Card 3: Battery Discharge */}
              <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between gap-space-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary"></div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="px-space-xs py-0.5 rounded bg-secondary-container/30 text-secondary font-label-caps text-label-caps uppercase">
                        Advisory S-031
                      </span>
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">12:40 UTC</span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[18px]">battery_alert</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mt-1 leading-snug">
                    Critical Battery Discharge
                  </h4>
                  <span className="font-body-sm text-body-sm text-outline">Delta Marsh East • Remote Bio-Acoustic Buoy</span>
                  <div className="mt-space-xs bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps text-outline">Remaining Charge</span>
                      <span className="font-telemetry-lg text-telemetry-lg text-secondary">4%</span>
                    </div>
                    <div className="h-8 w-px bg-[#1a261d]"></div>
                    <div className="flex flex-col text-right">
                      <span className="font-label-caps text-label-caps text-outline">Photovoltaic Input</span>
                      <span className="font-telemetry-md text-telemetry-md text-error">0.02 W (Blocked)</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Photovoltaic surface foliage accumulation. Node estimated shutdown in 1.4 hours without clearing.
                  </p>
                </div>
                <div className="flex items-center gap-space-xs pt-space-xs">
                  <button
                    onClick={handleMaintenanceModal}
                    className="w-full py-1.5 px-space-sm rounded bg-surface-container-high hover:bg-surface-bright text-secondary font-body-sm text-body-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">build</span>
                    Create Maintenance Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Notification Delivery Log & Escalation Matrix (Side-by-Side Bento) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Dispatch Audit Log (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Automated Dispatch Audit Trail</span>
              </div>
              <span className="font-label-caps text-label-caps text-outline">ISO-22320 COMPLIANT LOG</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="text-outline font-label-caps text-label-caps bg-surface-container-lowest">
                    <th className="py-space-xs px-space-sm">Timestamp</th>
                    <th className="py-space-xs px-space-sm">Channel</th>
                    <th className="py-space-xs px-space-sm">Recipient Authority</th>
                    <th className="py-space-xs px-space-sm">Payload Details</th>
                    <th className="py-space-xs px-space-sm text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a261d]">
                  <tr className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-space-sm px-space-sm font-telemetry-sm text-telemetry-sm text-on-surface">14:33:12 UTC</td>
                    <td className="py-space-sm px-space-sm">
                      <span className="inline-flex items-center gap-1 font-telemetry-sm text-telemetry-sm text-secondary">
                        <span className="material-symbols-outlined text-[14px]">sms</span> SMS Priority
                      </span>
                    </td>
                    <td className="py-space-sm px-space-sm font-semibold text-on-surface">Regional Fire &amp; Flood Marshal</td>
                    <td className="py-space-sm px-space-sm text-on-surface-variant">S-014 Water level 2.82m / Evac Warning</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps">DELIVERED</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-space-sm px-space-sm font-telemetry-sm text-telemetry-sm text-on-surface">14:32:45 UTC</td>
                    <td className="py-space-sm px-space-sm">
                      <span className="inline-flex items-center gap-1 font-telemetry-sm text-telemetry-sm text-tertiary">
                        <span className="material-symbols-outlined text-[14px]">webhook</span> REST Webhook
                      </span>
                    </td>
                    <td className="py-space-sm px-space-sm font-semibold text-on-surface">Civil Protection Agency Endpoint</td>
                    <td className="py-space-sm px-space-sm text-on-surface-variant">JSON Payload v2 (Zone 3 Geofence Trigger)</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps">200 OK (84ms)</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-space-sm px-space-sm font-telemetry-sm text-telemetry-sm text-on-surface">14:32:06 UTC</td>
                    <td className="py-space-sm px-space-sm">
                      <span className="inline-flex items-center gap-1 font-telemetry-sm text-telemetry-sm text-error">
                        <span className="material-symbols-outlined text-[14px]">volume_up</span> Acoustic Siren
                      </span>
                    </td>
                    <td className="py-space-sm px-space-sm font-semibold text-on-surface">Catchment Alpha Siren Array</td>
                    <td className="py-space-sm px-space-sm text-on-surface-variant">Hardware Test Pulse OK / Awaiting Armed Exec</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-caps text-label-caps">STANDBY ARMED</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-space-sm px-space-sm font-telemetry-sm text-telemetry-sm text-on-surface">14:10:22 UTC</td>
                    <td className="py-space-sm px-space-sm">
                      <span className="inline-flex items-center gap-1 font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px]">notifications</span> Push Alert
                      </span>
                    </td>
                    <td className="py-space-sm px-space-sm font-semibold text-on-surface">Field Team Bravo Mobile App</td>
                    <td className="py-space-sm px-space-sm text-on-surface-variant">S-007 Sector 4 AQI Spikes over 180</td>
                    <td className="py-space-sm px-space-sm text-right">
                      <span className="px-space-xs py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps">ACKNOWLEDGED</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-telemetry-sm text-telemetry-sm">
              <span>Displaying 4 most recent dispatch transactions</span>
              <Link to="/history" className="text-primary hover:underline flex items-center gap-0.5">
                View full encrypted dispatch ledger <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Quick Escalation & Channel Configuration (4 cols) */}
          <div className="lg:col-span-4 bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Dispatch Channels</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              </div>
              <div className="flex flex-col gap-space-sm mt-space-xs">
                {/* Channel 1: SMS Gateway */}
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">cell_tower</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md text-on-surface font-medium">Tactical SMS / GSM</span>
                      <span className="font-telemetry-sm text-telemetry-sm text-outline">Primary Quad-Band Modem</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.sms}
                      onChange={() => toggleChannel('sms')}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-[#1a261d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
                  </label>
                </div>

                {/* Channel 2: PagerDuty Incident Hook */}
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">contact_emergency</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md text-on-surface font-medium">Emergency Duty Roster</span>
                      <span className="font-telemetry-sm text-telemetry-sm text-outline">Rotation: Cmdr Vance / Dr Ellis</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.roster}
                      onChange={() => toggleChannel('roster')}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-[#1a261d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
                  </label>
                </div>

                {/* Channel 3: Civil Webhook API */}
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[18px]">api</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md text-on-surface font-medium">Civil Agency Webhooks</span>
                      <span className="font-telemetry-sm text-telemetry-sm text-outline">Endpoint TLS v1.3 Guarded</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.webhook}
                      onChange={() => toggleChannel('webhook')}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-[#1a261d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
                  </label>
                </div>

                {/* Channel 4: Automated Public Acoustic Siren */}
                <div className="bg-surface-container-lowest p-space-sm rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-error">
                      <span className="material-symbols-outlined text-[18px]">volume_up</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md text-on-surface font-medium">Acoustic Siren Array</span>
                      <span className="font-telemetry-sm text-telemetry-sm text-outline">135dB Basin Cluster</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.siren}
                      onChange={() => toggleChannel('siren')}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-[#1a261d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-space-md p-space-xs bg-surface-container-lowest rounded flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase">Manual Override Lock</span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary">ARMED &amp; MONITORED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification Overlay */}
      <div
        className={`fixed bottom-6 right-6 bg-surface-container-high border-0 shadow-2xl rounded-xl p-space-md flex items-center gap-space-md transform transition-transform duration-300 z-50 ${
          toast.visible ? 'translate-y-0' : 'translate-y-32'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            toast.isError ? 'bg-error text-error' : 'bg-primary-container text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.isError ? 'campaign' : 'verified'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            {toast.title}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {toast.desc}
          </span>
        </div>
        <button
          onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
          className="p-1 text-outline hover:text-on-surface transition-colors ml-space-sm"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  )
}
