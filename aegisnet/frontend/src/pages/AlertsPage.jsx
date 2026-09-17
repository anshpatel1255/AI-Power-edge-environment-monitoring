// pages/AlertsPage.jsx — Immediate Warnings, GSDMA Triage Queue & Audit Acknowledgment
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, SENSOR_CATEGORIES } from '../store/useStore'
import clsx from 'clsx'

const SEVERITY_TABS = ['All', 'Emergency', 'Warning', 'Watch', 'Advisory', 'Resolved']

export default function AlertsPage() {
  const navigate = useNavigate()
  const alerts = useStore((s) => s.alerts)
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert)
  const [activeTab, setActiveTab] = useState('All')
  const [selectedAlertForAck, setSelectedAlertForAck] = useState(null)
  const [officerName, setOfficerName] = useState('Officer K. Patel (GSDMA)')

  // Filter alerts by tab
  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === 'All') return true
    if (activeTab === 'Resolved') return a.acknowledged
    return a.severity.toLowerCase() === activeTab.toLowerCase()
  })

  const unackCount = alerts.filter((a) => !a.acknowledged).length

  const handleConfirmAck = () => {
    if (!selectedAlertForAck) return
    acknowledgeAlert(selectedAlertForAck.id, officerName)
    setSelectedAlertForAck(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">
      {/* ─── Header Strip ─────────────────────────────────────────────── */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center text-2xl font-bold">
            🚨
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Immediate Warnings & <span className="text-[#C62828]">Alerts Queue</span>
            </h1>
            <p className="text-xs text-[#475569] font-mono">
              Action-oriented triage queue for multi-channel hazard incidents & GSDMA escalation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#F7F9FB] border border-[#CBD5E1] px-3.5 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-[#475569]">Pending Acknowledgment:</span>{' '}
            <b className={clsx(unackCount > 0 ? 'text-[#C62828]' : 'text-[#2E7D32]')}>
              {unackCount} incidents
            </b>
          </div>
        </div>
      </div>

      {/* ─── Severity Filter Tabs ───────────────────────────────────────── */}
      <div className="bg-white border border-[#E3E8EF] rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
        {SEVERITY_TABS.map((tab) => {
          const count =
            tab === 'All'
              ? alerts.length
              : tab === 'Resolved'
              ? alerts.filter((a) => a.acknowledged).length
              : alerts.filter((a) => a.severity.toLowerCase() === tab.toLowerCase()).length

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-3.5 py-2 rounded-xl transition-colors font-medium flex items-center gap-2 whitespace-nowrap',
                activeTab === tab
                  ? 'bg-[#0B6E4F] text-white font-bold shadow-xs'
                  : 'text-[#475569] hover:bg-[#F7F9FB]'
              )}
            >
              <span>{tab}</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#EEF2F6] text-[#475569]'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ─── Alerts Incident List ───────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white border border-[#E3E8EF] rounded-2xl p-12 text-center text-xs text-[#475569] space-y-1">
            <span className="text-3xl block mb-2 text-[#2E7D32]">✓</span>
            <div className="font-bold text-[#0F172A] text-sm">No Active Incidents in Category</div>
            <p>All environmental telemetry streams operating within seasonal thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isEmergency = alert.severity === 'emergency'
            const isWarning = alert.severity === 'warning'
            const catInfo = SENSOR_CATEGORIES.find((c) => c.id === alert.category)

            return (
              <div
                key={alert.id}
                className={clsx(
                  'bg-white rounded-2xl p-5 shadow-sm transition-all border space-y-3',
                  isEmergency
                    ? 'border-l-4 border-l-[#C62828] border-t-[#CBD5E1] border-r-[#CBD5E1] border-b-[#CBD5E1]'
                    : isWarning
                    ? 'border-l-4 border-l-[#E0621A] border-t-[#E3E8EF] border-r-[#E3E8EF] border-b-[#E3E8EF]'
                    : 'border-[#E3E8EF]'
                )}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E8EF] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{catInfo?.icon || '🚨'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0F172A]">{alert.id}</span>
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase',
                            isEmergency
                              ? 'bg-[#FDECEC] text-[#C62828]'
                              : isWarning
                              ? 'bg-[#FFFBEB] text-[#E0621A]'
                              : 'bg-[#E8F5E9] text-[#2E7D32]'
                          )}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[11px] text-[#475569] font-mono">
                          Confidence: <b className="text-[#0B6E4F]">{alert.confidence_pct}%</b>
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-[#0F172A] mt-0.5">{alert.title}</h2>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono text-[#475569]">
                    <div>Detected: <b>{alert.timestamp}</b></div>
                    <div className="text-[11px] text-[#0B6E4F] font-semibold">
                      Correlated: {alert.correlated_nodes} Nodes
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#F7F9FB] border border-[#E3E8EF] p-3 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#475569] font-bold">Affected Landmark</span>
                    <div className="font-semibold text-[#0F172A]">{alert.location}</div>
                    <div className="text-[11px] text-[#0B6E4F] font-mono">{alert.landmark_tag}</div>
                  </div>

                  <div className="bg-[#F7F9FB] border border-[#E3E8EF] p-3 rounded-xl space-y-1 md:col-span-2">
                    <span className="text-[10px] font-mono uppercase text-[#475569] font-bold">Root Cause Analysis</span>
                    <p className="text-[#475569] leading-relaxed">{alert.root_cause}</p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs font-mono text-[#475569] flex items-center gap-2">
                    <span>Dispatch Status:</span>
                    <b className="text-[#0F172A] bg-[#EEF2F6] px-2 py-0.5 rounded">
                      {alert.dispatch_status || 'Delivered'}
                    </b>
                    {alert.acknowledged_by && (
                      <span className="text-[10px] text-[#2E7D32]">
                        (Verified by {alert.acknowledged_by})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => setSelectedAlertForAck(alert)}
                        className="bg-[#0B6E4F] hover:bg-[#08573F] text-white text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
                      >
                        ✓ Acknowledge Alert
                      </button>
                    ) : (
                      <span className="text-xs text-[#2E7D32] font-mono font-bold bg-[#E8F5E9] px-3 py-1.5 rounded-xl">
                        ✓ Acknowledged
                      </span>
                    )}

                    <button
                      onClick={() => navigate('/console')}
                      className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
                    >
                      Open Command Console →
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ─── Acknowledgment Audit Modal ─────────────────────────────────── */}
      {selectedAlertForAck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3E8EF] pb-3">
              <h3 className="font-bold text-base text-[#0F172A]">Incident Acknowledgment Audit</h3>
              <button onClick={() => setSelectedAlertForAck(null)} className="text-[#475569]">✕</button>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Acknowledging logs your official ID to the GSDMA immutable incident register and silences acoustic siren queues.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-[#475569] font-mono block font-bold">Duty Officer Credential</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 font-mono text-[#0F172A]"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleConfirmAck}
                className="flex-1 bg-[#0B6E4F] hover:bg-[#08573F] text-white font-bold py-2 rounded-xl text-xs font-mono shadow-xs"
              >
                Confirm Acknowledgment
              </button>
              <button
                onClick={() => setSelectedAlertForAck(null)}
                className="px-4 bg-[#F7F9FB] text-[#475569] rounded-xl text-xs font-mono border border-[#CBD5E1]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
