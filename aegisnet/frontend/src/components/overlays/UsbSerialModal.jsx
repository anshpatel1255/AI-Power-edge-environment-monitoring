// components/overlays/UsbSerialModal.jsx — Live USB ESP32 Hardware Diagnostics & Terminal Modal
import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { webSerialService } from '../../services/webSerialService'
import clsx from 'clsx'

export default function UsbSerialModal() {
  const isOpen           = useStore((s) => s.usbModalOpen)
  const setOpen          = useStore((s) => s.setUsbModalOpen)
  const isConnected      = useStore((s) => s.usbConnected)
  const portName         = useStore((s) => s.usbPortName)
  const baudRate         = useStore((s) => s.usbBaudRate)
  const packetCount      = useStore((s) => s.usbPacketCount)
  const packetsPerSec    = useStore((s) => s.usbPacketsPerSec)
  const logs             = useStore((s) => s.usbRawLogs)
  const clearLogs        = useStore((s) => s.clearUsbLogs)
  const esp32Nodes       = useStore((s) => s.esp32Nodes)

  const [selectedBaud, setSelectedBaud] = useState(baudRate || 115200)
  const [connecting, setConnecting]     = useState(false)
  const [autoScroll, setAutoScroll]     = useState(true)
  const [isSimulating, setIsSimulating] = useState(false)
  const logContainerRef = useRef(null)

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [logs, autoScroll])

  if (!isOpen) return null

  const handleConnect = async () => {
    setConnecting(true)
    try {
      await webSerialService.connect(selectedBaud)
    } catch {
      // Handled in service logs
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (isSimulating) {
      webSerialService.stopSimulator()
      setIsSimulating(false)
    } else {
      await webSerialService.disconnect()
    }
  }

  const handleToggleSimulator = () => {
    if (isSimulating) {
      webSerialService.stopSimulator()
      setIsSimulating(false)
    } else {
      webSerialService.startSimulator(1400)
      setIsSimulating(true)
    }
  }

  // Find live nodes or fallback representation
  const floodNode     = esp32Nodes.find((n) => n.node_id?.includes('FLOOD') || n.category === 'flood')
  const cotempNode    = esp32Nodes.find((n) => n.node_id?.includes('COTEMP') || n.category === 'fire')
  const pollutionNode = esp32Nodes.find((n) => n.node_id?.includes('POLLUTION') || n.category === 'air')

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-xl shadow-md ring-2 ring-emerald-400/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">
                  ESP32 Gateway USB Terminal & Diagnostics
                </h2>
                <span className={clsx(
                  'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                )}>
                  {isConnected ? '● LIVE SYNC' : '○ DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct browser Web Serial communication receiving 3 remote sensor ESP32 telemetry packets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* Connection Toolbar Strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Baud rate selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="baud-select" className="text-xs font-bold text-slate-600">Baud Rate:</label>
                <select
                  id="baud-select"
                  disabled={isConnected}
                  value={selectedBaud}
                  onChange={(e) => {
                    const rate = Number(e.target.value)
                    setSelectedBaud(rate)
                    webSerialService.setBaudRate(rate)
                  }}
                  className="text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-600 disabled:opacity-60 cursor-pointer"
                >
                  <option value={115200}>115200 (Default ESP32)</option>
                  <option value={9600}>9600</option>
                  <option value={57600}>57600</option>
                  <option value={230400}>230400 (High Speed)</option>
                </select>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200">
                <span className={clsx(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                )} />
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {isConnected ? (portName || 'Connected on COM7') : 'Target: COM7 @ 115200'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {!isConnected ? (
                <button
                  type="button"
                  disabled={connecting}
                  onClick={handleConnect}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Opens browser port picker to select COM7"
                >
                  <span>⚡</span>
                  <span>{connecting ? 'Selecting...' : 'Connect COM7 (Web Serial)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>✕</span>
                  <span>Disconnect</span>
                </button>
              )}

              {/* Virtual Simulator Toggle */}
              <button
                type="button"
                onClick={handleToggleSimulator}
                className={clsx(
                  'text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5',
                  isSimulating
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                )}
                title="Generates live ESP-NOW JSON packets without physical hardware"
              >
                <span>🧪</span>
                <span>{isSimulating ? 'Stop Test Stream' : 'Test Packet Simulator'}</span>
              </button>
            </div>
          </div>

          {/* Telemetry Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Packets Received</div>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">{packetCount}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Rate</div>
              <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">{packetsPerSec} <span className="text-xs font-normal text-slate-400">pkt/s</span></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Sensor ESPs</div>
              <div className="text-2xl font-mono font-bold text-blue-700 mt-1">
                {[floodNode, cotempNode, pollutionNode].filter((n) => Boolean(n && n.status === 'online')).length} / 3
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mesh Protocol</div>
              <div className="text-sm font-mono font-bold text-purple-700 mt-2">ESP-NOW 2.4GHz</div>
            </div>
          </div>

          {/* ── 3 Field Sensor Node Telemetry Cards ───────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3 Remote Sensor ESP32 Nodes (Forwarded via USB Gateway)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Auto-syncing to all 9 Command Center screens
                </span>
              </div>
              
              {/* If fewer than 3 nodes are active, offer 1-click auto-sync for missing nodes */}
              {[floodNode, cotempNode, pollutionNode].filter((n) => Boolean(n && n.status === 'online')).length < 3 && (
                <button
                  type="button"
                  onClick={() => webSerialService.fillMissingNodes()}
                  className="text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl px-3 py-1 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Populates remaining sensor nodes for complete full-screen telemetry view"
                >
                  <span>⚡</span>
                  <span>Sync Remaining Nodes</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">

              {/* Node 1: Flood & Water Level */}
              <div className={clsx(
                'rounded-2xl border-2 p-4 transition-all shadow-xs',
                floodNode
                  ? (floodNode.risk_score >= 80 ? 'border-red-300 bg-red-50/50' : floodNode.risk_score >= 50 ? 'border-amber-300 bg-amber-50/50' : 'border-blue-200 bg-blue-50/30')
                  : 'border-slate-200 bg-white opacity-70'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌊</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ESP32-FLOOD</div>
                      <div className="text-[10px] text-slate-500 font-mono">Water & Soil Sensor</div>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                    floodNode
                      ? (floodNode.is_live_hw ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800')
                      : 'bg-slate-100 text-slate-500'
                  )}>
                    {floodNode ? (floodNode.is_live_hw ? '● LIVE HW' : '● ONLINE') : '○ WAITING'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between bg-white/80 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Water Distance:</span>
                    <b className="text-blue-700">
                      {floodNode?.water_level_cm != null ? `${floodNode.water_level_cm.toFixed(1)} cm` : '—'}
                    </b>
                  </div>
                  <div className="flex justify-between bg-white/80 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Soil Moisture:</span>
                    <b className="text-blue-700">
                      {floodNode?.soil_moisture != null ? `${floodNode.soil_moisture.toFixed(1)} %` : '—'}
                    </b>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-slate-500 font-sans">Risk Score:</span>
                    <span className={clsx(
                      'font-bold px-2 py-0.5 rounded-full',
                      (floodNode?.risk_score || 0) >= 80 ? 'bg-red-100 text-red-700' : (floodNode?.risk_score || 0) >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    )}>
                      {floodNode?.risk_score || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Node 2: Fire & CO-Thermal */}
              <div className={clsx(
                'rounded-2xl border-2 p-4 transition-all shadow-xs',
                cotempNode
                  ? (cotempNode.risk_score >= 80 ? 'border-red-300 bg-red-50/50' : cotempNode.risk_score >= 50 ? 'border-amber-300 bg-amber-50/50' : 'border-orange-200 bg-orange-50/30')
                  : 'border-slate-200 bg-white opacity-70'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ESP32-COTEMP</div>
                      <div className="text-[10px] text-slate-500 font-mono">CO & Thermal Sensor</div>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                    cotempNode
                      ? (cotempNode.is_live_hw ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800')
                      : 'bg-slate-100 text-slate-500'
                  )}>
                    {cotempNode ? (cotempNode.is_live_hw ? '● LIVE HW' : '● ONLINE') : '○ WAITING'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between bg-white/80 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500">CO Gas (MQ-7):</span>
                    <b className="text-orange-700">
                      {cotempNode?.gas_ppm != null ? `${cotempNode.gas_ppm.toFixed(2)} ppm` : '—'}
                    </b>
                  </div>
                  <div className="flex justify-between bg-white/80 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500">Temp / Humidity:</span>
                    <b className="text-orange-700">
                      {cotempNode?.temperature_c != null ? `${cotempNode.temperature_c.toFixed(1)}°C / ${cotempNode.humidity_pct || 50}%` : '—'}
                    </b>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-slate-500 font-sans">Flame Status:</span>
                    <span className={clsx(
                      'font-bold px-2 py-0.5 rounded-full',
                      cotempNode?.flame_detected ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                    )}>
                      {cotempNode?.flame_detected ? '🔥 DETECTED' : 'CLEAR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Node 3: Air Pollution & Gas */}
              <div className={clsx(
                'rounded-2xl border-2 p-4 transition-all shadow-xs',
                pollutionNode
                  ? (pollutionNode.risk_score >= 80 ? 'border-red-300 bg-red-50/50' : pollutionNode.risk_score >= 50 ? 'border-amber-300 bg-amber-50/50' : 'border-purple-200 bg-purple-50/30')
                  : 'border-slate-200 bg-white opacity-70'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌫️</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ESP32-POLLUTION</div>
                      <div className="text-[10px] text-slate-500 font-mono">AQI & Gas Sensor</div>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                    pollutionNode
                      ? (pollutionNode.is_live_hw ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800')
                      : 'bg-slate-100 text-slate-500'
                  )}>
                    {pollutionNode ? (pollutionNode.is_live_hw ? '● LIVE HW' : '● ONLINE') : '○ WAITING'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between bg-white/80 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500">PM2.5 AQI:</span>
                    <b className="text-purple-700">
                      {pollutionNode?.smoke_aqi != null ? `${pollutionNode.smoke_aqi} µg/m³` : '—'}
                    </b>
                  </div>
                  <div className="flex justify-between bg-white/80 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500">MQ-135 / MQ-4:</span>
                    <b className="text-purple-700">
                      {pollutionNode?.mq135_strength != null ? `${pollutionNode.mq135_strength.toFixed(0)}% / ${pollutionNode.mq4_strength?.toFixed(0) || 0}%` : '—'}
                    </b>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-slate-500 font-sans">Risk Score:</span>
                    <span className={clsx(
                      'font-bold px-2 py-0.5 rounded-full',
                      (pollutionNode?.risk_score || 0) >= 80 ? 'bg-red-100 text-red-700' : (pollutionNode?.risk_score || 0) >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    )}>
                      {pollutionNode?.risk_score || 0}%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Live Raw RX Terminal ────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Serial Packet Stream (RX Console)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ({logs.length} lines logged)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-600 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Auto-scroll</span>
                </label>
                <button
                  type="button"
                  onClick={clearLogs}
                  className="text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors"
                >
                  Clear Console
                </button>
              </div>
            </div>

            <div
              ref={logContainerRef}
              className="h-48 bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-2xl overflow-y-auto border border-slate-800 space-y-1 shadow-inner select-text"
            >
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-center">
                  <div>
                    <div className="text-lg mb-1">🔌</div>
                    <div>Waiting for serial packets...</div>
                    <div className="text-[10px] text-slate-700 mt-1">
                      Click "Connect USB Port" to connect ESP32, or click "Test Packet Simulator" to preview
                    </div>
                  </div>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="leading-relaxed flex items-start gap-2">
                    <span className="text-slate-600 text-[10px] shrink-0">{log.time}</span>
                    <span className={clsx(
                      'text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase',
                      log.type === 'rx' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      log.type === 'error' ? 'bg-red-950 text-red-400 border border-red-800' :
                      log.type === 'warn' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      log.type === 'success' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                      'bg-slate-800 text-slate-300'
                    )}>
                      {log.sender}
                    </span>
                    <span className={clsx(
                      'break-all',
                      log.type === 'rx' ? 'text-emerald-300' :
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warn' ? 'text-amber-300' :
                      log.type === 'success' ? 'text-teal-200' :
                      'text-slate-300'
                    )}>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>ESP32 Gateway communicates via ESP-NOW to 3 sensor nodes and relays JSON over USB Serial.</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  )
}
