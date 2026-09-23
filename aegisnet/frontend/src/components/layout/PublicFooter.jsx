// components/layout/PublicFooter.jsx — Citizen-Facing Safety & Advisory Footer
// Provides disaster contact directory and public safety resources without internal command links.

import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useStore'

export default function PublicFooter() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <footer className="w-full bg-white border-t border-slate-200/90 font-sans select-none relative transition-all no-print mt-12">
      {/* Top Accent Gradient Line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-400" />

      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 pt-10 pb-8 space-y-10">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-14">
          
          {/* Left: Official Brand */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" opacity="0.3" />
                <path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6z" opacity="0.65" />
                <path d="M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold text-blue-600 tracking-tight leading-tight">
                Code Vortex Public Safety
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Gujarat State Citizen Disaster Advisory Network
              </p>
            </div>
          </div>

          {/* Right: Citizen Emergency & Info Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 lg:gap-16 text-xs w-full lg:w-auto">
            {/* Column 1: Emergency Helplines */}
            <div className="space-y-2.5">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                Emergency Helplines
              </div>
              <div className="text-slate-600">
                <strong className="text-rose-600 font-mono">1077</strong> — State Disaster Control
              </div>
              <div className="text-slate-600">
                <strong className="text-rose-600 font-mono">108</strong> — Medical Ambulance
              </div>
              <div className="text-slate-600">
                <strong className="text-rose-600 font-mono">101</strong> — Fire &amp; Rescue Services
              </div>
              <div className="text-slate-600">
                <strong className="text-rose-600 font-mono">100</strong> — Police Control Room
              </div>
            </div>

            {/* Column 2: Public Resources */}
            <div className="space-y-2.5">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                Public Safety
              </div>
              <div>
                <a href="#what-to-do" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  What to do during emergencies
                </a>
              </div>
              <div>
                <a href="#shelters" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  Find nearest shelters
                </a>
              </div>
              <div>
                <a href="#recent-advisories" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  Recent disaster bulletins
                </a>
              </div>
              <div>
                <a href="#report-hazard" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  Report a local hazard
                </a>
              </div>
            </div>

            {/* Column 3: Authority Access */}
            <div className="space-y-2.5">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                Authority Portal
              </div>
              {isAuthenticated ? (
                <div>
                  <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                    ⊞ Return to Command Center
                  </Link>
                </div>
              ) : (
                <div>
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                    🛡️ Official Agency Sign In →
                  </Link>
                </div>
              )}
              <div className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Restricted to authorized emergency responders &amp; GSDMA personnel.
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Public Notice */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <div>
            © {new Date().getFullYear()} Code Vortex · Gujarat State Disaster Management Authority (GSDMA). All rights reserved.
          </div>
          <div>
            Powered by Autonomous Edge-AI &amp; Low-Power Environmental Sensor Mesh.
          </div>
        </div>
      </div>
    </footer>
  )
}
