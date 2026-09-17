// pages/Dashboard.jsx — Premium Command Center Dashboard with Rich Visual Hierarchy
import { Link, useNavigate } from 'react-router-dom'
import { useStore, SENSOR_CATEGORIES } from '../store/useStore'
import RiskMap from '../components/map/RiskMap'
import clsx from 'clsx'

export default function Dashboard() {
  const navigate       = useNavigate()
  const nodes          = useStore((s) => s.nodes)
  const alerts         = useStore((s) => s.alerts)
  const dispatches     = useStore((s) => s.dispatches)
  const selectedRegion = useStore((s) => s.selectedRegion)

  const onlineCount     = nodes.filter((n) => n.status === 'online').length
  const totalCount      = nodes.length
  const activeAlerts    = alerts.filter((a) => !a.acknowledged)
  const emergencyAlerts = alerts.filter((a) => a.severity === 'emergency' || a.severity === 'warning')

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-5 font-sans animate-slide-up">

      {/* ─── 1. Hero Metric Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Alert count card */}
        <div className={clsx(
          'rounded-2xl p-5 flex flex-col justify-between transition-all card-shadow-md',
          activeAlerts.length > 0
            ? 'bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-400'
            : 'bg-white border border-slate-200'
        )}>
          <div className="flex items-center justify-between">
            <span className={clsx(
              'text-[10px] font-bold tracking-widest uppercase',
              activeAlerts.length > 0 ? 'text-red-700' : 'text-slate-500'
            )}>Actionable Alerts</span>
            {activeAlerts.length > 0 ? (
              <span className="bg-red-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">REQUIRES TRIAGE</span>
            ) : (
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">ALL CLEAR</span>
            )}
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div className={clsx('text-5xl font-mono font-bold leading-none', activeAlerts.length > 0 ? 'text-red-600' : 'text-slate-900')}>
              {activeAlerts.length}
            </div>
            <Link to="/alerts" className={clsx('text-xs font-bold hover:underline underline-offset-2', activeAlerts.length > 0 ? 'text-red-700' : 'text-emerald-700')}>
              Review Queue →
            </Link>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden flex">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${(alerts.filter((a) => a.severity === 'emergency').length / (alerts.length || 1)) * 100}%` }} />
              <div className="bg-amber-400 h-full" style={{ width: `${(alerts.filter((a) => a.severity === 'warning').length / (alerts.length || 1)) * 100}%` }} />
              <div className="bg-emerald-500 h-full" style={{ width: `${(alerts.filter((a) => a.severity === 'watch').length / (alerts.length || 1)) * 100}%` }} />
            </div>
            <div className="text-[10px] text-slate-600 font-medium">
              {alerts.filter((a) => a.severity === 'emergency').length} Emergency · {alerts.filter((a) => a.severity === 'warning').length} Warning
            </div>
          </div>
        </div>

        {/* Fleet online card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 card-shadow flex flex-col justify-between hover:card-shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sentinel Fleet Online</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div className="text-5xl font-mono font-bold text-slate-900">{onlineCount}</div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {((onlineCount / totalCount) * 100).toFixed(0)}% mesh active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
            <span>LoRa 868MHz Mesh + WiFi</span>
            <Link to="/fleet" className="text-emerald-700 hover:underline font-bold">Fleet View →</Link>
          </div>
        </div>

        {/* Latency card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Edge Action Latency</span>
            <span>⚡</span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div className="text-4xl font-mono font-bold text-emerald-700">&lt;3.8s</div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full">Siren &lt;1s</span>
          </div>
          <div className="text-[11px] text-emerald-800/70 font-medium">
            Autonomous local relay without cloud WAN delay
          </div>
        </div>

        {/* Grid focus card */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 rounded-2xl p-5 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Regional Grid Focus</span>
            <span>🗺️</span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div className="text-3xl font-bold text-white capitalize">
              {selectedRegion === 'all' ? '4 Metros' : selectedRegion}
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">37 Landmarked</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Gandhinagar, Ahmedabad, Surat, Vadodara</div>
        </div>
      </div>

      {/* ─── 2. Sensor Category Health Grid ─────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sensor Fleet Telemetry by Hazard Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time multi-channel sensor bays with on-device rate-of-change inference</p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            ● Continuous 10s Sampling
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SENSOR_CATEGORIES.map((cat) => {
            const catNodes  = nodes.filter((n) => n.category === cat.id)
            const alertNodes = catNodes.filter((n) => n.risk_score >= 50)
            const hasAlert   = alertNodes.length > 0

            return (
              <div
                key={cat.id}
                className={clsx(
                  'rounded-2xl p-4 space-y-2.5 transition-all',
                  hasAlert
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-400 card-shadow-md'
                    : 'bg-slate-50 border border-slate-200 hover:bg-white card-shadow'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-base',
                    hasAlert ? 'bg-amber-200' : 'bg-white shadow-sm'
                  )}>
                    {cat.icon}
                  </div>
                  <span className={clsx(
                    'text-[9px] font-mono font-bold px-2 py-0.5 rounded-full',
                    hasAlert ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                  )}>
                    {hasAlert ? `${alertNodes.length} WARNING` : 'NORMAL'}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{catNodes.length} Nodes Online</div>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{cat.metrics.join(' · ')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 3. Two-Column: Active Emergencies + Event Stream ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: Emergencies + Mini Map */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-2 border-red-300 rounded-2xl p-5 card-shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center">🚨</div>
                <h3 className="font-bold text-sm text-red-700 uppercase tracking-wide">Active Hazard Incidents</h3>
              </div>
              <Link to="/console" className="text-xs font-bold text-emerald-700 hover:underline underline-offset-2">Open Console →</Link>
            </div>

            {emergencyAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl mx-auto mb-2">✓</div>
                All regional parameters within safe limits. Zero active emergency escalations.
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 space-y-2 card-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-red-700 uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                        {alert.severity}: {alert.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{alert.timestamp}</span>
                    </div>
                    <div className="font-bold text-xs text-slate-900">{alert.title}</div>
                    <div className="text-[11px] text-slate-600 truncate">{alert.location}</div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500">
                        Confidence: <b className="text-emerald-700">{alert.confidence_pct}%</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/console')}
                        className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-colors"
                      >
                        Action in Console →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 card-shadow space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Regional Sentinel Spatial View</span>
              <Link to="/map" className="text-xs font-bold text-emerald-700 hover:underline underline-offset-2">Expand Full Map ↗</Link>
            </div>
            <div className="h-44 rounded-xl overflow-hidden border border-slate-200">
              <RiskMap nodes={nodes} height="100%" />
            </div>
          </div>
        </div>

        {/* Right: Event Stream */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 card-shadow space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center">📡</div>
              <h3 className="font-bold text-sm text-slate-900">
                Classified Event Stream <span className="text-slate-400 font-normal">(Edge-AI Telemetry)</span>
              </h3>
            </div>
            <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
              ● Live WebSocket
            </span>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {nodes.slice(0, 8).map((node) => {
              const isHigh = node.risk_score >= 50
              return (
                <div
                  key={node.node_id}
                  className={clsx(
                    'flex items-start justify-between gap-3 p-3.5 rounded-xl border text-xs transition-all',
                    isHigh
                      ? 'bg-red-50 border-red-200 hover:bg-red-100/60'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">{SENSOR_CATEGORIES.find((c) => c.id === node.category)?.icon || '📡'}</span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono">{node.node_id}</span>
                        <span className="text-slate-500 font-normal truncate max-w-[110px]">({node.name})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{node.location}</div>
                      <div className="text-[11px] text-slate-700 font-mono mt-1">
                        Risk Score: <b className="text-slate-900">{node.risk_score}/100</b> · {node.connectivity}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase',
                      isHigh ? 'bg-red-200 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    )}>
                      {node.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{node.last_update}</span>
                    <Link to={`/nodes/${node.node_id}`} className="text-[11px] text-emerald-700 hover:underline font-bold">
                      Spec Details →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── 4. Inter-Agency Dispatch Audit Log ──────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Automated Inter-Agency Dispatch Audit Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">Autonomous VoIP calls, SMS dispatches, and CAD webhooks routed by GSDMA Rules Engine</p>
          </div>
          <Link to="/settings" className="text-xs font-bold text-emerald-700 hover:underline underline-offset-2">Configure Rules →</Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Designated Agency</th>
                <th className="p-3">Protocol Channel</th>
                <th className="p-3">Status</th>
                <th className="p-3">Response Target</th>
                <th className="p-3">Duty Officer</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{d.agency}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{d.channel}</td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px]">
                      ✓ {d.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-emerald-700 font-bold">{d.sla_min} min SLA</td>
                  <td className="p-3 text-slate-600">{d.officer || 'Duty Officer'}</td>
                  <td className="p-3 text-right font-mono text-slate-400">{d.notified_at || 'Just now'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
