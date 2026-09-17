// pages/NodeDetail.jsx — Individual Node Diagnostic Console & Telemetry Inspection (Light UI)
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStore, SENSOR_CATEGORIES } from '../store/useStore'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import clsx from 'clsx'

const MOCK_NODE_HISTORY = [
  { time: '00:00', val: 42, threshold: 70 },
  { time: '04:00', val: 44, threshold: 70 },
  { time: '08:00', val: 48, threshold: 70 },
  { time: '12:00', val: 56, threshold: 70 },
  { time: '16:00', val: 64, threshold: 70 },
  { time: '20:00', val: 58, threshold: 70 },
  { time: 'Now',   val: 52, threshold: 70 },
]

export default function NodeDetail() {
  const { id } = useParams()
  const nodes = useStore((s) => s.nodes)
  const muteNode = useStore((s) => s.muteNode)
  const triggerScenario = useStore((s) => s.triggerScenario)
  const [timeRange, setTimeRange] = useState('24h')

  const node = nodes.find((n) => n.node_id === id) || nodes[0]
  const catInfo = SENSOR_CATEGORIES.find((c) => c.id === node.category)
  const isMuted = node.status === 'muted'

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">
      {/* ─── Top Breadcrumb & Actions Strip ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link to="/fleet" className="text-xs text-[#0B6E4F] hover:underline font-mono font-bold flex items-center gap-1">
          ← Back to Node Fleet
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => muteNode(node.node_id)}
            className="bg-white hover:bg-[#F7F9FB] border border-[#CBD5E1] text-[#0F172A] text-xs font-mono font-bold px-3 py-1.5 rounded-xl shadow-xs"
          >
            {isMuted ? 'Unmute Node' : 'Mute (Maintenance Mode)'}
          </button>
          <button
            onClick={() => triggerScenario('flood')}
            className="bg-[#0B6E4F] hover:bg-[#08573F] text-white text-xs font-mono font-bold px-3 py-1.5 rounded-xl shadow-xs"
          >
            Simulate Surge on Node
          </button>
        </div>
      </div>

      {/* ─── 1. Node Diagnostic Header Card ─────────────────────────────── */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#EEF2F6] text-2xl flex items-center justify-center font-bold">
              {catInfo?.icon || '📡'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#0F172A] font-mono">{node.node_id}</h1>
                <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  {node.status}
                </span>
                <span className="text-xs text-[#475569] font-mono font-semibold">
                  {node.connectivity}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#0F172A] mt-0.5">{node.name}</p>
              <p className="text-xs text-[#475569] font-mono mt-0.5">{node.location}</p>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-[#475569] space-y-1">
            <div>GPS: <b className="text-[#0F172A]">{node.latitude.toFixed(4)}°N, {node.longitude.toFixed(4)}°E</b></div>
            <div>Firmware: <b className="text-[#0F172A]">{node.firmware_version}</b></div>
            <div>Power: <b className="text-[#2E7D32]">{node.battery_pct}% (Solar 5W)</b></div>
          </div>
        </div>
      </div>

      {/* ─── 2. Live Sensor Channel Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[10px] text-[#475569] font-mono">WATER LEVEL</div>
          <div className="text-xl font-bold font-mono text-[#0B84C9] mt-1">{node.water_level_cm} cm</div>
          <div className="text-[10px] text-[#94A3B8] font-mono">Ultrasonic Depth</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[10px] text-[#475569] font-mono">AIR AQI</div>
          <div className="text-xl font-bold font-mono text-[#6B4FA0] mt-1">{node.smoke_aqi}</div>
          <div className="text-[10px] text-[#94A3B8] font-mono">Laser PM2.5</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[10px] text-[#475569] font-mono">TEMPERATURE</div>
          <div className="text-xl font-bold font-mono text-[#E0621A] mt-1">{node.temperature_c}°C</div>
          <div className="text-[10px] text-[#94A3B8] font-mono">Dallas DS18B20</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[10px] text-[#475569] font-mono">HUMIDITY</div>
          <div className="text-xl font-bold font-mono text-[#2E7D32] mt-1">{node.humidity_pct}%</div>
          <div className="text-[10px] text-[#94A3B8] font-mono">DHT22 Digital</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[10px] text-[#475569] font-mono">GAS (VOC)</div>
          <div className="text-xl font-bold font-mono text-[#B58900] mt-1">{node.gas_ppm} ppm</div>
          <div className="text-[10px] text-[#94A3B8] font-mono">MQ-135 Cell</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[10px] text-[#475569] font-mono">LOCAL SIREN</div>
          <div className="text-xl font-bold font-mono text-[#0F172A] mt-1">
            {node.local_siren ? '🚨 ON' : 'Idle'}
          </div>
          <div className="text-[10px] text-[#94A3B8] font-mono">Sub-5s Hardware</div>
        </div>
      </div>

      {/* ─── 3. Telemetry Trend Curve ───────────────────────────────────── */}
      <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E8EF] pb-3">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A] uppercase font-mono">
              Primary Sensor Telemetry & Threshold Band
            </h3>
            <p className="text-xs text-[#475569]">Sampled continuously at edge node</p>
          </div>
          <div className="flex bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-0.5 text-xs font-mono">
            {['1h', '6h', '24h', '7d'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={clsx('px-2.5 py-1 rounded transition-colors', timeRange === r ? 'bg-white font-bold text-[#0B6E4F] shadow-xs' : 'text-[#475569]')}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_NODE_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
              <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} fontStyle="italic" />
              <YAxis stroke="#94A3B8" fontSize={11} domain={[20, 90]} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E8EF', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="val" stroke="#0B84C9" strokeWidth={2.5} name="Recorded Reading" />
              <Line type="monotone" dataKey="threshold" stroke="#C62828" strokeWidth={1.5} strokeDasharray="4 4" name="Emergency Cutoff" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
