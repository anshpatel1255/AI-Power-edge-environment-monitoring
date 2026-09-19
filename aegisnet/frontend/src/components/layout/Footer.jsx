// components/layout/Footer.jsx — Full-Width Edge-to-Edge Minimal Footer (Code Vortex Theme)
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 font-sans transition-colors duration-300 relative">
      
      {/* Sleek Top Gradient Accent Line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-400" />

      {/* Main Full-Width Content Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-10">
        
        {/* ─── Top Row: Brand & 4 Columns of Links ────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-14">

          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            {/* Swirl / Vortex Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.38 5.38 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight leading-tight">
                Code Vortex
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                Sense early. Respond faster.
              </p>
            </div>
          </div>

          {/* Right: 4 Clean Columns of Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 lg:gap-16 text-xs w-full lg:w-auto">

            {/* Column 1 */}
            <div className="space-y-3">
              <div>
                <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Dashboard
                </Link>
              </div>
              <div>
                <Link to="/telemetry" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Live Telemetry
                </Link>
              </div>
              <div>
                <Link to="/map" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Live Map
                </Link>
              </div>
              <div>
                <Link to="/history" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  History
                </Link>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <div>
                <Link to="/analysis" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  AI Analysis
                </Link>
              </div>
              <div>
                <Link to="/alerts" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Alerts
                </Link>
              </div>
              <div>
                <Link to="/fleet" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Fleet
                </Link>
              </div>
              <div>
                <Link to="/console" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Console
                </Link>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-3">
              <div>
                <Link to="/public" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Public Portal
                </Link>
              </div>
              <div>
                <Link to="/settings" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Settings
                </Link>
              </div>
              <div>
                <Link to="/public" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Documentation
                </Link>
              </div>
              <div>
                <Link to="/public" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Help center
                </Link>
              </div>
            </div>

            {/* Column 4 */}
            <div className="space-y-3">
              <div>
                <Link to="/public" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Privacy Policy
                </Link>
              </div>
              <div>
                <Link to="/public" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Security
                </Link>
              </div>
              <div>
                <Link to="/public" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Terms of Service
                </Link>
              </div>
              <div>
                <Link to="/public" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Contact us
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Bottom Row: Circular Social Icons & Centered Copyright ───────── */}
        <div className="mt-14 pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center space-y-3.5">
          
          {/* 5 Circular Action / Social Icons */}
          <div className="flex items-center gap-3">
            {/* GitHub */}
            <a
              href="https://github.com/anshpatel1255/AI-Power-edge-environment-monitoring"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-xs hover:scale-105"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-xs hover:scale-105"
              title="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>

            {/* Twitter / X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-xs hover:scale-105"
              title="Twitter / X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-xs hover:scale-105"
              title="YouTube"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Email / Mail */}
            <a
              href="mailto:support@aegisnet.org"
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-xs hover:scale-105"
              title="Contact Support"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          </div>

          {/* Centered Copyright Line */}
          <p className="text-xs text-slate-400 dark:text-slate-500 font-normal text-center">
            © 2026 <strong className="text-slate-700 dark:text-slate-300 font-semibold">Code Vortex</strong>. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}
