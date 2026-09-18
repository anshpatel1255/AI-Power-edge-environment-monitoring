// components/layout/TopHeader.jsx — Premium AegisNet Command Center Navbar (Luminous Light & Dark Adaptive)
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore, useAuthStore, useThemeStore, REGIONS } from '../../store/useStore'
import clsx from 'clsx'

export default function TopHeader({ onOpenCommandPalette, onOpenScenarioDrawer }) {
  const location  = useLocation()
  const navigate  = useNavigate()

  const selectedRegion    = useStore((s) => s.selectedRegion)
  const setSelectedRegion = useStore((s) => s.setSelectedRegion)
  const alerts            = useStore((s) => s.alerts)
  const nodes             = useStore((s) => s.nodes)
  const activeScenario    = useStore((s) => s.activeScenario)
  const user              = useAuthStore((s) => s.user)
  const logout            = useAuthStore((s) => s.logout)
  const theme             = useThemeStore((s) => s.theme)
  const toggleTheme       = useThemeStore((s) => s.toggleTheme)

  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  const unackAlertsCount = alerts.filter((a) => !a.acknowledged).length
  const onlineCount      = nodes.filter((n) => n.status === 'online').length
  const totalCount       = nodes.length

  const NAV_LINKS = [
    { to: '/dashboard', label: 'Dashboard',    icon: '⊞'   },
    { to: '/map',       label: 'Live Map',      icon: '◉'  },
    { to: '/history',   label: 'History',       icon: '≡'  },
    { to: '/analysis',  label: 'AI Analysis',   icon: '◈'  },
    { to: '/alerts',    label: 'Alerts',        icon: '◬',  badge: unackAlertsCount },
    { to: '/console',   label: 'Console',       icon: '▸'  },
    { to: '/public',    label: 'Public Portal', icon: '⊕'  },
    { to: '/fleet',     label: 'Fleet',         icon: '◎'  },
    { to: '/settings',  label: 'Settings',      icon: '◌'  },
    { to: '/landing',   label: 'Landing',       icon: '🌐' },
  ]

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileOpen(false)
    }
    function handleEscape(e) { if (e.key === 'Escape') setProfileOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header className="sticky top-0 z-[1050] select-none w-full font-sans">
      {/* ── TOP BAR — Luminous Frosted Glass Header ─ */}
      <div className="bg-white/75 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-white/60 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] transition-colors duration-300">
        <div className="h-[62px] px-4 lg:px-6 flex items-center justify-between gap-3">

          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/25 ring-1 ring-white/40 group-hover:scale-105 transition-transform duration-200">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 text-base tracking-wider">
                  AEGISNET
                </span>
                <span className="bg-blue-50/80 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs">
                  SIH26178
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none mt-0.5 font-medium tracking-wide">
                AI-Powered Edge Environmental Guardian
              </p>
            </div>
          </Link>

          {/* Center Search — Frosted Glass pill */}
          <div className="flex-1 max-w-sm mx-3 hidden md:block">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full h-9 bg-slate-100/70 dark:bg-slate-900/60 hover:bg-white/95 dark:hover:bg-slate-800/80 backdrop-blur-md border border-white/80 dark:border-slate-700/60 rounded-full px-4 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">🔍</span>
                <span className="font-medium">Search nodes, hazards, sensors...</span>
              </div>
              <kbd className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 shadow-xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right controls — Frosted glass controls */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Sim pill */}
            {activeScenario && (
              <span className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/80 dark:bg-amber-500/15 border border-amber-200/80 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold animate-pulse backdrop-blur-md shadow-xs">
                <span>⚠️</span>
                <span>{activeScenario.toUpperCase()} DRILL</span>
              </span>
            )}

            {/* Region picker */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/70 dark:bg-slate-900/60 backdrop-blur-md border border-white/80 dark:border-slate-700 rounded-full px-2.5 py-1 text-xs shadow-xs">
              <span className="text-slate-400 text-xs">📍</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mesh stats */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/50 backdrop-blur-md border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineCount}/{totalCount} LoRa</span>
            </div>

            {/* Quick action: simulate drawer */}
            <button
              type="button"
              onClick={onOpenScenarioDrawer}
              className="h-8 px-3.5 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 hover:scale-105 ring-1 ring-white/30"
            >
              <span>🧪</span>
              <span>Simulate</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-white/80 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-xs"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <div className="h-5 w-px bg-slate-200/80 dark:bg-slate-700 mx-0.5" aria-hidden="true" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                className={clsx(
                  'h-8 px-2.5 flex items-center gap-1.5 rounded-full border transition-all backdrop-blur-md',
                  profileOpen
                    ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-sm'
                    : 'bg-slate-100/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-white/80 dark:border-slate-700 shadow-xs'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {user?.name?.split(' ').slice(-1)[0] || 'Officer'}
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-none">
                    {user?.role?.split(' ')[0] || 'GSDMA'}
                  </div>
                </div>
                <span className={clsx('text-[9px] text-slate-500 dark:text-slate-400 transition-transform duration-200', profileOpen && 'rotate-180')}>
                  ▼
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/60 dark:border-slate-800 rounded-3xl shadow-2xl p-2.5 text-xs space-y-1 z-50 animate-fade-in">
                  <div className="px-3.5 py-3 bg-gradient-to-br from-blue-50/90 to-cyan-50/50 dark:from-slate-800/90 dark:to-slate-800/60 rounded-2xl border border-blue-100 dark:border-slate-700 mb-2 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{user?.name || 'Duty Officer'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">{user?.email || 'officer@gsdma.gov.in'}</div>
                    <span className="inline-block mt-1.5 bg-blue-100/90 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {user?.role || 'GSDMA Officer'}
                    </span>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>⚙️</span>
                    <span>System Settings &amp; Rules</span>
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>📜</span>
                    <span>Audit Logs &amp; Reports</span>
                  </Link>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); logout(); navigate('/') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/30 font-bold transition-colors"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── NAV BAR — Centered Glass Dock Navigation with Equal Spacing ───── */}
      <div className="bg-white/65 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-white/50 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-colors duration-300 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <nav className="inline-flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 p-1.5 rounded-full bg-slate-200/40 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/70 dark:border-slate-700/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_4px_20px_rgba(0,0,0,0.04)] overflow-x-auto max-w-full scrollbar-none">
            {NAV_LINKS.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.aliases && item.aliases.includes(location.pathname))

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={clsx(
                    'relative flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white shadow-md shadow-blue-500/30 ring-1 ring-white/40 font-bold scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-white/80 dark:hover:bg-slate-800/70 hover:shadow-xs'
                  )}
                >
                  <span className="text-sm leading-none" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className={clsx(
                      'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-xs',
                      isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white animate-pulse'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
