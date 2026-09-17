// components/layout/TopHeader.jsx — Premium Command Center Navbar — Dark glassmorphic strip + pill nav
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore, useAuthStore, REGIONS } from '../../store/useStore'
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

  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)

  const unackAlertsCount = alerts.filter((a) => !a.acknowledged).length
  const onlineCount      = nodes.filter((n) => n.status === 'online').length
  const totalCount       = nodes.length

  const NAV_LINKS = [
    { to: '/dashboard', label: 'Dashboard',    icon: '⊞',  aliases: ['/'] },
    { to: '/map',       label: 'Live Map',      icon: '◉'  },
    { to: '/history',   label: 'History',       icon: '≡'  },
    { to: '/analysis',  label: 'AI Analysis',   icon: '◈'  },
    { to: '/alerts',    label: 'Alerts',        icon: '◬',  badge: unackAlertsCount },
    { to: '/console',   label: 'Console',       icon: '▸'  },
    { to: '/public',    label: 'Public Portal', icon: '⊕'  },
    { to: '/fleet',     label: 'Fleet',         icon: '◎'  },
    { to: '/settings',  label: 'Settings',      icon: '◌'  },
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
    <header className="sticky top-0 z-40 select-none">
      {/* ── TOP BAR — dark slate brand strip ──────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-700/80 shadow-lg">
        <div className="h-[60px] px-4 lg:px-6 flex items-center justify-between gap-3">

          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-emerald-900/60 ring-2 ring-emerald-500/30">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight group-hover:text-emerald-400 transition-colors">
                  Aegis<span className="text-emerald-400">Net</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  GSDMA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block leading-none mt-0.5 font-medium tracking-wide">
                Sentinel Mesh Network
              </p>
            </div>
          </Link>

          {/* Center Search */}
          <div className="flex-1 max-w-sm mx-3 hidden md:block">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600/80 rounded-xl px-3 text-xs text-slate-400 flex items-center justify-between transition-all duration-150 shadow-inner"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">🔍</span>
                <span className="text-slate-500 font-medium">Search nodes, locations, incidents...</span>
              </div>
              <kbd className="bg-slate-700 border border-slate-600 rounded-lg px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

            {/* Sim pill */}
            {activeScenario && (
              <button
                type="button"
                onClick={onOpenScenarioDrawer}
                className="h-8 px-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-mono uppercase font-bold">{activeScenario}</span>
              </button>
            )}

            {/* Region selector */}
            <div className="hidden lg:flex items-center">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="h-8 bg-slate-800 hover:bg-slate-700 border border-slate-600/80 rounded-xl px-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* LoRa status */}
            <div
              className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 bg-slate-800 border border-slate-600/80 rounded-xl text-xs"
              title="LoRa 868MHz Mesh Fallback Ready"
            >
              <span className="text-base">📡</span>
              <span className="text-slate-400 font-medium">Mesh:</span>
              <span className="font-mono font-bold text-emerald-400">868MHz OK</span>
            </div>

            {/* Node count */}
            <div
              className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 bg-slate-800 border border-slate-600/80 rounded-xl text-xs"
              title="Active sentinel nodes"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono font-bold text-slate-100">{onlineCount}/{totalCount}</span>
              <span className="text-slate-400 font-medium hidden md:inline">Online</span>
            </div>

            {/* Alert bell */}
            <Link
              to="/alerts"
              className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/80 text-slate-200 transition-all"
              title="Alert Queue"
            >
              <span className="text-sm">🔔</span>
              {unackAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-mono font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md animate-pulse">
                  {unackAlertsCount}
                </span>
              )}
            </Link>

            {/* Simulate CTA */}
            <button
              type="button"
              onClick={onOpenScenarioDrawer}
              className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/40"
            >
              <span>🧪</span>
              <span>Simulate</span>
            </button>

            <div className="h-5 w-px bg-slate-600/60 mx-0.5" aria-hidden="true" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                className={clsx(
                  'h-8 px-2 flex items-center gap-1.5 rounded-xl border transition-all',
                  profileOpen
                    ? 'bg-slate-700 border-slate-500'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600/80'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center ring-1 ring-emerald-500/50">
                  {user?.name?.charAt(0) || 'G'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-100 leading-tight">
                    {user?.name?.split(' ').slice(-1)[0] || 'Officer'}
                  </div>
                  <div className="text-[9px] text-slate-400 leading-none">
                    {user?.role?.split(' ')[0] || 'GSDMA'}
                  </div>
                </div>
                <span className={clsx('text-[9px] text-slate-400 transition-transform duration-200', profileOpen && 'rotate-180')}>
                  ▼
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/20 p-2 text-xs space-y-0.5 z-50 animate-fade-in">
                  <div className="px-3 py-3 bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-xl border border-slate-200 mb-2">
                    <div className="font-bold text-slate-900 text-sm">{user?.name || 'Duty Officer'}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">{user?.email || 'officer@gsdma.gov.in'}</div>
                    <span className="inline-block mt-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {user?.role || 'GSDMA Officer'}
                    </span>
                  </div>

                  {[
                    { to: '/settings', icon: '⚙️', label: 'Settings & Threshold Rules' },
                    { to: '/fleet',    icon: '🛰️', label: 'Node Fleet Inventory' },
                    { to: '/public',   icon: '🌐', label: 'Citizen Safety Portal', newTab: true },
                  ].map(({ to, icon, label, newTab }) => (
                    <Link
                      key={to}
                      to={to}
                      target={newTab ? '_blank' : undefined}
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </Link>
                  ))}

                  <div className="border-t border-slate-200 my-1 mx-1" />

                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); logout(); navigate('/login') }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold transition-colors"
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

      {/* ── NAV BAR — white pill-tab navigation ───────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 lg:px-6 flex items-center gap-0.5 overflow-x-auto h-11">
          {NAV_LINKS.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.aliases && item.aliases.includes(location.pathname))

            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150',
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-900/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <span className="text-sm leading-none" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className={clsx(
                    'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}


