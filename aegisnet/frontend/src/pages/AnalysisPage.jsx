// pages/AnalysisPage.jsx — AI Edge-Correlation Pipeline & Explainability Engine
import { useState } from 'react'
import { useStore } from '../store/useStore'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const FORECAST_DATA = [
  { hour: 'Now', actual: 48, forecastUpper: 48, forecastLower: 48 },
  { hour: '+30m', actual: null, forecastUpper: 54, forecastLower: 50 },
  { hour: '+1h',  actual: null, forecastUpper: 62, forecastLower: 55 },
  { hour: '+1.5h',actual: null, forecastUpper: 72, forecastLower: 62 },
  { hour: '+2h',  actual: null, forecastUpper: 84, forecastLower: 70 },
]

export default function AnalysisPage() {
  const suppressionLog = useStore((s) => s.suppressionLog)
  const activeScenario = useStore((s) => s.activeScenario)

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">
      {/* ─── Header Strip ─────────────────────────────────────────────── */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EEF2F6] text-[#6B4FA0] flex items-center justify-center text-2xl font-bold">
            🧠
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              AI Environmental <span className="text-[#0B6E4F]">Analysis & Explainability</span>
            </h1>
            <p className="text-xs text-[#475569] font-mono">
              Qualcomm Edge-AI Sensor Fusion, Cross-Node Spatial Reinforcement, & False-Alarm Suppression
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-[#F7F9FB] border border-[#CBD5E1] px-3 py-1.5 rounded-xl">
            <span className="text-[#475569]">Model Engine:</span>{' '}
            <b className="text-[#0B6E4F]">QNN TFLite v2.4</b>
          </div>
          <div className="bg-[#F7F9FB] border border-[#CBD5E1] px-3 py-1.5 rounded-xl">
            <span className="text-[#475569]">Statistical Confidence:</span>{' '}
            <b className="text-[#0B6E4F]">89.4% (R²)</b>
          </div>
        </div>
      </div>

      {/* ─── 1. Model Confidence Explainer (Feature Weights) ───────────── */}
      <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E8EF] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase font-mono tracking-wide">
              Feature Weight Deconstruction (Why Did the Alert Fire?)
            </h2>
            <p className="text-xs text-[#475569]">
              Multi-channel on-device inference breakdown for Active Incident ALT-101
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#0B6E4F] bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
            Fused Score: 0.89 Fused Risk
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { feature: 'Instantaneous Water Rate of Change (ΔW/dt)', weight: '+0.34', pct: 85, color: '#0B84C9', desc: 'Rising +22 cm/min acceleration detected across 8-sample rolling FIFO window.' },
            { feature: 'Upstream Sensor Correlation (NODE-01 to NODE-02)', weight: '+0.28', pct: 72, color: '#0B6E4F', desc: 'Spatial distance decay confirmed neighbor surge 6.4 km upstream.' },
            { feature: 'Rain Gauge Precipitation Ingress', weight: '+0.18', pct: 45, color: '#0B84C9', desc: 'Tipping bucket recorded continuous 38 mm/hr catchment rainfall.' },
            { feature: 'Optical Smoke / Flare Inversion', weight: '+0.09', pct: 25, color: '#E0621A', desc: 'Background baseline normal; negligible contribution.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#F7F9FB] border border-[#CBD5E1] p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#0F172A]">{item.feature}</span>
                <span className="font-mono font-bold text-[#0F172A]">{item.weight} Contribution</span>
              </div>
              <div className="w-full bg-[#E3E8EF] h-2 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
              </div>
              <div className="text-[11px] text-[#475569]">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 2. Cross-Node Correlation Graph & Short-Term Forecast ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Node-Link Spatial Correlation Visual */}
        <div className="lg:col-span-6 bg-white border border-[#E3E8EF] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="border-b border-[#E3E8EF] pb-3">
            <h3 className="font-bold text-sm text-[#0F172A] font-mono uppercase">
              Cross-Node Spatial Reinforcement
            </h3>
            <p className="text-xs text-[#475569]">
              How upstream telemetry reinforces downstream alerts before local crest
            </p>
          </div>

          <div className="bg-[#F7F9FB] border border-[#CBD5E1] rounded-xl p-4 text-xs font-mono space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B84C9]">NODE-01 (Upstream Dam)</span>
              <span className="text-[#2E7D32] font-bold">Surge Detected (T = 0)</span>
            </div>
            <div className="text-center text-[#94A3B8] font-bold">
              ↓ Spatial Propagation: 4.8 km distance decay (22 min fluid transit lag) ↓
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B6E4F]">NODE-02 (Canal Siphon)</span>
              <span className="text-[#E0621A] font-bold">Reinforced Early Warning (+42 min lead)</span>
            </div>
            <div className="text-center text-[#94A3B8] font-bold">
              ↓ Multi-Hop LoRa Mesh Relay (Zero Cloud WAN Dependency) ↓
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#C62828]">NODE-06 (Vasna Barrage Downstream)</span>
              <span className="text-[#C62828] font-bold">Gates Prepared Before Surge Arrival</span>
            </div>
          </div>
        </div>

        {/* Short-Term Projected Trajectory */}
        <div className="lg:col-span-6 bg-white border border-[#E3E8EF] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="border-b border-[#E3E8EF] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] font-mono uppercase">
                2-Hour Ahead Predictive Trajectory
              </h3>
              <p className="text-xs text-[#475569]">
                Forward-looking projected depth with statistical uncertainty bands
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#0B84C9] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded">
              Confidence: ±4 cm
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={FORECAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} fontStyle="italic" />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[40, 90]} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E8EF', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="forecastUpper" stroke="#C62828" strokeWidth={2} strokeDasharray="4 4" name="Projected Upper Crest (cm)" />
                <Line type="monotone" dataKey="forecastLower" stroke="#0B84C9" strokeWidth={2} name="Conservative Trajectory (cm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── 3. False-Positive Edge Model Suppression Log ───────────────── */}
      <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E8EF] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A] uppercase font-mono flex items-center gap-2">
              <span>🛡️</span> False-Positive Suppression Log (Proves AI Over Fixed Thresholds)
            </h3>
            <p className="text-xs text-[#475569]">
              Transient sensor anomalies classified as non-emergencies by the on-device model, preventing alert fatigue
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
            Zero False Dispatches
          </span>
        </div>

        <div className="space-y-3">
          {suppressionLog.map((sup) => (
            <div
              key={sup.id}
              className="bg-[#F7F9FB] border border-[#CBD5E1] rounded-xl p-4 text-xs space-y-1.5 transition-all hover:bg-white"
            >
              <div className="flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F172A]">{sup.node_id}</span>
                  <span className="text-[#475569]">({sup.sensor})</span>
                  <span className="bg-[#FFFBEB] text-[#B58900] px-2 py-0.2 rounded font-bold">
                    Spike: {sup.spike_val}
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8]">{sup.time}</span>
              </div>

              <p className="text-[#0F172A] leading-relaxed">{sup.reason}</p>

              <div className="text-[11px] text-[#2E7D32] font-mono font-semibold flex items-center gap-1.5">
                <span>✓ Decision:</span>
                <span>{sup.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
