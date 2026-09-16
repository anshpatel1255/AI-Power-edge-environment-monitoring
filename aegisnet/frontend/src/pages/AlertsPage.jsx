// pages/AlertsPage.jsx — Immediate Warnings with Clean Cards & Pull-Down Dispatch Details

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

export default function AlertsPage() {
  const navigate = useNavigate()
  const alerts = useStore((s) => s.alerts)
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert)
  const [filterSeverity, setFilterSeverity] = useState('All')
  const [expandedAlertIds, setExpandedAlertIds] = useState({})

  const toggleExpand = (id) => {
    setExpandedAlertIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const unackCount = alerts.filter((a) => !a.acknowledged).length

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'All') return true
    if (filterSeverity === 'Critical') return a.severity === 'critical' || a.risk_score >= 70
    if (filterSeverity === 'Warning') return a.severity === 'warning' || (a.risk_score >= 40 && a.risk_score < 70)
    if (filterSeverity === 'Unacknowledged') return !a.acknowledged
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 bg-[#141A16] text-[#EDEDE9] space-y-4 font-mono">
      {/* ─── Top Header Strip ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1F2921] border border-[#2D3B2F] px-5 py-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🚨</span>
          <div>
            <h1 className="text-xl font-bold text-[#EDEDE9]">
              Immediate Warnings & <span className="text-[#D97706]">Alerts</span>
            </h1>
            <p className="text-[11px] text-[#6B7280]">
              Pending Emergency Escalations & Gujarat Authority Dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#141A16] border border-[#2D3B2F] px-3 py-1.5 rounded-xl text-xs">
          <span className="text-[#6B7280]">Pending Acknowledgment:</span>
          <span className={clsx('font-bold', unackCount > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]')}>
            {unackCount}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        {['All', 'Unacknowledged', 'Critical', 'Warning'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterSeverity(f)}
            className={clsx(
              'px-3 py-1 rounded-lg transition-colors border',
              filterSeverity === f
                ? 'bg-[#14532D] text-[#D97706] border-[#D97706]/40 font-bold'
                : 'bg-[#1F2921] text-[#6B7280] border-[#2D3B2F] hover:text-[#EDEDE9]'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ─── Streamlined Alert Cards with Pull-Down Details ───────────────── */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-10 text-center text-[#6B7280]">
            <span className="text-3xl block mb-1 text-[#22C55E]">✓</span>
            <div className="text-sm font-bold text-[#EDEDE9]">No Active Warnings in Category</div>
            <p className="text-xs mt-0.5">All monitored sensors within safe thresholds</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical' || alert.risk_score >= 70
            const isExpanded = !!expandedAlertIds[alert.id]

            const cardBorder = isCritical
              ? 'border border-[#EF4444]/60 bg-[#1F2921]'
              : 'border border-[#F59E0B]/60 bg-[#1F2921]'

            const severityBadge = isCritical
              ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]'
              : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]'

            return (
              <div
                key={alert.id}
                className={clsx('rounded-2xl p-4 shadow-md transition-all', cardBorder)}
              >
                {/* Primary Row: Clean & Uncluttered */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{isCritical ? '🔴' : '🟠'}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded uppercase', severityBadge)}>
                          {isCritical ? 'CRITICAL' : 'WARNING'}
                        </span>
                        <h3 className="font-bold text-sm text-[#EDEDE9]">{alert.title}</h3>
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">
                        Sensor: <b className="text-[#EDEDE9]">{alert.sensor_id || alert.node_id}</b> • Location: <b className="text-[#EDEDE9]">{alert.location}</b> • Time: <b className="text-[#D97706]">{alert.time}</b>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Pull-Down Toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate('/map')}
                      className="text-xs bg-[#0B3820] hover:bg-[#14532D] text-[#D97706] font-bold px-3 py-1.5 rounded-lg border border-[#D97706]/40 transition-colors"
                    >
                      View on Map
                    </button>

                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs bg-[#14532D] hover:bg-[#0B3820] text-[#22C55E] font-bold px-3 py-1.5 rounded-lg border border-[#22C55E]/40 transition-colors"
                      >
                        ✓ Acknowledge
                      </button>
                    ) : (
                      <span className="text-xs text-[#22C55E] font-bold bg-[#22C55E]/10 px-2 py-1 rounded border border-[#22C55E]/30">
                        ✓ Logged
                      </span>
                    )}

                    {/* Pull-Down Button */}
                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className="text-xs text-[#D97706] hover:text-white px-2.5 py-1 rounded hover:bg-[#141A16] transition-colors flex items-center gap-1.5"
                    >
                      <span>{isExpanded ? 'Less' : 'Pull Down Dispatch Details'}</span>
                      <span className={clsx('pulldown-chevron text-[9px]', isExpanded && 'open')}>▼</span>
                    </button>
                  </div>
                </div>

                {/* Pull-Down Drawer for Multi-Agency Call & Email Records with Smooth Animation */}
                <div className={clsx('pulldown-wrapper', isExpanded && 'open')}>
                  <div className="pulldown-content">
                    <div className="mt-3 pt-3 border-t border-[#2D3B2F] space-y-2 animate-pulldown text-xs">
                      <div className="bg-[#141A16] p-2.5 rounded-xl border border-[#2D3B2F] text-slate-300 font-sans">
                        {alert.message}
                      </div>

                      <div className="bg-[#141A16] p-2.5 rounded-xl border border-[#2D3B2F] space-y-1 text-[11px]">
                        <div className="text-[#D97706] font-bold">🚨 Emergency Dispatch Protocols Executed:</div>
                        <div className="text-[#60A5FA]">✓ {alert.callCops || 'Police Control Room 100/112 Alerted'}</div>
                        <div className="text-[#F97316]">✓ {alert.callFire || 'Fire Station 101 Alerted'}</div>
                        <div className="text-[#EF4444]">✓ {alert.callAmbulance || '108 Ambulance Unit Dispatched'}</div>
                        <div className="text-[#22C55E]">✓ {alert.mailRecipient || 'GSDMA Govt Mail Dispatched'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
