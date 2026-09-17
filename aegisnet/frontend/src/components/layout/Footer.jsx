// components/layout/Footer.jsx — Global Main Content Area Footer with Operationally-Critical Status
export default function Footer() {
  return (
    <footer className="h-12 bg-white border-t border-slate-200 px-4 lg:px-6 text-xs text-slate-500 font-sans flex items-center justify-between shadow-xs">
      {/* Left: Organization & SIH Track */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-900">AegisNet</span>
        <span className="hidden sm:inline text-slate-600">· GSDMA Integrated Environmental Mesh</span>
        <span className="hidden md:inline text-slate-400">(SIH26178 / Qualcomm Edge-AI)</span>
      </div>

      {/* Center: Persistent Live Operational Status */}
      <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span className="text-slate-700 font-semibold">Backend: Connected</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span>📡</span>
          <span className="text-slate-700 font-semibold">Mesh: LoRa 868MHz (Standby OK)</span>
        </div>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500 font-medium">Sync: &lt;2s ago</span>
      </div>

      {/* Right: Version & Links */}
      <div className="flex items-center gap-3 text-xs">
        <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
          v2.0.0
        </span>
        <span className="hidden sm:inline text-slate-400 font-mono">Build 2026.09</span>
      </div>
    </footer>
  )
}
