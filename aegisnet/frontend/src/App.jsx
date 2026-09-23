import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'

import ErrorBoundary from './components/common/ErrorBoundary'
import TopHeader from './components/layout/TopHeader'
import Footer from './components/layout/Footer'
import PublicHeader from './components/layout/PublicHeader'
import PublicFooter from './components/layout/PublicFooter'

// Overlays
import CommandPalette from './components/overlays/CommandPalette'
import ScenarioDrawer from './components/overlays/ScenarioDrawer'
import EmergencyModal from './components/overlays/EmergencyModal'
import UsbSerialModal from './components/overlays/UsbSerialModal'

// Pages
import AegisDashboard from './pages/AegisDashboard'
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
import TelemetryPage from './pages/TelemetryPage'
import { useAuthStore, useThemeStore } from './store/useStore'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppLayout({ children }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const theme = useThemeStore((s) => s.theme)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [scenarioOpen, setScenarioOpen] = useState(false)

  // Sync theme to root DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [theme])

  const isPublicRoute = location.pathname === '/public'
  const isLoginRoute = location.pathname === '/login'
  const isLandingRoute = location.pathname === '/landing' || (location.pathname === '/' && !isAuthenticated)
  const isMapRoute = location.pathname === '/map'

  // Standalone pages — completely standalone, no header/footer/overlays
  if (isLoginRoute || isLandingRoute) {
    return (
      <div className="min-h-screen font-sans bg-[#f8fafc] text-slate-900">
        {children}
      </div>
    )
  }

  return (
    <div className={clsx(
      'bg-[#f8fafc] text-slate-900 flex flex-col font-sans transition-colors duration-300',
      'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.07),rgba(255,255,255,0))]',
      isMapRoute ? 'h-screen overflow-hidden' : 'min-h-screen'
    )}>
      {/* Top Navbar — Dedicated citizen header on /public, full command header for officers */}
      {isPublicRoute ? (
        <PublicHeader />
      ) : (
        <TopHeader
          onOpenCommandPalette={() => setCmdOpen(true)}
          onOpenScenarioDrawer={() => setScenarioOpen(true)}
        />
      )}

      {/* Full Width Main Content */}
      <main className={clsx('flex-1 w-full', isMapRoute && 'overflow-hidden flex flex-col')}>
        {children}
      </main>

      {/* Footer on non-map screens */}
      {isPublicRoute ? (
        <PublicFooter />
      ) : (
        !isMapRoute && <Footer />
      )}

      {/* Global Overlays — internal command center only, disabled on public citizen portal */}
      {!isPublicRoute && (
        <>
          <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
          <ScenarioDrawer isOpen={scenarioOpen} onClose={() => setScenarioOpen(false)} />
          <EmergencyModal />
          <UsbSerialModal />
        </>
      )}
    </div>
  )
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <ErrorBoundary>
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
            <Route path="/login" element={<Login />} />
            
            {/* Public Portal — accessible to citizens and officers */}
            <Route path="/public" element={<PublicPortal />} />

            {/* Protected Internal Agency Routes — Officers only */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/situation" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/aegis" element={<ProtectedRoute><AegisDashboard /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
            <Route path="/console" element={<ProtectedRoute><CommandConsole /></ProtectedRoute>} />
            <Route path="/telemetry" element={<ProtectedRoute><TelemetryPage /></ProtectedRoute>} />
            <Route path="/fleet" element={<ProtectedRoute><FleetPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/nodes/:id" element={<ProtectedRoute><NodeDetail /></ProtectedRoute>} />

            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
