// components/overlays/ScenarioDrawer.jsx — Global Slide-Out Scenario Simulation Controller
import { useStore } from '../../store/useStore'
import clsx from 'clsx'

export default function ScenarioDrawer({ isOpen, onClose }) {
  const activeScenario = useStore((s) => s.activeScenario)
  const triggerScenario = useStore((s) => s.triggerScenario)
  const hardwareMode = useStore((s) => s.hardwareMode)
  const setHardwareMode = useStore((s) => s.setHardwareMode)

  if (!isOpen) return null

  const SCENARIOS = [
    {
      id: 'flood',
      title: '🌊 Flash Flood: Sabarmati Upstream Surge',
      hero: true,
      badge: 'HERO DEMO',
      desc: 'Simulates high-velocity water ingress across 3 upstream nodes (Sant Sarovar Dam). Sub-5s local siren trips on-device. Downstream nodes receive early correlated warnings 42 min before threshold crest.',
      tags: ['Multi-Hop Correlated', 'Offline-First Siren', 'Upstream Early Warning'],
    },
    {
      id: 'fire',
      title: '🔥 Forest Fire Outbreak: Indroda Reserve',
      desc: 'Simulates rapid thermal spike (>55°C) and optical IR flame detection in dry scrubland. Calculates real-time wind drift cone and auto-notifies Fire Dept (101).',
      tags: ['Thermal IR Array', 'Wind Plume Cone', 'Auto CAD Dispatch'],
    },
    {
      id: 'gas',
      title: '☣️ Industrial Gas Leak: Narol-Vatva GIDC',
      desc: 'Simulates toxic chemical VOC surge (145 ppm) across industrial cluster. Triggers HAZMAT multi-agency protocol and drafts bilingual public evacuation advisory.',
      tags: ['HAZMAT Protocol', 'PID Sensor Fusion', 'Public Advisory'],
    },
    {
      id: 'false_positive',
      title: '🛡️ False Positive Edge Suppression Drill',
      badge: 'PROVES AI',
      desc: 'Injects transient smoke spike on a single node without multi-sensor or neighbor corroboration. Demonstrates the Qualcomm Edge-AI model suppressing the false alarm dispatch.',
      tags: ['Edge Classification', 'Zero Alert Fatigue', 'Audit Logged'],
    },
    {
      id: 'lora_drill',
      title: '📡 Network Degradation & LoRa Mesh Drill',
      desc: 'Simulates complete WAN/Cellular blackout. Nodes fallback seamlessly to peer-to-peer LoRa mesh (868 MHz); local sirens fire autonomously in <5s.',
      tags: ['WAN Blackout', 'SX1262 LoRa Mesh', 'Zero Cloud Lag'],
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-l border-slate-300 w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧪</span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Scenario Simulator Engine</h2>
              <p className="text-[11px] text-slate-500 font-medium">Controllable Live Demonstration for Evaluators</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Hardware Mode Indicator */}
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs">
          <span className="text-emerald-800 font-bold flex items-center gap-1.5">
            <span>⚙️ Hardware Mode:</span>
            <span className="font-mono uppercase">{hardwareMode}</span>
          </span>
          <button
            type="button"
            onClick={() => setHardwareMode(hardwareMode === 'simulated' ? 'live' : 'simulated')}
            className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
          >
            Switch to {hardwareMode === 'simulated' ? 'Live Qualcomm QNN' : 'Simulated'}
          </button>
        </div>

        {/* Scenario List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
            Select Preset Disaster Scenario
          </div>

          {SCENARIOS.map((sc) => {
            const isSelected = activeScenario === sc.id

            return (
              <div
                key={sc.id}
                className={clsx(
                  'rounded-xl border p-3.5 transition-all text-left space-y-2',
                  isSelected
                    ? 'border-[#0B6E4F] bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-xs text-slate-900">{sc.title}</div>
                  {sc.badge && (
                    <span className="bg-[#0B6E4F] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                      {sc.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">{sc.desc}</p>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {sc.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => triggerScenario(sc.id)}
                    className={clsx(
                      'px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm',
                      isSelected
                        ? 'bg-[#0B6E4F] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                    )}
                  >
                    {isSelected ? '✓ Running Injection' : 'Inject Scenario →'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
          {activeScenario && (
            <div className="text-xs text-[#0B6E4F] font-bold flex items-center justify-between">
              <span>Active: {activeScenario.toUpperCase()}</span>
              <span className="font-mono text-amber-600 font-bold">● Injected</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => triggerScenario('reset')}
              className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-slate-300 hover:border-red-300 font-bold py-2 rounded text-xs transition-colors shadow-sm"
            >
              🔄 Reset Safe Baseline
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
