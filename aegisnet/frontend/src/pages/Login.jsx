// pages/Login.jsx — AegisNet Command Gateway · Full-Screen Auth · No Navbar
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
    }, 800)
  }

  const handleDemoBypass = () => {
    setLoading(true)
    setTimeout(() => {
      setAuth(
        {
          id: 1,
          name: 'Duty Chief (GSDMA)',
          email: 'authority@aegisnet.local',
          role: 'GSDMA Officer',
          agency: 'State Emergency Operation Center (SEOC)',
        },
        'demo-jwt-token'
      )
      navigate('/dashboard')
    }, 400)
  }

  return (
    <div className="min-h-screen flex font-sans overflow-hidden">

      {/* ── LEFT PANEL — Dark Command Branding ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">

        {/* Background dot mesh */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Subtle glow accent */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-900/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand */}
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-900/50">
              🛡️
            </div>
            <div>
              <div className="text-white text-xl font-bold tracking-tight leading-none">
                Aegis<span className="text-emerald-400">Net</span>
              </div>
              <div className="text-slate-400 text-[11px] font-mono tracking-widest uppercase mt-0.5">
                GSDMA Sentinel Mesh
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">
              AI-Powered<br />
              <span className="text-emerald-400">Environmental</span><br />
              Monitoring Network
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Real-time edge intelligence for floods, forest fires, air &amp; chemical hazards — covering the Gujarat State Grid.
            </p>
          </div>

          {/* Feature pillars */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: '⚡', label: 'Sub-5s edge detection', sub: 'LoRa mesh fallback · 0% WAN lock-in' },
              { icon: '🌐', label: `${nodes.length || 15} Sentinel Nodes Active`, sub: 'Gandhinagar · Ahmedabad · Surat · Vadodara' },
              { icon: '🤖', label: 'Edge-AI Risk Correlation', sub: 'Qualcomm hardware inference · NDRF dispatch' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-lg leading-none mt-0.5 flex-shrink-0">{icon}</span>
                <div>
                  <div className="text-white text-xs font-semibold">{label}</div>
                  <div className="text-slate-400 text-[11px] font-mono mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Live grid + track info */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/50">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <div className="text-emerald-400 text-xs font-bold font-mono tracking-wide">LIVE GRID ACTIVE</div>
              <div className="text-slate-300 text-[11px] font-mono mt-0.5">
                {nodes.length || 15} nodes · 868 MHz LoRa mesh · SIH26178
              </div>
            </div>
          </div>
          <div className="text-slate-600 text-[11px] font-mono">
            SIH26178 · Qualcomm Hardware &amp; Edge-AI Track · Gujarat State Grid
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Authentication Form ──────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col">

        {/* Mobile brand strip */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-base">🛡️</div>
            <span className="text-slate-900 font-bold text-sm">
              AegisNet <span className="text-emerald-700">GSDMA</span>
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-semibold transition-colors"
          >
            <span>←</span>
            <span>Landing Page</span>
          </Link>
        </div>

        {/* Vertically centered form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm space-y-6">

            {/* Back to Landing Page */}
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-all group"
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 bg-slate-50 group-hover:border-emerald-500 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-700 transition-all shadow-xs">
                  ←
                </span>
                <span>Back to Landing Page</span>
              </Link>
            </div>

            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-slate-900 text-2xl font-bold tracking-tight">Agency Sign In</h1>
              <p className="text-slate-500 text-sm">
                Server-enforced RBAC · Authorized personnel only.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Official Gov Email / User ID
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@gsdma.gov.in"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Access Passcode / Security Key
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 pr-11 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-base leading-none transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Designated Agency Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-colors appearance-none cursor-pointer"
                >
                  {ROLES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white font-semibold py-3 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  'Authenticate with Digital Credentials →'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Demo bypass */}
            <div className="space-y-3">
              <button
                onClick={handleDemoBypass}
                disabled={loading}
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span>🚀</span>
                <span>Enter 3-Node Room Demo Mode (Instant Bypass)</span>
              </button>

              <div className="text-center">
                <Link
                  to="/public"
                  className="text-xs text-emerald-700 hover:text-emerald-900 hover:underline underline-offset-2 transition-colors"
                >
                  View Public Citizen Portal — No Login Required →
                </Link>
              </div>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-sm flex-shrink-0 mt-0.5">🔒</span>
              <p className="text-[11px] text-slate-500 leading-snug">
                256-bit encrypted · Sessions expire after 8 hours of inactivity. Authorized for GSDMA, AMC/SMC/VMC, NDRF, and Gujarat Police personnel only.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">AegisNet v2.0 · SIH26178</span>
          <span className="text-[11px] text-slate-400">© 2026 GSDMA Sentinel Initiative</span>
        </div>
      </div>
    </div>
  )
}

