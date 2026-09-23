// pages/Login.jsx — AegisNet Command Gateway · Disaster Detection Photo BG & Frosted Glass Auth
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'

const ROLES = [
  { value: 'GSDMA Officer',        label: 'GSDMA State Disaster Officer' },
  { value: 'Municipal Officer',    label: 'Municipal Environmental Cell (AMC/SMC)' },
  { value: 'Fire Dept Officer',    label: 'Fire & Emergency Services (101)' },
  { value: 'Police Control',       label: 'Gujarat Police Control (100)' },
  { value: 'Super Admin',          label: 'Command Super Admin' },
]

export default function Login() {
  const navigate = useNavigate()
  const setAuth   = useAuthStore((s) => s.setAuth)

  const [email,        setEmail]        = useState('officer.patel@gsdma.gov.in')
  const [password,     setPassword]     = useState('demo1234')
  const [selectedRole, setSelectedRole] = useState('GSDMA Officer')
  const [showPass,     setShowPass]     = useState(false)
  const [loading,      setLoading]      = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setAuth(
        {
          id: 1,
          name: 'Officer K. Patel',
          email,
          role: selectedRole,
          agency: 'Gujarat State Disaster Management Authority',
        },
        'demo-jwt-token'
      )
      navigate('/dashboard')
    }, 700)
  }

  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-slate-950 flex flex-col selection:bg-cyan-500 selection:text-white">

      {/* ── CINEMATIC SYSTEM DETECTION & RESCUE BACKGROUND ── */}
      <div
        className="absolute -inset-4 bg-cover bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/login-rescue-bg.jpg')",
          backgroundPosition: 'center 38%',
          filter: 'blur(3px)',
          transform: 'scale(1.03)',
        }}
      />

      {/* Atmospheric lighting gradients for depth and text legibility */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-slate-950/60" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/50" />

      {/* ── TOP HEADER: Official Brand Crest & Emergency Grid Status ── */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 sm:px-10 pt-6 flex items-center justify-between">
        {/* Brand Crest */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-200">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" opacity="0.25" />
              <path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6z" opacity="0.6" />
              <path d="M12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight drop-shadow-sm group-hover:text-cyan-300 transition-colors">
                Code Vortex
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                AegisNet Gateway
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium hidden sm:block drop-shadow-sm">
              Gujarat State Disaster Management Authority
            </p>
          </div>
        </Link>

        {/* Live Grid Status & Helpline */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/15 text-slate-200 text-xs shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">24/7 Grid Active</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400 font-mono font-bold">🚨 1077</span>
          </div>
        </div>
      </header>

      {/* ── MAIN VIEWPORT: Hero Brand Showcase on Left & Unified Glass Card on Right ── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 py-6 sm:py-8 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">

        {/* ── LEFT HERO: Command Mission, Metrics & Emergency Directory ── */}
        <div className="hidden lg:flex flex-col justify-center max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-cyan-400/30 text-white shadow-lg w-fit">
            <span className="text-sm">🛡️</span>
            <span className="text-xs font-bold font-mono tracking-widest uppercase text-cyan-300">
              Statewide Early Warning Network
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
            Detecting Disasters &amp;{' '}
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              Saving Lives
            </span>{' '}
            in Real Time
          </h1>

          <p className="text-slate-200 text-sm leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] max-w-lg font-medium">
            Edge-AI telemetry mesh continuously evaluating flood hydro-levels, air hazard plumes, and seismic tremors ahead of casualties across Gujarat State.
          </p>

          {/* Real-time Capability Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-left">
              <div className="text-cyan-400 font-mono font-black text-lg">&lt; 3.0s</div>
              <div className="text-[11px] text-slate-300 font-medium">Alert Propagation</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-left">
              <div className="text-emerald-400 font-mono font-black text-lg">LoRa Mesh</div>
              <div className="text-[11px] text-slate-300 font-medium">Zero-Cell Fallback</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-left">
              <div className="text-amber-400 font-mono font-black text-lg">2,140+</div>
              <div className="text-[11px] text-slate-300 font-medium">Edge Nodes Deployed</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT HERO: Sleek Unified Frosted Glass Sign-In Box ── */}
        <div className="w-full sm:max-w-md lg:max-w-[430px] mx-auto lg:mx-0">
          <div className="w-full bg-slate-900/65 hover:bg-slate-900/75 backdrop-blur-2xl border border-white/20 hover:border-white/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] space-y-5 transition-all">

            {/* Box Header Row: Back to Landing Button INSIDE the Box + Agency Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/50 text-xs font-semibold text-slate-200 hover:text-white transition-all group shadow-xs cursor-pointer"
                title="Return to Landing Page"
              >
                <span className="text-cyan-400 group-hover:-translate-x-1 transition-transform font-bold text-sm">
                  ←
                </span>
                <span>Back to Landing</span>
              </Link>

              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Agency Portal
              </span>
            </div>

            {/* Title Section */}
            <div className="space-y-1 text-left">
              <h2 className="text-white text-2xl font-extrabold tracking-tight drop-shadow-sm">
                Command Center Access
              </h2>
              <p className="text-slate-300 text-xs font-medium">
                Enter authorized agency credentials for live dispatch.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Authority Role &amp; Jurisdiction
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-white/[0.09] border border-white/20 hover:border-white/30 rounded-2xl px-4 py-2.5 text-xs text-white font-semibold focus:bg-slate-900/95 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all appearance-none cursor-pointer shadow-inner backdrop-blur-md"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-300 text-xs font-bold">
                    ▾
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="officer@agency.gov.in"
                  className="w-full bg-white/[0.09] border border-white/20 hover:border-white/30 rounded-2xl px-4 py-2.5 text-xs text-white font-semibold placeholder-slate-400 focus:bg-slate-900/90 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all shadow-inner backdrop-blur-md"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-[11px] text-cyan-300 hover:text-cyan-200 font-bold transition-colors cursor-pointer"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/[0.09] border border-white/20 hover:border-white/30 rounded-2xl px-4 py-2.5 text-xs text-white font-semibold placeholder-slate-400 focus:bg-slate-900/90 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all shadow-inner backdrop-blur-md"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-200 flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-1"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Authority Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate &amp; Enter Command Center</span>
                    <span className="group-hover:translate-x-1 transition-transform text-sm">→</span>
                  </>
                )}
              </button>
            </form>

            {/* Citizen Portal Boxed Card inside the Box */}
            <div className="pt-2 border-t border-white/15">
              <div className="rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/15 p-3.5 transition-all text-left flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">📢</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Public Citizen Portal</div>
                    <div className="text-[11px] text-slate-300 truncate">Live advisories, AQI &amp; shelters</div>
                  </div>
                </div>
                <Link
                  to="/public"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all shrink-0 hover:scale-105 cursor-pointer"
                >
                  View Advisories →
                </Link>
              </div>
            </div>

            {/* Official Security Footnote */}
            <div className="text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1.5 pt-1">
              <span>🔒</span>
              <span>256-Bit Encrypted · GSDMA State Disaster Authority</span>
            </div>

          </div>
        </div>

      </main>

    </div>
  )
}
