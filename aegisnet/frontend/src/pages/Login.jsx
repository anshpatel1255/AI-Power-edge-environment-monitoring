// pages/Login.jsx — AegisNet Command Gateway · Disaster Detection Photo BG & Frosted Glass Auth
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, useStore } from '../store/useStore'

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
  const nodes     = useStore((s)    => s.nodes)

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
    <div className="relative min-h-screen font-sans overflow-hidden bg-slate-950 flex flex-col justify-between">

      {/* ── CINEMATIC SYSTEM DETECTION & RESCUE BACKGROUND WITH SLIGHT BLUR ── */}
      <div
        className="absolute -inset-4 bg-cover bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: "url('/login-rescue-bg.jpg')",
          backgroundPosition: 'center 38%',
          filter: 'blur(3px)',
          transform: 'scale(1.03)',
        }}
      />

      {/* Subtle atmospheric vignette so the artwork shines through with depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-950/45 via-transparent to-slate-950/35" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/30" />

      {/* ── TOP HEADER BAR: AegisNet Brand on Left & Sleek Back Button on Right ── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 pt-6 pb-2 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-cyan-400/50 transition-all">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <span>AegisNet</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                GSDMA
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">State Emergency Operations Center</div>
          </div>
        </Link>

        {/* Repositioned Back to Landing Page Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-cyan-400/50 text-xs font-semibold text-white transition-all backdrop-blur-md shadow-lg group cursor-pointer hover:shadow-cyan-500/20"
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center bg-white/15 text-white group-hover:-translate-x-0.5 transition-transform font-bold text-xs">
            ←
          </span>
          <span>Back to Landing Page</span>
        </Link>
      </header>

      {/* ── MAIN VIEWPORT: Minimalist Brand & Live Metrics on Left, Glass Sign-In Card on Right ── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 sm:px-12 py-6 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 my-auto">

        {/* ── LEFT HERO: Command Mission & Live Edge Status ── */}
        <div className="hidden lg:flex flex-col justify-center max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-white shadow-lg w-fit">
            <span className="text-base">🛡️</span>
            <span className="text-xs font-bold font-mono tracking-widest uppercase text-cyan-300">
              AegisNet Command Gateway
            </span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            Detecting Disasters &amp; Saving Lives in Real Time
          </h1>

          <p className="text-slate-200 text-sm font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] max-w-lg">
            Edge-AI telemetry alerting rescue agencies ahead of flash floods, industrial toxic leaks, and wildfires across Gujarat State.
          </p>

          {/* 3 Live Telemetry Micro-Badges */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/55 border border-white/15 backdrop-blur-md rounded-2xl p-3 shadow-md space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Edge Grid
                </span>
              </div>
              <div className="text-sm font-black text-white">15 Active Nodes</div>
            </div>

            <div className="bg-slate-900/55 border border-white/15 backdrop-blur-md rounded-2xl p-3 shadow-md space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  AI Model
                </span>
              </div>
              <div className="text-sm font-black text-white">QNN TFLite v2.4</div>
            </div>

            <div className="bg-slate-900/55 border border-white/15 backdrop-blur-md rounded-2xl p-3 shadow-md space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  Forecast
                </span>
              </div>
              <div className="text-sm font-black text-white">2h Ahead Crest</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIGN-IN CARD ── */}
        <div className="w-full sm:max-w-md lg:max-w-[420px] mx-auto lg:mx-0 my-auto">
          <div className="w-full bg-slate-900/65 hover:bg-slate-900/70 backdrop-blur-2xl border border-white/20 hover:border-white/30 rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] space-y-6 transition-all">

            {/* Header: TLS 1.3 / AES-256 removed completely */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 rounded-full backdrop-blur-md">
                  Agency Sign In
                </span>
              </div>
              <h2 className="text-white text-2xl font-extrabold tracking-tight pt-1 drop-shadow-sm">
                Command Center Access
              </h2>
              <p className="text-slate-200 text-xs font-medium">
                Enter your official credentials to access real-time dispatch.
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
                    className="w-full bg-white/[0.09] border border-white/20 hover:border-white/30 rounded-2xl px-4 py-3 text-xs text-white font-semibold focus:bg-slate-900/90 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all appearance-none cursor-pointer shadow-inner backdrop-blur-md"
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
                  className="w-full bg-white/[0.09] border border-white/20 hover:border-white/30 rounded-2xl px-4 py-3 text-xs text-white font-semibold placeholder-slate-300 focus:bg-white/[0.16] focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all shadow-inner backdrop-blur-md"
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
                  className="w-full bg-white/[0.09] border border-white/20 hover:border-white/30 rounded-2xl px-4 py-3 text-xs text-white font-semibold placeholder-slate-300 focus:bg-white/[0.16] focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all shadow-inner backdrop-blur-md"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-200 flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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

            {/* Public citizen advisory link */}
            <div className="text-center pt-2 border-t border-white/15">
              <Link
                to="/public"
                className="text-xs text-slate-300 hover:text-cyan-300 font-medium underline underline-offset-4 transition-colors"
              >
                Are you a citizen? View public disaster advisories →
              </Link>
            </div>

          </div>
        </div>

      </main>

      {/* ── SUBTLE BOTTOM FOOTER BAR ── */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
        <div>
          Gujarat State Disaster Management Authority (GSDMA) · SEOC
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Emergency Command: 1070 / 1077</span>
          <span>•</span>
          <Link to="/" className="text-slate-300 hover:text-cyan-300 underline underline-offset-2">
            Landing Page
          </Link>
        </div>
      </footer>

    </div>
  )
}
