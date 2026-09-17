// App.jsx — EcoMonitor Tactical Command Center

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
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

// Settings Modal
function SettingsModal({ onClose }) {
  const [thresholds, setThresholds] = useState({
    flood:     { name: 'Water Overflow (Flood)', unit: 'm', warn: 0.8, critical: 1.2 },
    fire:      { name: 'Forest Fire / Thermal', unit: 'C', warn: 40, critical: 45 },
    pollution: { name: 'Air Quality (AQI)', unit: 'AQI', warn: 100, critical: 150 },
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div style={{backgroundColor:'#152018', border:'1px solid #1a261d', color:'#e1e7e2'}} className="rounded-2xl p-6 w-full max-w-md shadow-2xl font-mono">
        <div style={{borderBottom:'1px solid #1a261d'}} className="flex justify-between items-center mb-4 pb-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2" style={{color:'#e1e7e2'}}>
              <span className="material-symbols-outlined text-[20px]" style={{color:'#96d5a3'}}>settings</span>
              Environmental Threshold Settings
            </h3>
            <p className="text-[11px]" style={{color:'#839587'}}>Automated Emergency Protocol Dispatch Rules</p>
          </div>
          <button onClick={onClose} className="text-lg" style={{color:'#839587'}}>✕</button>
        </div>

        <div className="space-y-3 mb-5 text-xs">
          {Object.entries(thresholds).map(([key, t]) => (
            <div key={key} style={{backgroundColor:'#080d09', border:'1px solid #1a261d'}} className="p-3 rounded-xl">
              <div className="font-bold mb-2" style={{color:'#ffb77d'}}>{t.name}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label style={{color:'#839587'}} className="block mb-1">Warning Level ({t.unit})</label>
                  <input
                    type="number" value={t.warn}
                    onChange={(e) => setThresholds({ ...thresholds, [key]: { ...t, warn: parseFloat(e.target.value) || 0 } })}
                    style={{backgroundColor:'#0c120e', border:'1px solid #223326', color:'#e1e7e2'}}
                    className="w-full rounded px-2 py-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label style={{color:'#839587'}} className="block mb-1">Critical Evac ({t.unit})</label>
                  <input
                    type="number" value={t.critical}
                    onChange={(e) => setThresholds({ ...thresholds, [key]: { ...t, critical: parseFloat(e.target.value) || 0 } })}
                    style={{backgroundColor:'#0c120e', border:'1px solid #223326', color:'#e1e7e2'}}
                    className="w-full rounded px-2 py-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            style={{backgroundColor:'#14532d', color:'#96d5a3', border:'1px solid rgba(150,213,163,0.3)'}}
            className="flex-1 font-bold py-2 rounded-xl text-xs"
          >
            {saved ? '✓ Thresholds Updated' : 'Deploy Threshold Updates'}
          </button>
          <button
            onClick={onClose}
            style={{backgroundColor:'#080d09', color:'#839587', border:'1px solid #1a261d'}}
            className="px-4 rounded-xl text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Sidebar
function TacticalSidebar({ onOpenSettings }) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const alerts = useStore((s) => s.alerts)
  const unackAlerts = alerts ? alerts.filter((a) => !a.acknowledged).length : 3

  const navLink = (to, label, icon, badgeCount = null) => {
    const isActive = location.pathname === to || (to === '/' && location.pathname === '/dashboard')
    return (
      <Link
        to={to}
        style={isActive
          ? {backgroundColor:'rgba(150,213,163,0.12)', color:'#96d5a3', borderRight:'2px solid #96d5a3', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px', fontSize:'13px', fontWeight:'600', textDecoration:'none', transition:'all 0.15s'}
          : {color:'#a5b3a7', borderRight:'2px solid transparent', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px', fontSize:'13px', fontWeight:'500', textDecoration:'none', transition:'all 0.15s'}
        }
        onMouseEnter={e => { if(!isActive) { e.currentTarget.style.backgroundColor='rgba(150,213,163,0.07)'; e.currentTarget.style.color='#e1e7e2'; }}}
        onMouseLeave={e => { if(!isActive) { e.currentTarget.style.backgroundColor=''; e.currentTarget.style.color='#a5b3a7'; }}}
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px]" style={{color: isActive ? '#96d5a3' : '#839587'}}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {badgeCount !== null && (
          <span style={{backgroundColor: isActive ? 'rgba(150,213,163,0.2)' : 'rgba(255,183,125,0.15)', color: isActive ? '#96d5a3' : '#ffb77d', border: isActive ? '1px solid rgba(150,213,163,0.3)' : '1px solid rgba(255,183,125,0.3)'}}
            className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
            {badgeCount} ACTIVE
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside style={{backgroundColor:'#080d09', borderRight:'1px solid #1a261d'}} className="fixed left-0 top-0 h-full w-72 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col">
        {/* Brand header */}
        <div style={{backgroundColor:'#101812', borderBottom:'1px solid #1a261d'}} className="h-16 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div style={{backgroundColor:'#14532d', border:'1px solid rgba(150,213,163,0.3)', color:'#96d5a3'}} className="w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">sensors</span>
            </div>
            <div className="flex flex-col">
              <span style={{color:'#e1e7e2'}} className="font-bold text-[18px] leading-none tracking-tight">EcoMonitor</span>
              <span style={{color:'#839587'}} className="text-[10px] uppercase tracking-widest font-mono">TAC-NET OPS</span>
            </div>
          </Link>
          <span style={{backgroundColor:'#14532d', color:'#96d5a3', border:'1px solid rgba(150,213,163,0.2)'}} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest font-mono">
            v2.4
          </span>
        </div>

        {/* Nav */}
        <div className="px-2 pt-3 pb-1">
          <div style={{color:'#839587'}} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest font-mono mb-1">
            Navigation Modules
          </div>
          <nav className="flex flex-col gap-0.5">
            {navLink('/', 'Dashboard', 'grid_view')}
            {navLink('/map', 'Map', 'map')}
            {navLink('/history', 'History', 'history')}
            {navLink('/analysis', 'Analysis', 'insights')}
            {navLink('/alerts', 'Alerts', 'crisis_alert', unackAlerts > 0 ? unackAlerts : 3)}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col px-2 pb-4">
        <div style={{borderTop:'1px solid #1a261d'}} className="my-2"></div>
        <nav className="flex flex-col gap-0.5">
          <button
            onClick={onOpenSettings}
            style={{color:'#a5b3a7', display:'flex', alignItems:'center', gap:'10px', padding:'8px 16px', fontSize:'13px', background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', borderRight:'2px solid transparent', transition:'all 0.15s'}}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor='rgba(150,213,163,0.07)'; e.currentTarget.style.color='#e1e7e2'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor=''; e.currentTarget.style.color='#a5b3a7'; }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{color:'#839587'}}>settings</span>
            <span>Settings</span>
          </button>
          {user ? (
            <button
              onClick={logout}
              style={{color:'#a5b3a7', display:'flex', alignItems:'center', gap:'10px', padding:'8px 16px', fontSize:'13px', background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', borderRight:'2px solid transparent', transition:'all 0.15s'}}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor='rgba(255,180,171,0.1)'; e.currentTarget.style.color='#ffb4ab'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor=''; e.currentTarget.style.color='#a5b3a7'; }}
            >
              <span className="material-symbols-outlined text-[20px]" style={{color:'#839587'}}>logout</span>
              <span>Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              style={{color:'#a5b3a7', display:'flex', alignItems:'center', gap:'10px', padding:'8px 16px', fontSize:'13px', textDecoration:'none', borderRight:'2px solid transparent', transition:'all 0.15s'}}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor='rgba(150,213,163,0.07)'; e.currentTarget.style.color='#e1e7e2'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor=''; e.currentTarget.style.color='#a5b3a7'; }}
            >
              <span className="material-symbols-outlined text-[20px]" style={{color:'#839587'}}>login</span>
              <span>Login</span>
            </Link>
          )}
        </nav>

        <div style={{backgroundColor:'#152018', border:'1px solid #1a261d'}} className="mt-2 px-3 py-2.5 rounded-lg flex items-center justify-between">
          <div className="flex flex-col">
            <span style={{color:'#839587'}} className="text-[10px] uppercase tracking-widest font-mono">Console Duty Node</span>
            <span style={{color:'#96d5a3'}} className="text-[11px] font-bold font-mono">SEC-NODE-04</span>
          </div>
          <span className="material-symbols-outlined text-[18px]" style={{color:'#6bd8cb'}}>hub</span>
        </div>
      </div>
    </aside>
  )
}

// Header
function TacticalHeader() {
  const [utcTime, setUtcTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setUtcTime(now.toTimeString().split(' ')[0])
    }
    updateTime()
    const id = setInterval(updateTime, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header style={{backgroundColor:'rgba(12,18,14,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid #1a261d', color:'#e1e7e2'}}
      className="fixed top-0 left-72 right-0 h-16 z-40 px-5 flex items-center justify-between select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div style={{backgroundColor:'#14532d', border:'1px solid rgba(150,213,163,0.3)', color:'#96d5a3'}} className="w-8 h-8 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">public</span>
          </div>
          <span style={{color:'#e1e7e2'}} className="font-semibold text-[17px]">EcoMonitor Console</span>
        </div>

        <div style={{backgroundColor:'#152018', border:'1px solid #1a261d'}} className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:'#96d5a3'}}></span>
          <span style={{color:'#e1e7e2'}} className="text-[10px] font-bold uppercase tracking-widest font-mono">Mesh Operational</span>
          <span style={{color:'#a5b3a7'}} className="text-[11px] font-mono">24ms / 99.98%</span>
        </div>

        <div style={{backgroundColor:'#1c2b20', border:'1px solid rgba(255,183,125,0.3)'}} className="flex items-center gap-2 px-3 py-1 rounded">
          <span className="material-symbols-outlined text-[16px]" style={{color:'#ffb77d'}}>warning</span>
          <span style={{color:'#ffb77d'}} className="text-[10px] font-bold uppercase tracking-widest font-mono">SURGE IN ZONE 3 (S-014)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span style={{color:'#839587'}} className="text-[10px] uppercase tracking-widest font-mono">Duty Officer</span>
          <span style={{color:'#e1e7e2'}} className="text-[12px] font-semibold">Cmdr. Vance</span>
        </div>

        <div style={{backgroundColor:'#152018', border:'1px solid #1a261d', color:'#a5b3a7'}} className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px]">
          <span className="material-symbols-outlined text-[16px]" style={{color:'#96d5a3'}}>schedule</span>
          <span style={{color:'#a5b3a7'}}>{utcTime || '00:00:00'} UTC</span>
        </div>

        <button style={{backgroundColor:'#152018', border:'1px solid #1a261d', color:'#a5b3a7', padding:'6px', borderRadius:'6px', cursor:'pointer'}}>
          <span className="material-symbols-outlined text-[18px]" style={{color:'#96d5a3'}}>shield_with_heart</span>
        </button>

        <div style={{backgroundColor:'#96d5a3', color:'#003718'}} className="w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  )
}

// App Root
export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const { upsertNode, addAlert, updateAlertStatus, setConnected, mockMode, tickMockData } = useStore()

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

  useEffect(() => {
    if (!mockMode) return
    const id = setInterval(tickMockData, 4000)
    return () => clearInterval(id)
  }, [mockMode])

  return (
    <BrowserRouter>
      <div style={{minHeight:'100vh', backgroundColor:'#0c120e', color:'#e1e7e2'}}>
        <TacticalSidebar onOpenSettings={() => setShowSettings(true)} />
        <div style={{paddingLeft:'18rem'}}>
          <TacticalHeader />
          <main style={{width:'100%', paddingTop:'4rem', backgroundColor:'#0c120e', minHeight:'100vh'}}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/nodes/:id" element={<NodeDetail />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
        </div>

        <SmsToast />
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </BrowserRouter>
  )
}
