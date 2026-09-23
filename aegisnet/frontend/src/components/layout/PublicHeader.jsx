// components/layout/PublicHeader.jsx — Official Citizen Safety & Public Disaster Advisories Header
// Exclusively shown to citizens on /public with zero internal command navigation or drawers.

import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useStore'

export default function PublicHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <header className="sticky top-0 z-[1050] select-none w-full font-sans">
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.05)] transition-all">
        <div className="h-[74px] px-4 lg:px-8 max-w-[1600px] mx-auto flex items-center justify-between gap-4">

          {/* Left: Official Brand & Public Safety Portal Title */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <Link to="/public" className="flex items-center gap-3 group">
              {/* Spiral Vortex Squircle Logo */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" opacity="0.25" />
                  <path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6z" opacity="0.6" />
                  <path d="M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-600 text-lg tracking-tight group-hover:text-blue-700 transition-colors">
                    Code Vortex
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Official Broadcast
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Citizen Safety &amp; Disaster Advisories Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Center / Right: Emergency Helpline & Official Login Switch */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Emergency Helpline Pill */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold shadow-2xs">
              <span className="text-sm">🚨</span>
              <span>Emergency Helpline:</span>
              <strong className="font-extrabold font-mono text-rose-800">1077</strong>
              <span className="text-rose-300">|</span>
              <span className="text-[11px] text-rose-600">Ambulance: <strong className="font-mono">108</strong></span>
            </div>

            {/* Action Button: Conditional on Auth */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="h-9 px-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 hover:scale-105 cursor-pointer"
              >
                <span>⊞</span>
                <span>Back to Command Center</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="h-9 px-4 bg-white hover:bg-slate-50 border border-slate-300/90 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <span>🛡️</span>
                <span>Official Agency Sign In</span>
                <span className="text-xs">→</span>
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  )
}
