// pages/SettingsPage.jsx — System Settings, Threshold Sensitivity, Dispatch Rules & Audit Log
import { useState } from 'react'
import { useStore, useAuthStore, SENSOR_CATEGORIES } from '../store/useStore'
import clsx from 'clsx'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const auditLog = useStore((s) => s.auditLog)
  const hardwareMode = useStore((s) => s.hardwareMode)
  const setHardwareMode = useStore((s) => s.setHardwareMode)
  const addAuditLog = useStore((s) => s.addAuditLog)

  const [activeTab, setActiveTab] = useState('thresholds') // 'profile' | 'thresholds' | 'rules' | 'integrations' | 'hardware' | 'audit'

  // Thresholds state
  const [thresholds, setThresholds] = useState({
    flood: { name: 'Flood & Hydrology', warn: 0.8, crit: 1.4, unit: 'm' },
    fire: { name: 'Thermal & Fire', warn: 42, crit: 50, unit: '°C' },
    air: { name: 'Air Quality (AQI)', warn: 100, crit: 160, unit: 'AQI' },
    chem: { name: 'Toxic Gas (VOC)', warn: 35, crit: 60, unit: 'ppm' },
    seismic: { name: 'Seismic Acceleration', warn: 0.15, crit: 0.35, unit: 'g' },
  })

  const [savedSuccess, setSavedSuccess] = useState(false)

  // Dispatch rules matrix state
  const [dispatchRules, setDispatchRules] = useState([
    { hazard: 'Flood', severity: 'Warning', agencies: 'GSDMA, Municipal, Police', channel: 'SMS + VoIP', sla: '5 min' },
    { hazard: 'Flood', severity: 'Emergency', agencies: 'GSDMA, Municipal, Police, Fire, EMS (108)', channel: 'CAD Direct Call', sla: '2 min' },
    { hazard: 'Fire', severity: 'Warning', agencies: 'Fire Dept (101), Forest Dept', channel: 'SMS + Webhook', sla: '5 min' },
    { hazard: 'Fire', severity: 'Emergency', agencies: 'Fire Dept (101), Police, Hospitals, GSDMA', channel: 'Direct CAD Call', sla: '2 min' },
    { hazard: 'Chemical/Gas', severity: 'Warning+', agencies: 'Fire (HAZMAT), Hospitals, Police, GSDMA', channel: 'Direct Siren & Call', sla: '2 min' },
    { hazard: 'Air Quality', severity: 'Warning', agencies: 'Municipal Health Cell, GPCB', channel: 'Daily Summary SMS', sla: '30 min' },
  ])

  const handleSaveThresholds = () => {
    setSavedSuccess(true)
    addAuditLog('Thresholds Modified', user?.name || 'Admin', 'Updated environmental warning/emergency cutoffs')
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EEF2F6] text-[#0F172A] flex items-center justify-center text-2xl font-bold">
            ⚙️
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Settings & <span className="text-[#0B6E4F]">Organization Administration</span>
            </h1>
            <p className="text-xs text-[#475569] font-mono">
              GSDMA Security Credentials, Edge Sensitivity, & Automated Rules Engine
            </p>
          </div>
        </div>

        <div className="text-xs font-mono bg-[#F7F9FB] border border-[#CBD5E1] px-3 py-1.5 rounded-xl text-[#475569]">
          Platform Mode: <b className="text-[#0B6E4F] uppercase">{hardwareMode}</b>
        </div>
      </div>

      {/* ─── Settings Layout (Left Nav + Right Content) ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Tab List */}
        <div className="bg-white border border-[#E3E8EF] rounded-2xl p-3 shadow-xs space-y-1 h-fit">
          {[
            { id: 'thresholds', label: 'Thresholds & Sensitivity', icon: '🎚️' },
            { id: 'rules', label: 'Dispatch Rules Engine', icon: '📋' },
            { id: 'hardware', label: 'Hardware Mode (Qualcomm)', icon: '🔌' },
            { id: 'integrations', label: 'Agency API Integrations', icon: '🔗' },
            { id: 'profile', label: 'Officer Profile & Role', icon: '👤' },
            { id: 'audit', label: 'Platform Audit Log', icon: '📜' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors',
                activeTab === tab.id
                  ? 'bg-[#E8F5E9] text-[#0B6E4F] font-bold shadow-xs'
                  : 'text-[#475569] hover:bg-[#F7F9FB] hover:text-[#0F172A]'
              )}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3 space-y-6">
          {/* Tab 1: Thresholds & Sensitivity */}
          {activeTab === 'thresholds' && (
            <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E3E8EF] pb-3">
                <h3 className="font-bold text-base text-[#0F172A]">Environmental Hazard Thresholds</h3>
                <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                  Base cutoffs for triggering GSDMA Watch and Emergency states. <i>Note:</i> The Qualcomm Edge-AI models continuously evaluate rolling rate-of-change ($\Delta W$) and multi-channel correlation around these thresholds rather than firing blindly on raw crossing.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                {Object.entries(thresholds).map(([key, t]) => (
                  <div key={key} className="bg-[#F7F9FB] border border-[#CBD5E1] p-3.5 rounded-xl space-y-2">
                    <div className="font-bold text-[#0F172A] flex items-center justify-between">
                      <span>{t.name}</span>
                      <span className="text-[10px] font-mono text-[#475569]">Unit: {t.unit}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[#475569] block mb-1 font-mono">Watch Level ({t.unit})</label>
                        <input
                          type="number"
                          step="0.1"
                          value={t.warn}
                          onChange={(e) =>
                            setThresholds({
                              ...thresholds,
                              [key]: { ...thresholds[key], warn: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[#475569] block mb-1 font-mono">Emergency Level ({t.unit})</label>
                        <input
                          type="number"
                          step="0.1"
                          value={t.crit}
                          onChange={(e) =>
                            setThresholds({
                              ...thresholds,
                              [key]: { ...thresholds[key], crit: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveThresholds}
                  className="bg-[#0B6E4F] hover:bg-[#08573F] text-white font-bold px-5 py-2.5 rounded-xl text-xs font-mono transition-colors shadow-xs"
                >
                  {savedSuccess ? '✓ Protocols Updated & Audited' : 'Save Sensitivity Protocols'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Dispatch Rules */}
          {activeTab === 'rules' && (
            <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E3E8EF] pb-3">
                <h3 className="font-bold text-base text-[#0F172A]">Automated Dispatch Rules Matrix</h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  Maps Incident Category × Severity Tier $\to$ Designated Inter-Agency Contacts and Response SLA.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F9FB] text-[#475569] font-mono uppercase text-[10px] border-b border-[#E3E8EF]">
                    <tr>
                      <th className="p-3">Hazard</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Agencies Notified</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E8EF] font-sans">
                    {dispatchRules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F9FB]">
                        <td className="p-3 font-bold text-[#0F172A]">{rule.hazard}</td>
                        <td className="p-3 font-mono font-bold text-[#C62828]">{rule.severity}</td>
                        <td className="p-3 text-[#475569]">{rule.agencies}</td>
                        <td className="p-3 font-mono text-[11px] text-[#0F172A]">{rule.channel}</td>
                        <td className="p-3 font-mono font-bold text-[#0B6E4F]">{rule.sla}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Hardware Mode */}
          {activeTab === 'hardware' && (
            <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E3E8EF] pb-3">
                <h3 className="font-bold text-base text-[#0F172A]">Hardware Mode & Edge Runtime</h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  Toggle between virtual simulated node fleet and live Qualcomm Dragonwing / RB-class hardware ingestion endpoint.
                </p>
              </div>

              <div className="bg-[#F7F9FB] border border-[#CBD5E1] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#0F172A]">Active Ingestion Source</div>
                    <div className="text-xs text-[#475569]">
                      Current: <b className="text-[#0B6E4F] uppercase font-mono">{hardwareMode}</b>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const next = hardwareMode === 'simulated' ? 'live' : 'simulated'
                      setHardwareMode(next)
                      addAuditLog('Hardware Mode Changed', user?.name || 'Admin', `Switched mode to ${next}`)
                    }}
                    className="bg-[#0B6E4F] hover:bg-[#08573F] text-white text-xs font-mono font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    Switch to {hardwareMode === 'simulated' ? 'Live Qualcomm QNN' : 'Simulated Fleet'}
                  </button>
                </div>

                <div className="pt-2 text-xs text-[#475569] space-y-1 font-mono">
                  <div>• QNN Runtime Endpoint: <code>http://192.168.1.100:8000/qnn/telemetry</code></div>
                  <div>• LoRa Mesh Gateway: <code>SX1262 SPI /dev/spidev0.0 @ 868.1 MHz</code></div>
                  <div>• Edge Classification Model: <code>tflite_edge_hazard_v2.tflite (1.8 MB)</code></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Integrations */}
          {activeTab === 'integrations' && (
            <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E3E8EF] pb-3">
                <h3 className="font-bold text-base text-[#0F172A]">Agency API Integrations</h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  Live keys for GSDMA State Emergency Operation Center, Twilio SMS, and IMD Weather.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[#475569] font-mono block mb-1 font-bold">GSDMA Emergency API Gateway Key</label>
                  <input
                    type="password"
                    readOnly
                    value="gsdma_live_sec_9934812a0f8b89412e"
                    className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 font-mono text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="text-[#475569] font-mono block mb-1 font-bold">State Police & Fire CAD Webhook URL</label>
                  <input
                    type="text"
                    readOnly
                    value="https://cad.gujarat.gov.in/api/v1/dispatch/emergency"
                    className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 font-mono text-[#0F172A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E3E8EF] pb-3">
                <h3 className="font-bold text-base text-[#0F172A]">Officer Credentials & Role</h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  Server-enforced role-based access control (RBAC).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#F7F9FB] border border-[#CBD5E1] p-3 rounded-xl">
                  <div className="text-[#475569] text-[10px] font-mono">Assigned Name</div>
                  <div className="font-bold text-[#0F172A] text-sm mt-0.5">{user?.name}</div>
                </div>
                <div className="bg-[#F7F9FB] border border-[#CBD5E1] p-3 rounded-xl">
                  <div className="text-[#475569] text-[10px] font-mono">Official Agency</div>
                  <div className="font-bold text-[#0F172A] text-sm mt-0.5">{user?.agency}</div>
                </div>
                <div className="bg-[#F7F9FB] border border-[#CBD5E1] p-3 rounded-xl">
                  <div className="text-[#475569] text-[10px] font-mono">RBAC Role</div>
                  <div className="font-bold text-[#0B6E4F] text-sm mt-0.5">{user?.role}</div>
                </div>
                <div className="bg-[#F7F9FB] border border-[#CBD5E1] p-3 rounded-xl">
                  <div className="text-[#475569] text-[10px] font-mono">Official Email</div>
                  <div className="font-bold text-[#0F172A] text-sm mt-0.5 font-mono">{user?.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Audit Log */}
          {activeTab === 'audit' && (
            <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E3E8EF] pb-3">
                <h3 className="font-bold text-base text-[#0F172A]">Platform Audit Log (Immutable)</h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  Verifiable audit trail recording every acknowledge, escalate, advisory publish, and setting change.
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLog.map((log) => (
                  <div key={log.id} className="bg-[#F7F9FB] border border-[#E3E8EF] p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                        {log.action}
                      </span>
                      <span className="text-[#475569]">{log.time}</span>
                    </div>
                    <p className="text-[#0F172A] mt-1">{log.details}</p>
                    <div className="text-[10px] text-[#0B6E4F] font-mono font-semibold">User: {log.user}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
