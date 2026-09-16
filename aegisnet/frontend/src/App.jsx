// App.jsx — EcoMonitor Navigation, Routing & Global Alert Management

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useStore, useAuthStore } from './store/useStore'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import HistoryPage from './pages/HistoryPage'
import AnalysisPage from './pages/AnalysisPage'
import AlertsPage from './pages/AlertsPage'
import NodeDetail from './pages/NodeDetail'
import Login from './pages/Login'
import SmsToast from './components/alerts/SmsToast'
import clsx from 'clsx'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

// ─── Settings Protocol Modal (Thresholds) ─────────────────────────────────────
function SettingsModal({ onClose }) {
  const [thresholds, setThresholds] = useState({
    flood:     { name: 'Water Overflow (Flood)', unit: 'm', warn: 0.8, critical: 1.2 },
    fire:      { name: 'Forest Fire / Thermal', unit: '°C', warn: 40, critical: 45 },
    pollution: { name: 'Air Pollution (AQI)', unit: 'AQI', warn: 100, critical: 150 },
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-6 w-full max-w-md shadow-2xl text-[#EDEDE9] font-mono">
        <div className="flex justify-between items-center mb-4 border-b border-[#2D3B2F] pb-3">
          <div>
            <h3 className="font-bold text-base text-[#EDEDE9] flex items-center gap-2">
              <span>⚙️</span> Environmental Threshold Settings
            </h3>
            <p className="text-[11px] text-[#6B7280]">Govt Email & Automated SOS Call Dispatch Rules</p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#EDEDE9] text-lg">✕</button>
        </div>

        <div className="space-y-3.5 mb-5 text-xs">
          {Object.entries(thresholds).map(([key, t]) => (
            <div key={key} className="bg-[#141A16] p-3 rounded-xl border border-[#2D3B2F]">
              <div className="font-bold text-[#D97706] mb-2">{t.name}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="text-[#6B7280] block mb-1">Warning Level ({t.unit})</label>
                  <input
                    type="number"
                    value={t.warn}
                    onChange={(e) => setThresholds({
                      ...thresholds,
                      [key]: { ...thresholds[key], warn: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#1F2921] border border-[#2D3B2F] rounded px-2 py-1 text-[#EDEDE9]"
                  />
                </div>
                <div>
                  <label className="text-[#6B7280] block mb-1">Critical Level ({t.unit})</label>
                  <input
                    type="number"
                    value={t.critical}
                    onChange={(e) => setThresholds({
                      ...thresholds,
                      [key]: { ...thresholds[key], critical: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-[#1F2921] border border-[#2D3B2F] rounded px-2 py-1 text-[#EDEDE9]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-bold py-2 rounded-lg border border-[#2D3B2F] transition-colors text-xs"
          >
            {saved ? '✓ Protocols Updated' : 'Save Configuration'}
          </button>
          <button
            onClick={onClose}
            className="px-4 bg-[#141A16] hover:bg-[#2D3B2F] text-[#6B7280] rounded-lg border border-[#2D3B2F] text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EcoMonitor Unified Navigation Bar ─────────────────────────────────────────
function Nav({ onOpenSettings }) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const alerts = useStore((s) => s.alerts)

  const unackAlerts = alerts.filter((a) => !a.acknowledged).length

  const navItem = (to, label, icon, badgeCount = 0) => {
    const isActive = location.pathname === to || (to === '/' && location.pathname === '/dashboard')
    return (
      <Link
        to={to}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all',
          isActive
            ? 'bg-[#0B3820] text-[#D97706] border-b-2 border-[#D97706] font-bold shadow-sm'
            : 'text-[#EDEDE9]/80 hover:text-white hover:bg-[#0B3820]/60'
        )}
      >
        <span>{icon}</span>
        <span>{label}</span>
        {badgeCount > 0 && (
          <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
            {badgeCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#14532D] border-b border-[#0B3820] shadow-md px-4 h-14 flex items-center justify-between">
      {/* Brand: 🌍 EcoMonitor */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg bg-[#0B3820] border border-[#22C55E]/40 flex items-center justify-center shadow-inner">
          <span className="text-[#22C55E] text-base">🌍</span>
        </div>
        <div>
          <span className="font-bold text-[#EDEDE9] text-base tracking-tight group-hover:text-white transition-colors">
            Eco<span className="text-[#D97706]">Monitor</span>
          </span>
          <span className="hidden lg:inline-block text-[10px] text-[#22C55E] ml-2 font-mono uppercase tracking-wider">
            Environmental Network
          </span>
        </div>
      </Link>

      {/* Recommended 5-Item Navigation */}
      <div className="flex items-center gap-1">
        {navItem('/', 'Dashboard', '🏠')}
        {navItem('/map', 'Map', '🗺️')}
        {navItem('/history', 'History', '📜')}
        {navItem('/analysis', 'Analysis', '📊')}
        {navItem('/alerts', 'Alerts', '🚨', unackAlerts)}
      </div>

      {/* Action / Settings / Logout */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1.5 rounded-lg bg-[#0B3820] hover:bg-[#14532D] text-[#EDEDE9] hover:text-[#D97706] border border-[#2D3B2F] transition-colors flex items-center gap-1"
          title="Threshold Settings"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Settings</span>
        </button>

        {/* Logout */}
        {user ? (
          <button
            onClick={logout}
            className="px-2.5 py-1.5 rounded-lg bg-[#0B3820] hover:bg-[#EF4444]/20 text-[#6B7280] hover:text-[#EF4444] border border-[#2D3B2F] transition-colors flex items-center gap-1"
            title="Sign Out"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="px-2.5 py-1.5 rounded-lg bg-[#D97706] hover:bg-[#b45309] text-white font-bold transition-colors shadow-sm"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const { upsertNode, addAlert, updateAlertStatus, setConnected, mockMode, tickMockData } = useStore()

  // Socket.IO live connection
  useEffect(() => {
    if (mockMode) return

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('node:update', (data) => upsertNode(data))
    socket.on('alert:new', (data) => addAlert(data))
    socket.on('alert:statusChanged', (data) => updateAlertStatus(data.id, data.status))

    return () => socket.disconnect()
  }, [mockMode])

  // Mock data ticker
  useEffect(() => {
    if (!mockMode) return
    const id = setInterval(tickMockData, 4000)
    return () => clearInterval(id)
  }, [mockMode])

  return (
    <BrowserRouter>
      <Nav onOpenSettings={() => setShowSettings(true)} />
      <main className="pt-14 min-h-screen bg-[#141A16] text-[#EDEDE9]">
        <Routes>
          {/* 1. Dashboard: Overall system control */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* 2. Map: Geographic monitoring */}
          <Route path="/map" element={<MapPage />} />

          {/* 3. History: Previous data & exports */}
          <Route path="/history" element={<HistoryPage />} />

          {/* 4. Analysis: AI/data analysis */}
          <Route path="/analysis" element={<AnalysisPage />} />

          {/* 5. Alerts: Immediate warnings ⭐ */}
          <Route path="/alerts" element={<AlertsPage />} />

          {/* Supporting Routes */}
          <Route path="/nodes/:id" element={<NodeDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Emergency Broadcast Toast */}
      <SmsToast />

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </BrowserRouter>
  )
}
