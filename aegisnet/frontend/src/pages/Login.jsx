// pages/Login.jsx — Authority JWT login form with Earthy & Amber Theme

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, useStore } from '../store/useStore'
import client from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)
  const setMockMode = useStore((s) => s.setMockMode)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post('/api/auth/login', { email, password })
      setAuth(data.token, data.refreshToken, data.user)
      setMockMode(false)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setAuth(
      'demo-token',
      'demo-refresh',
      { id: 1, email: 'authority@aegisnet.local', role: 'authority', name: 'Disaster Relief Authority' }
    )
    navigate('/dashboard')
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 bg-[#141A16] text-[#EDEDE9]">
      <div className="w-full max-w-sm">
        {/* Logo badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0B3820] border-2 border-[#22C55E]/40 flex items-center justify-center mx-auto mb-3 shadow-xl">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-[#EDEDE9] tracking-tight">
            Aegis<span className="text-[#D97706]">Net</span>
          </h1>
          <p className="text-[#6B7280] text-xs mt-1 font-mono">
            Official Government & Authority Command Gateway
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#6B7280] block mb-1 font-mono">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="authority@aegisnet.local"
                required
                className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg px-3 py-2 text-xs text-[#EDEDE9] placeholder-[#6B7280] focus:outline-none focus:border-[#D97706] font-mono transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[#6B7280] block mb-1 font-mono">Access Key / Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg px-3 py-2 text-xs text-[#EDEDE9] placeholder-[#6B7280] focus:outline-none focus:border-[#D97706] font-mono transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[#EF4444]/20 border border-[#EF4444]/50 rounded-lg px-3 py-2 text-xs text-[#EF4444] font-mono">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-bold py-2.5 rounded-lg border border-[#2D3B2F] transition-all disabled:opacity-50 text-xs font-mono shadow-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In with Government Credentials'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#2D3B2F]" />
            <span className="text-[10px] text-[#6B7280] font-mono uppercase">or evaluators</span>
            <div className="flex-1 h-px bg-[#2D3B2F]" />
          </div>

          {/* Demo Mode Button in Amber Accent #D97706 */}
          <button
            onClick={handleDemoLogin}
            className="w-full bg-[#D97706] hover:bg-[#b45309] text-white font-bold text-xs py-2.5 rounded-lg transition-colors font-mono shadow-md flex items-center justify-center gap-1.5"
          >
            <span>🚀</span> Enter 3-Node Room Demo Mode
          </button>

          <div className="mt-4 pt-3 border-t border-[#2D3B2F] text-[10px] text-[#6B7280] text-center font-mono space-y-0.5">
            <div>Default authority: <span className="text-[#EDEDE9]">authority@aegisnet.local</span></div>
            <div>Password: <span className="text-[#EDEDE9]">demo1234</span></div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-[#6B7280] hover:text-[#D97706] transition-colors font-mono">
            ← Return to Live Public Map
          </Link>
        </div>
      </div>
    </div>
  )
}
