// pages/CommandConsole.jsx — Agency Command Console & Multi-Agency Dispatch Kanban Board
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const KANBAN_STAGES = ['Not Notified', 'Notified', 'Acknowledged', 'Responding', 'On Scene']

export default function CommandConsole() {
  const dispatches = useStore((s) => s.dispatches)
  const advanceDispatchStage = useStore((s) => s.advanceDispatchStage)
  const escalateAllAgencies = useStore((s) => s.escalateAllAgencies)
  const publishAdvisory = useStore((s) => s.publishAdvisory)
  const setEmergencyModalData = useStore((s) => s.setEmergencyModalData)
  const alerts = useStore((s) => s.alerts)

  const activeAlert = alerts[0] || {
    id: 'ALT-101',
    title: 'Elevated Industrial Volatile Organic Plume',
    severity: 'warning',
    location: 'Narol-Vatva GIDC Industrial Corridor, Ahmedabad',
    confidence_pct: 89.4,
    timestamp: '12 min ago',
    category: 'chem',
  }

  // Public advisory composer state
  const [advisoryZone, setAdvisoryZone] = useState('Narol-Vatva & Isanpur Zone (Ahmedabad)')
  const [advisoryEn, setAdvisoryEn] = useState(
    'Elevated industrial chemical vapors detected. Residents with respiratory conditions are advised to stay indoors with windows shut.'
  )
  const [advisoryGu, setAdvisoryGu] = useState(
    'નારોલ-વટવા વિસ્તારમાં ઔદ્યોગિક વાયુ પ્રદૂષણ નોંધાયું છે. નાગરિકોને ઘરમાં રહેવા અને બારીઓ બંધ રાખવા વિનંતી છે.'
  )
  const [advisoryHi, setAdvisoryHi] = useState(
    'नारोल-वटवा क्षेत्र में औद्योगिक वाष्प दर्ज किया गया है। नागरिक घर के भीतर रहें और खिड़कियां बंद रखें।'
  )
  const [advisoryPublished, setAdvisoryPublished] = useState(false)

  // Incident log state
  const [incidentNotes, setIncidentNotes] = useState([
    { id: 1, time: '12 min ago', user: 'GSDMA Dispatcher', text: 'Incident opened. Auto-correlation confirmed across 2 adjacent nodes.' },
    { id: 2, time: '8 min ago', user: 'Station Officer (Fire)', text: 'HAZMAT Unit 3 mobilized towards Vatva Phase II.' },
    { id: 3, time: '3 min ago', user: 'Traffic Police Cell', text: 'Diverting heavy vehicles from Vatva canal crossing.' },
  ])
  const [newNote, setNewNote] = useState('')

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setIncidentNotes([
      { id: Date.now(), time: 'Just now', user: 'Command Officer', text: newNote.trim() },
      ...incidentNotes,
    ])
    setNewNote('')
  }

  const handlePublishAdvisory = () => {
    setEmergencyModalData({
      title: 'Authorize Public Advisory Publication',
      message:
        'This will immediately push the multilingual public advisory live to the citizen safety portal and send push notifications to registered zone residents.',
      requireTyped: false,
      onConfirm: () => {
        publishAdvisory({
          zone: advisoryZone,
          severity: activeAlert.severity,
          en: { title: activeAlert.title, message: advisoryEn, action: 'Wear N95 masks • Avoid outdoor physical exercise.' },
          gu: { title: 'ઔદ્યોગિક ચેતવણી', message: advisoryGu, action: 'N95 માસ્ક પહેરો • બહાર નીકળવાનું ટાળો.' },
          hi: { title: 'औद्योगिक चेतावनी', message: advisoryHi, action: 'N95 मास्क पहनें • बाहर जाने से बचें।' },
        })
        setAdvisoryPublished(true)
        setTimeout(() => setAdvisoryPublished(false), 3000)
      },
    })
  }

  const handleResolveIncident = () => {
    setEmergencyModalData({
      title: 'Resolve & Archive Incident',
      message: 'Confirm that hazardous conditions have normalized and all field teams have concluded emergency operations.',
      requireTyped: true,
      onConfirm: () => {
        alert('Incident archived to historical audit registry.')
      },
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">
      {/* ─── 1. Incident Command Header Strip ───────────────────────────── */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FDECEC] text-[#C62828] flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-xs">
              🎛️
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#FDECEC] text-[#C62828] border border-[#C62828]/30 animate-pulse">
                  ACTIVE COMMAND INCIDENT: {activeAlert.id}
                </span>
                <span className="text-xs text-[#475569] font-mono">
                  Confidence: <b className="text-[#0B6E4F]">{activeAlert.confidence_pct}%</b>
                </span>
                <span className="text-xs text-[#475569] font-mono">
                  Duration: <b>{activeAlert.timestamp}</b>
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] mt-1">{activeAlert.title}</h1>
              <p className="text-xs text-[#475569] font-mono flex items-center gap-1.5 mt-0.5">
                <span>📍 Zone:</span>
                <span className="text-[#0F172A] font-semibold">{activeAlert.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={escalateAllAgencies}
              className="bg-[#C62828] hover:bg-[#b71c1c] text-white text-xs font-bold font-mono px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <span>⚡</span> Escalate All Agencies
            </button>
            <button
              onClick={handleResolveIncident}
              className="bg-white hover:bg-[#F7F9FB] border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] text-xs font-bold font-mono px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Resolve & Archive
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Multi-Agency Dispatch Board (Kanban) ─────────────────────── */}
      <div className="bg-white border border-[#E3E8EF] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase font-mono tracking-wide">
              Multi-Agency Dispatch Board (Automated SLA Flow)
            </h2>
            <p className="text-xs text-[#475569]">
              Live status tracking across GSDMA, Fire, Municipal, Police, and EMS units
            </p>
          </div>
          <span className="text-xs text-[#0B6E4F] font-mono font-bold bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
            SLA Engine Active
          </span>
        </div>

        {/* Kanban Table / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {KANBAN_STAGES.map((stage) => {
            const items = dispatches.filter((d) => d.status === stage)

            return (
              <div
                key={stage}
                className="bg-[#F7F9FB] border border-[#E3E8EF] rounded-xl p-3 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#E3E8EF] mb-2.5">
                    <span className="text-xs font-bold font-mono text-[#0F172A]">{stage}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#475569] font-bold">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.agency}
                        className="bg-white border border-[#CBD5E1] rounded-lg p-2.5 shadow-xs text-xs space-y-1.5"
                      >
                        <div className="font-bold text-[#0F172A] leading-tight">{item.agency}</div>
                        <div className="text-[10px] text-[#475569] font-mono">{item.channel}</div>
                        {item.officer && (
                          <div className="text-[10px] text-[#0B6E4F] font-mono font-semibold">
                            👤 {item.officer}
                          </div>
                        )}
                        <button
                          onClick={() => advanceDispatchStage(item.agency)}
                          className="w-full mt-1 bg-[#EEF2F6] hover:bg-[#E8F5E9] text-[#0B6E4F] text-[10px] font-mono font-bold py-1 rounded border border-[#CBD5E1] transition-colors"
                        >
                          Advance Stage →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {items.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-[#94A3B8] font-mono">
                    No agencies in stage
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 3. Split: Public Advisory Composer & Operational Incident Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Public Advisory Composer */}
        <div className="bg-white border border-[#E3E8EF] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3E8EF] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <span>🌐</span> Public Advisory Composer (Human-in-the-Loop)
              </h3>
              <p className="text-xs text-[#475569]">
                Review and approve citizen warning before pushing to public portal
              </p>
            </div>
            <Link
              to="/public"
              target="_blank"
              className="text-xs text-[#0B84C9] hover:underline font-mono font-bold"
            >
              Open Public Portal ↗
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#475569] font-mono block mb-1 font-bold">Affected Locality / Zone</label>
              <input
                type="text"
                value={advisoryZone}
                onChange={(e) => setAdvisoryZone(e.target.value)}
                className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A] font-medium"
              />
            </div>

            <div>
              <label className="text-[#475569] font-mono block mb-1 font-bold">
                English Advisory Text (Plain Language)
              </label>
              <textarea
                rows={2}
                value={advisoryEn}
                onChange={(e) => setAdvisoryEn(e.target.value)}
                className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
              />
            </div>

            <div>
              <label className="text-[#475569] font-mono block mb-1 font-bold">
                Gujarati Translation (ગુજરાતી)
              </label>
              <textarea
                rows={2}
                value={advisoryGu}
                onChange={(e) => setAdvisoryGu(e.target.value)}
                className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
              />
            </div>

            <div>
              <label className="text-[#475569] font-mono block mb-1 font-bold">
                Hindi Translation (हिन्दी)
              </label>
              <textarea
                rows={2}
                value={advisoryHi}
                onChange={(e) => setAdvisoryHi(e.target.value)}
                className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
              />
            </div>

            <button
              onClick={handlePublishAdvisory}
              className="w-full bg-[#0B6E4F] hover:bg-[#08573F] text-white font-bold py-2.5 rounded-xl font-mono transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>📢</span>
              <span>{advisoryPublished ? '✓ Advisory Broadcasted!' : 'Authorize & Broadcast Public Advisory'}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Operational Incident Log */}
        <div className="bg-white border border-[#E3E8EF] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E3E8EF] pb-3 mb-3">
              <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                <span>📝</span> Shared Multi-Agency Incident Log
              </h3>
              <p className="text-xs text-[#475569]">
                Live operational audit entries visible across Police, Fire, Municipal, and GSDMA
              </p>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {incidentNotes.map((note) => (
                <div key={note.id} className="bg-[#F7F9FB] border border-[#E3E8EF] p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#475569]">
                    <span className="font-bold text-[#0B6E4F]">{note.user}</span>
                    <span>{note.time}</span>
                  </div>
                  <p className="text-[#0F172A]">{note.text}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddNote} className="pt-3 border-t border-[#E3E8EF] flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an operational update to the incident record..."
              className="flex-1 bg-[#F7F9FB] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0B6E4F]"
            />
            <button
              type="submit"
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2 rounded-xl text-xs font-mono font-bold transition-colors shadow-xs"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
