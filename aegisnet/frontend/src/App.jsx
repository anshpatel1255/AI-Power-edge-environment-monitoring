// App.jsx — AegisNet (EcoMonitor) v2.0 Application Shell (Complete Top Navbar, No Sidebar)
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'

// Layout Components
import TopHeader from './components/layout/TopHeader'
import Footer from './components/layout/Footer'

// Overlays
import CommandPalette from './components/overlays/CommandPalette'
import ScenarioDrawer from './components/overlays/ScenarioDrawer'
import EmergencyModal from './components/overlays/EmergencyModal'

// Pages
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import HistoryPage from './pages/HistoryPage'
import AnalysisPage from './pages/AnalysisPage'
import AlertsPage from './pages/AlertsPage'
import CommandConsole from './pages/CommandConsole'
import PublicPortal from './pages/PublicPortal'
import FleetPage from './pages/FleetPage'
import SettingsPage from './pages/SettingsPage'
import NodeDetail from './pages/NodeDetail'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import { useAuthStore } from './store/useStore'

function AppLayout({ children }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [scenarioOpen, setScenarioOpen] = useState(false)

  const isPublicRoute = location.pathname === '/public'
  const isLoginRoute = location.pathname === '/login'
  const isLandingRoute = location.pathname === '/landing' || (location.pathname === '/' && !isAuthenticated)
  const isMapRoute = location.pathname === '/map'

  // Standalone pages — completely standalone, no header/footer/overlays
  if (isLoginRoute || isLandingRoute) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        {children}
      </div>
    )
  }

  return (
    <div className={clsx(
      'bg-slate-50 text-slate-900 flex flex-col font-sans',
      isMapRoute ? 'h-screen overflow-hidden' : 'min-h-screen'
    )}>
      {/* Complete Top Navbar — Visible on all pages including Map & Public Portal */}
      <TopHeader
        onOpenCommandPalette={() => setCmdOpen(true)}
        onOpenScenarioDrawer={() => setScenarioOpen(true)}
      />

      {/* Full Width Main Content */}
      <main className={clsx('flex-1 w-full', isMapRoute && 'overflow-hidden flex flex-col')}>
        {children}
      </main>


      {/* Footer on non-map screens */}
      {!isMapRoute && <Footer />}

      {/* Global Overlays */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ScenarioDrawer isOpen={scenarioOpen} onClose={() => setScenarioOpen(false)} />
      <EmergencyModal />
    </div>
  )
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Direct Landing Page — opened on root when not logged in */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
            }
          />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/console" element={<CommandConsole />} />
          <Route path="/public" element={<PublicPortal />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/nodes/:id" element={<NodeDetail />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
