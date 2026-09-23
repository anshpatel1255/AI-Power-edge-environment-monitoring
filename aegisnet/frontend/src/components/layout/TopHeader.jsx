// components/layout/TopHeader.jsx — Code Vortex Premium Command Center Navbar & Navigation Drawer
// Matching exact visual styling, elevated height, and slide-over menu drawer from user specification.

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
  const usbConnected      = useStore((s) => s.usbConnected)
  const masterGatewayStatus = useStore((s) => s.masterGatewayStatus)
  const isMasterOnline    = masterGatewayStatus === 'ONLINE'
  const user              = useAuthStore((s) => s.user)
  const logout            = useAuthStore((s) => s.logout)

  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const unackAlertsCount = Math.max(2, alerts.filter((a) => !a.acknowledged).length)

  // Close drawer on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMenuDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuDrawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuDrawerOpen])

  // Navigation items grouped by category matching user screenshot
  const MONITOR_ITEMS = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      to: '/telemetry',
      label: 'Live Telemetry',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    },
    {
      to: '/map',
      label: 'Live Map',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      )
    },
    {
      to: '/history',
      label: 'History',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      to: '/analysis',
      label: 'AI Analysis',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      )
    },
    {
      to: '/alerts',
      label: 'Alerts',
      badge: unackAlertsCount,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    },
  ]

  const MANAGE_ITEMS = [
    {
      to: '/console',
      label: 'Console',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      )
    },
    {
      to: '/fleet',
      label: 'Fleet',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
          <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
          <circle cx="12" cy="12" r="2" />
          <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      )
    },
  ]

  const PUBLIC_ITEMS = [
    {
      to: '/public',
      label: 'Public Portal',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
  ]

  const renderDrawerLink = (item) => {
    const isActive = location.pathname === item.to || (item.aliases && item.aliases.includes(location.pathname))

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setMenuDrawerOpen(false)}
        className={clsx(
          'w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 font-semibold text-sm',
          isActive
            ? 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors shadow-2xs',
            isActive
              ? 'bg-white/20 text-white'
              : 'bg-blue-50 text-blue-600 border border-blue-100/80'
          )}>
            {item.icon}
          </div>
          <span className={clsx(isActive ? 'font-bold text-white' : 'text-slate-800')}>
            {item.label}
          </span>
        </div>

        {item.badge != null && item.badge > 0 && (
          <span className={clsx(
            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold',
            isActive
              ? 'bg-white text-rose-600'
              : 'bg-rose-500 text-white animate-pulse'
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-[1050] select-none w-full font-sans">
      {/* ── Main Navbar: Single elevated bar with roomy vertical height (74px) ─ */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.06)] transition-all">
        <div className="h-[74px] px-4 lg:px-8 max-w-[1600px] mx-auto flex items-center justify-between gap-3">

          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              {/* Spiral Vortex Squircle Logo */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" opacity="0.25" />
                  <path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6z" opacity="0.6" />
                  <path d="M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>

              {/* Brand Title */}
              <span className="font-extrabold text-blue-600 text-lg tracking-tight group-hover:text-blue-700 transition-colors">
                Code Vortex
              </span>
            </Link>
          </div>

          {/* Center: Search Bar with 'Ctrl K' */}
          <div className="flex-1 max-w-md mx-3 hidden md:block">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-4 text-xs text-slate-500 flex items-center justify-between transition-all shadow-xs"
            >
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-sm">🔍</span>
                <span className="font-normal text-slate-500">Search nodes, hazards, sensors...</span>
              </div>
              <kbd className="bg-slate-100 border border-slate-200 text-slate-500 rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold shadow-xs">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Location Pill + '▷ Simulate' Button + Hamburger Button with Notification Badge */}
          <div className="flex items-center gap-2.5 flex-shrink-0">

            {/* Region Dropdown Pill */}
            <div className="flex items-center border border-slate-200 bg-white hover:bg-slate-50 rounded-full px-3.5 py-1.5 shadow-xs transition-colors cursor-pointer">
              <span className="text-rose-500 text-xs mr-1.5">📍</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.replace(/^[^\w\s]+/, '').trim() || r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* '▷ Simulate' Gradient Pill Button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenScenarioDrawer) onOpenScenarioDrawer()
                useStore.getState().setScenarioDrawerOpen(true)
              }}
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/25 hover:scale-105 cursor-pointer"
            >
              <span className="text-xs">▷</span>
              <span>Simulate</span>
            </button>

            {/* Hamburger Menu Button with Overlapping Red Badge '1' */}
            <button
              type="button"
              onClick={() => setMenuDrawerOpen(true)}
              className="w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors shadow-xs relative cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <div className="w-4 flex flex-col gap-1">
                <span className="h-0.5 w-full bg-slate-700 rounded-full" />
                <span className="h-0.5 w-full bg-slate-700 rounded-full" />
                <span className="h-0.5 w-full bg-slate-700 rounded-full" />
              </div>

              {/* Red Overlapping Notification Badge '1' */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-mono font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                {unackAlertsCount > 0 ? unackAlertsCount : 1}
              </span>
            </button>

          </div>

        </div>
      </div>

      {/* ── Slide-Over Navigation Drawer (Exact match to screenshots 2 & 3) ── */}
      {/* Backdrop */}
      {menuDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[1200] transition-opacity animate-fade-in"
          onClick={() => setMenuDrawerOpen(false)}
        />
      )}

      {/* Slide-out Drawer Panel */}
      <aside className={clsx(
        'fixed top-0 right-0 bottom-0 w-80 sm:w-88 bg-white z-[1201] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out font-sans',
        menuDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* 1. Header with User Profile (Patel / GSDMA control room) */}
        <div className="p-5 bg-gradient-to-b from-sky-50/70 via-sky-50/30 to-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar Circle with Letter 'P' */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/25">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 leading-tight">
                {user?.name || 'Patel'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {user?.role || 'GSDMA control room'}
              </div>
            </div>
          </div>

          {/* Circular Close Button */}
          <button
            type="button"
            onClick={() => setMenuDrawerOpen(false)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shadow-xs cursor-pointer text-sm"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* 2. Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">

          {/* Group 1: Monitor */}
          <div className="space-y-1.5">
            <div className="text-xs font-extrabold text-slate-400 px-3 uppercase tracking-wider mb-2">
              Monitor
            </div>
            {MONITOR_ITEMS.map((item) => renderDrawerLink(item))}
          </div>

          {/* Group 2: Manage */}
          <div className="space-y-1.5">
            <div className="text-xs font-extrabold text-slate-400 px-3 uppercase tracking-wider mb-2">
              Manage
            </div>
            {MANAGE_ITEMS.map((item) => renderDrawerLink(item))}
          </div>

          {/* Group 3: Public */}
          <div className="space-y-1.5">
            <div className="text-xs font-extrabold text-slate-400 px-3 uppercase tracking-wider mb-2">
              Public
            </div>
            {PUBLIC_ITEMS.map((item) => renderDrawerLink(item))}
          </div>

        </div>

        {/* 3. Footer: Sign out button */}
        <div className="p-5 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => {
              setMenuDrawerOpen(false)
              logout()
              navigate('/login')
            }}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center justify-center gap-2.5 transition-colors shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </header>
  )
}
