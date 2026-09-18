// pages/Dashboard.jsx — AegisNet Command Operations Dashboard · Sleek Modern Rounded UI
import { Link, useNavigate } from 'react-router-dom'
import { useStore, SENSOR_CATEGORIES } from '../store/useStore'
import RiskMap from '../components/map/RiskMap'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'

const CATEGORY_SPARKLINES = {
  flood:  [{ v: 12 }, { v: 16 }, { v: 22 }, { v: 34 }, { v: 48 }, { v: 62 }, { v: 58 }],
  fire:   [{ v: 24 }, { v: 28 }, { v: 31 }, { v: 29 }, { v: 35 }, { v: 38 }, { v: 34 }],
  air:    [{ v: 45 }, { v: 52 }, { v: 68 }, { v: 85 }, { v: 78 }, { v: 72 }, { v: 65 }],
  chem:   [{ v: 15 }, { v: 18 }, { v: 22 }, { v: 26 }, { v: 24 }, { v: 21 }, { v: 19 }],
  seismic:[{ v: 8 },  { v: 9 },  { v: 14 }, { v: 26 }, { v: 12 }, { v: 10 }, { v: 9  }],
}

function CategorySparkline({ category, color, gradientId }) {
  const data = CATEGORY_SPARKLINES[category] || CATEGORY_SPARKLINES.flood
  return (
    <div className="w-full h-8 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── ESP32 Node Card — shows only the sensors relevant to each node type ─────
function Esp32NodeCard({ node }) {
  const nt = (node.node_type || node.category || '').toLowerCase()
  const isFlood      = nt === 'flood'      || node.node_id?.includes('FLOOD')
  const isCotemp     = nt === 'fire'       || nt === 'cotemp' || node.node_id?.includes('COTEMP')
  const isPollution  = nt === 'air'        || nt === 'pollution' || node.node_id?.includes('POLLUTION')

  const riskPct = Math.max(
    node.risk_flood || 0,
    node.risk_fire  || 0,
    node.risk_pollution || 0
  )
  const riskColor = riskPct >= 80 ? 'text-red-600' : riskPct >= 50 ? 'text-amber-600' : 'text-emerald-600'
  const borderColor = riskPct >= 80 ? 'border-red-300 bg-red-50/60' : riskPct >= 50 ? 'border-amber-300 bg-amber-50/60' : 'border-emerald-300 bg-emerald-50/60'

  return (
    <div className={clsx('rounded-2xl border-2 p-4 space-y-3 shadow-sm', borderColor)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {isFlood ? '🌊' : isCotemp ? '🔥' : isPollution ? '🌫️' : '📡'}
          </span>
          <div>
            <div className="text-xs font-extrabold text-slate-800 leading-tight">
              {node.name || node.node_id}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{node.node_id}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            LIVE
          </span>
          <span className={clsx('text-xs font-mono font-bold', riskColor)}>
            Risk {riskPct}%
          </span>
        </div>
      </div>

      {/* Metrics — only show what this node type produces */}
      <div className="grid grid-cols-2 gap-2">

        {/* FLOOD NODE metrics */}
        {isFlood && <>
          <div className="rounded-xl bg-white/80 border border-blue-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Water Distance</div>
            <div className="text-xl font-mono font-bold text-blue-700 mt-0.5">
              {node.water_level_cm != null ? `${node.water_level_cm.toFixed(1)} cm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {node.water_level_cm < 50 ? '🔴 Critical — water very close' : node.water_level_cm < 100 ? '🟡 Warning — rising' : '🟢 Normal'}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 border border-blue-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Soil Moisture</div>
            <div className="text-xl font-mono font-bold text-blue-700 mt-0.5">
              {node.soil_moisture != null ? `${node.soil_moisture.toFixed(1)} %` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {node.soil_moisture > 90 ? '🔴 Saturated' : node.soil_moisture > 70 ? '🟡 Wet' : '🟢 Normal'}
            </div>
          </div>
        </>}

        {/* CO+TEMP NODE metrics */}
        {isCotemp && <>
          <div className="rounded-xl bg-white/80 border border-orange-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">CO Gas</div>
            <div className="text-xl font-mono font-bold text-orange-700 mt-0.5">
              {node.gas_ppm != null ? `${node.gas_ppm.toFixed(2)} ppm` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {node.gas_ppm > 9 ? '🔴 Dangerous' : node.gas_ppm > 5 ? '🟡 Elevated' : '🟢 Safe'}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 border border-orange-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Temperature</div>
            <div className="text-xl font-mono font-bold text-orange-700 mt-0.5">
              {node.temperature_c != null ? `${node.temperature_c.toFixed(1)} °C` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {node.temperature_c > 40 ? '🔴 Critical' : node.temperature_c > 35 ? '🟡 High' : '🟢 Normal'}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 border border-orange-100 p-3 col-span-2">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Humidity (DHT11)</div>
            <div className="text-xl font-mono font-bold text-orange-700 mt-0.5">
              {node.humidity_pct != null ? `${node.humidity_pct.toFixed(1)} %` : '—'}
            </div>
          </div>
        </>}

        {/* POLLUTION NODE metrics */}
        {isPollution && <>
          <div className="rounded-xl bg-white/80 border border-purple-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">PM2.5</div>
            <div className="text-xl font-mono font-bold text-purple-700 mt-0.5">
              {node.smoke_aqi != null ? `${node.smoke_aqi} µg/m³` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {node.smoke_aqi > 55 ? '🔴 Very Unhealthy' : node.smoke_aqi > 35 ? '🟡 Unhealthy' : '🟢 Good'}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 border border-purple-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">PM10</div>
            <div className="text-xl font-mono font-bold text-purple-700 mt-0.5">
              {node.pm10 != null ? `${node.pm10} µg/m³` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {node.pm10 > 100 ? '🔴 Critical' : node.pm10 > 50 ? '🟡 Warning' : '🟢 Safe'}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 border border-purple-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">MQ-135 NH3</div>
            <div className={clsx('text-base font-mono font-bold mt-0.5',
              node.mq135_status === 'DETECTED' ? 'text-red-600' : 'text-emerald-600'
            )}>
              {node.mq135_status || '—'}
            </div>
            {node.mq135_strength != null && (
              <div className="text-[10px] text-slate-400">{node.mq135_strength.toFixed(1)}% strength</div>
            )}
          </div>
          <div className="rounded-xl bg-white/80 border border-purple-100 p-3">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">MQ-4 CH4</div>
            <div className={clsx('text-base font-mono font-bold mt-0.5',
              node.mq4_status === 'DETECTED' ? 'text-red-600' : 'text-emerald-600'
            )}>
              {node.mq4_status || '—'}
            </div>
            {node.mq4_strength != null && (
              <div className="text-[10px] text-slate-400">{node.mq4_strength.toFixed(1)}% strength</div>
            )}
          </div>
        </>}
      </div>

      {/* Last updated */}
      <div className="text-[10px] text-slate-400 text-right font-mono">
        Updated: {node.last_update || 'Just now'}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate        = useNavigate()
  const nodes           = useStore((s) => s.nodes)
  const alerts          = useStore((s) => s.alerts)
  const dispatches      = useStore((s) => s.dispatches)
  const selectedRegion  = useStore((s) => s.selectedRegion)
  const esp32Nodes      = useStore((s) => s.esp32Nodes)
  const socketConnected = useStore((s) => s.socketConnected)
  const hardwareMode    = useStore((s) => s.hardwareMode)

  const onlineCount     = nodes.filter((n) => n.status === 'online').length
  const totalCount      = nodes.length
  const activeAlerts    = alerts.filter((a) => !a.acknowledged)
  const emergencyAlerts = alerts.filter((a) => a.severity === 'emergency' || a.severity === 'warning')

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans animate-slide-up">

      {/* ─── 0. ESP32 Live Hardware Panel (shown when ESP32 is connected) ──── */}
      {esp32Nodes.length > 0 && (
        <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-5 shadow-md space-y-4">
          {/* Banner */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-sm">
                <span className="text-white text-xl">🔌</span>
              </div>
              <div>
                <div className="text-sm font-extrabold text-emerald-800 tracking-tight">
                  Live ESP32 Hardware Connected
                </div>
                <div className="text-xs text-emerald-600">
                  {esp32Nodes.length} node{esp32Nodes.length > 1 ? 's' : ''} detected via USB Serial Bridge · Auto-monitoring active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={clsx(
                'text-[10px] font-bold px-3 py-1 rounded-full border',
                socketConnected
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              )}>
                {socketConnected ? '● Backend Connected' : '○ Backend Offline'}
              </span>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-300">
                MODE: {hardwareMode.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Node cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {esp32Nodes.map((node) => (
              <Esp32NodeCard key={node.node_id} node={node} />
            ))}
          </div>
        </div>
      )}

      {/* ─── 1. Hero Metric Strip (Landing Page Aesthetic, Curved 3XL) ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">



        {/* Alert count card */}
        <div className={clsx(
          'rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_20px_40px_-5px_rgba(37,99,235,0.14)] hover:-translate-y-0.5',
          activeAlerts.length > 0
            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-2 border-red-300/80 dark:border-red-500/40'
            : 'bg-white/80 dark:bg-slate-900/80 border border-white/80 dark:border-slate-800 hover:border-blue-300/80'
        )}>
          <div className="flex items-center justify-between">
            <span className={clsx(
              'text-[10px] font-extrabold tracking-widest uppercase',
              activeAlerts.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
            )}>Critical Alerts</span>
            {activeAlerts.length > 0 ? (
              <span className="bg-red-500 text-white text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">ACTIVE</span>
            ) : (
              <span className="bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-xs">ALL CLEAR</span>
            )}
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className={clsx('text-5xl font-mono font-extrabold leading-none', activeAlerts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')}>
              {activeAlerts.length}
            </div>
            <Link to="/alerts" className={clsx('text-xs font-bold hover:underline underline-offset-2', activeAlerts.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-cyan-400')}>
              Review Queue →
            </Link>
          </div>
          <div className="space-y-2">
            <div className="w-full h-2 bg-slate-100/90 dark:bg-slate-800/80 rounded-full overflow-hidden flex">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${(alerts.filter((a) => a.severity === 'emergency').length / (alerts.length || 1)) * 100}%` }} />
              <div className="bg-amber-400 h-full" style={{ width: `${(alerts.filter((a) => a.severity === 'warning').length / (alerts.length || 1)) * 100}%` }} />
              <div className="bg-emerald-500 h-full" style={{ width: `${(alerts.filter((a) => a.severity === 'watch').length / (alerts.length || 1)) * 100}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {alerts.filter((a) => a.severity === 'emergency').length} Emergency · {alerts.filter((a) => a.severity === 'warning').length} Warning
            </div>
          </div>
        </div>

        {/* Fleet online card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_20px_40px_-5px_rgba(37,99,235,0.14)] hover:-translate-y-0.5 hover:border-blue-300/80 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">LoRa Fleet Online</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className="text-5xl font-mono font-extrabold text-slate-900 dark:text-white">{onlineCount}</div>
            <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-900/40 border border-blue-200/80 dark:border-blue-700/60 px-2.5 py-0.5 rounded-full shadow-xs">
              {((onlineCount / (totalCount || 1)) * 100).toFixed(0)}% mesh active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-medium">
            <span>433MHz LoRa + WiFi 6</span>
            <Link to="/fleet" className="text-blue-600 dark:text-cyan-400 hover:underline font-bold">Fleet View →</Link>
          </div>
        </div>

        {/* Latency card */}
        <div className="bg-gradient-to-br from-blue-50/80 via-sky-50/70 to-cyan-50/80 dark:from-slate-900/80 dark:via-blue-950/40 dark:to-cyan-950/30 backdrop-blur-xl border border-blue-200/80 dark:border-blue-800/60 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_20px_40px_-5px_rgba(37,99,235,0.14)] hover:-translate-y-0.5 hover:border-blue-400/80 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-widest">On-Device Inference</span>
            <span className="text-lg">⚡</span>
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className="text-4xl font-mono font-extrabold text-blue-600 dark:text-cyan-400">&lt;180ms</div>
            <span className="text-xs font-mono font-bold text-blue-800 dark:text-blue-200 bg-blue-100/90 dark:bg-blue-900/50 border border-blue-200/80 dark:border-blue-700/60 px-2.5 py-0.5 rounded-full shadow-xs">TinyML Micro</span>
          </div>
          <div className="text-[11px] text-blue-800/90 dark:text-blue-300/90 font-medium">
            Autonomous statistical classification with zero cloud lag
          </div>
        </div>

        {/* Grid focus card */}
        <div className="bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 border border-white/20 rounded-3xl p-6 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between text-white ring-1 ring-white/30 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-100 uppercase tracking-widest">Spatial Catchment Grid</span>
            <span className="text-lg">🗺️</span>
          </div>
          <div className="my-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold capitalize text-white">
              {selectedRegion === 'all' ? 'Tapi Basin' : selectedRegion}
            </div>
            <span className="text-xs font-mono text-white font-bold bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full backdrop-blur-xs shadow-xs">15km IDW</span>
          </div>
          <div className="text-[11px] text-blue-100/90 font-medium">Multi-Sensor Spatial Co-Validation</div>
        </div>
      </div>

      {/* ─── 2. Sensor Category Health Grid (Landing Reference) ──────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Sensor Fleet Telemetry by Hazard Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time multi-channel sensor bays with on-device rate-of-change inference</p>
          </div>
          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3.5 py-1 rounded-full shadow-xs self-start sm:self-auto">
            ● Continuous 2s Edge Sampling
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {SENSOR_CATEGORIES.map((cat) => {
            const catNodes  = nodes.filter((n) => n.category === cat.id)
            const alertNodes = catNodes.filter((n) => n.risk_score >= 50)
            const colorMap = {
              flood: '#06b6d4',
              fire: '#f97316',
              air: '#8b5cf6',
              chem: '#eab308',
              seismic: '#10b981',
            }
            const sparkColor = hasAlert ? '#ef4444' : (colorMap[cat.id] || '#2563eb')

            return (
              <div
                key={cat.id}
                className={clsx(
                  'rounded-3xl p-4.5 space-y-2.5 transition-all duration-300 backdrop-blur-xl',
                  hasAlert
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-900/80 border border-white/80 dark:border-slate-800 hover:border-blue-300 hover:shadow-lg shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={clsx(
                    'w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-sm',
                    hasAlert ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700'
                  )}>
                    {cat.icon}
                  </div>
                  <span className={clsx(
                    'text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-xs',
                    hasAlert
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  )}>
                    {hasAlert ? `${alertNodes.length} WARNING` : 'NORMAL'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{catNodes.length} Nodes Active</div>
                </div>

                {/* Glowing Sparkline Wave Chart */}
                <CategorySparkline category={cat.id} color={sparkColor} gradientId={`catSpark_${cat.id}`} />

                <div className="text-[10px] text-slate-400 truncate font-mono">{cat.metrics.join(' · ')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 3. Two-Column: Active Emergencies + Event Stream ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: Emergencies + Mini Map */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-sm font-bold border border-red-100">🚨</div>
                <h3 className="font-extrabold text-sm text-red-700 uppercase tracking-wide">Active Hazard Incidents</h3>
              </div>
              <Link to="/console" className="text-xs font-bold text-blue-600 hover:underline underline-offset-2">Open Console →</Link>
            </div>

            {emergencyAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#f8fafc] rounded-2xl border border-slate-200/90">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl mx-auto mb-2">✓</div>
                All regional parameters within safe limits. Zero active emergency escalations.
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-2xl border border-red-200/90 bg-gradient-to-r from-red-50/80 to-rose-50/60 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-red-700 uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        {alert.severity}: {alert.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{alert.timestamp}</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">{alert.title}</div>
                    <div className="text-[11px] text-slate-600 truncate">{alert.location}</div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500">
                        Confidence: <b className="text-blue-600">{alert.confidence_pct}%</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/console')}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm shadow-red-500/20 transition-all hover:scale-105"
                      >
                        Action in Console →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Regional Sentinel Spatial View</span>
              <Link to="/map" className="text-xs font-bold text-blue-600 hover:underline underline-offset-2">Expand Full Map ↗</Link>
            </div>
            <div className="h-44 rounded-2xl overflow-hidden border border-slate-200">
              <RiskMap nodes={nodes} height="100%" />
            </div>
          </div>
        </div>

        {/* Right: Event Stream */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-sm">📡</div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Classified Event Stream <span className="text-slate-400 font-normal">(Edge-AI Telemetry)</span>
              </h3>
            </div>
            <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full shadow-xs">
              ● Live WebSocket
            </span>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {nodes.slice(0, 8).map((node) => {
              const isHigh = node.risk_score >= 50
              return (
                <div
                  key={node.node_id}
                  className={clsx(
                    'flex items-start justify-between gap-3 p-4 rounded-2xl border text-xs transition-all',
                    isHigh
                      ? 'bg-red-50/70 border-red-200/80 hover:bg-red-100/60'
                      : 'bg-[#f8fafc] border-slate-200/80 hover:bg-white hover:border-blue-300 hover:shadow-xs'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{SENSOR_CATEGORIES.find((c) => c.id === node.category)?.icon || '📡'}</span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono">{node.node_id}</span>
                        <span className="text-slate-500 font-normal truncate max-w-[130px]">({node.name})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{node.location}</div>
                      <div className="text-[11px] text-slate-700 font-mono mt-1">
                        Risk Score: <b className="text-slate-900">{node.risk_score}/100</b> · {node.connectivity}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={clsx(
                      'px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase',
                      isHigh
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    )}>
                      {node.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{node.last_update}</span>
                    <Link to={`/nodes/${node.node_id}`} className="text-[11px] text-blue-600 hover:underline font-bold">
                      Spec Details →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── 4. Inter-Agency Dispatch Audit Log (Rounded Table) ──────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Automated Inter-Agency Dispatch Audit Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">Autonomous VoIP calls, SMS dispatches, and CAD webhooks routed by GSDMA Rules Engine</p>
          </div>
          <Link to="/settings" className="text-xs font-bold text-blue-600 hover:underline underline-offset-2 self-start sm:self-auto">Configure Rules →</Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50/90 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200/90">
              <tr>
                <th className="p-3.5">Designated Agency</th>
                <th className="p-3.5">Protocol Channel</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Response Target</th>
                <th className="p-3.5">Duty Officer</th>
                <th className="p-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches.map((d, i) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{d.agency}</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-600">{d.channel}</td>
                  <td className="p-3.5">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px]">
                      ✓ {d.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-blue-600 font-bold">{d.sla_min} min SLA</td>
                  <td className="p-3.5 text-slate-600">{d.officer || 'Duty Officer'}</td>
                  <td className="p-3.5 text-right font-mono text-slate-400">{d.notified_at || 'Just now'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

