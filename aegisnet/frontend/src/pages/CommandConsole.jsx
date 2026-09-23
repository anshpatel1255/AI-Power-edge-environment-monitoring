// pages/CommandConsole.jsx — Agency Command Console & Multi-Agency Dispatch Board
// Matching exact visual styling, stepper timeline, Kanban board, and public advisory composer from user specification.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const KANBAN_STAGES = [
  { id: 'Not Notified', label: 'Not Notified', sub: 'T+0s', color: 'bg-slate-600', number: 1 },
  { id: 'Notified', label: 'Notified', sub: 'T+30s', color: 'bg-blue-600', number: 2 },
  { id: 'Acknowledged', label: 'Acknowledged', sub: 'SLA 5 min', color: 'bg-amber-500', number: 3 },
  { id: 'Responding', label: 'Responding', sub: 'SLA 15 min', color: 'bg-cyan-600', number: 4 },
  { id: 'On Scene', label: 'On Scene', sub: 'ETA tracked', color: 'bg-emerald-600', number: 5 },
]

export default function CommandConsole() {
  const storeDispatches       = useStore((s) => s.dispatches)
  const advanceDispatchStage  = useStore((s) => s.advanceDispatchStage)
  const escalateAllAgencies   = useStore((s) => s.escalateAllAgencies)
  const publishAdvisory       = useStore((s) => s.publishAdvisory)
  const setEmergencyModalData = useStore((s) => s.setEmergencyModalData)

  // Local state to allow full interactivity even with preset items
  const [localDispatches, setLocalDispatches] = useState([
    {
      id: 'd-1',
      agency: 'GVK EMRI Ambulance (108)',
      channel: 'EMRI DISPATCH API',
      officer: 'Standby Triage',
      timeNote: null,
      status: 'Not Notified',
      iconType: 'ambulance',
      highlight: false,
    },
    {
      id: 'd-2',
      agency: 'Municipal Corporation (AMC)',
      channel: 'SMS GATEWAY + EMAIL',
      officer: 'Pending Duty Engineer',
      timeNote: 'Notified 6 min ago',
      status: 'Notified',
      iconType: 'building',
      highlight: false,
    },
    {
      id: 'd-3',
      agency: 'GSDMA (State Disaster Authority)',
      channel: 'AUTOMATED SMS + VOIP BRIDGE',
      officer: 'Dy. Collector K. Patel',
      timeNote: "Ack'd 4 min ago",
      status: 'Acknowledged',
      iconType: 'dome',
      highlight: false,
    },
    {
      id: 'd-4',
      agency: 'Gujarat Police Control (100)',
      channel: 'POLICE WIRELESS TERMINAL',
      officer: 'PSI V. Zala',
      timeNote: "Ack'd 2 min ago",
      status: 'Acknowledged',
      iconType: 'police',
      highlight: true, // highlighted with amber border as shown in screenshot
    },
    {
      id: 'd-5',
      agency: 'Fire & Emergency Services (101)',
      channel: 'CAD DISPATCH WEBHOOK',
      officer: 'Station Officer S. Rathod',
      timeNote: 'En route · ETA 6 min',
      status: 'Responding',
      iconType: 'fire',
      highlight: false,
    },
  ])

  // Public advisory composer state matching screenshot
  const [advisoryZone, setAdvisoryZone] = useState('Narol–Vatva & Isanpur Zone (Ahmedabad)')
  const [advisoryEn, setAdvisoryEn] = useState(
    'Elevated industrial chemical vapors detected. Residents with respiratory conditions are advised to stay indoors with windows shut.'
  )
  const [advisoryGu, setAdvisoryGu] = useState(
    'નારોલ-વટવા વિસ્તારમાં ઔદ્યોગિક રાસાયણિક બાષ્પ નોંધાયો છે. શ્વસનતંત્રની તકલીફ ધરાવતા લોકોને ઘરની અંદર રહેવા અને બારીઓ બંધ રાખવા વિનંતી છે.'
  )
  const [advisoryHi, setAdvisoryHi] = useState(
    'नारोल-वटवा क्षेत्र में औद्योगिक रासायनिक वाष्प पाई गई है। श्वसन संबंधी समस्या वाले नागरिकों से घर के भीतर रहने का अनुरोध है।'
  )
  const [advisoryPublished, setAdvisoryPublished] = useState(false)

  // Incident log state matching screenshot
  const [incidentNotes, setIncidentNotes] = useState([
    {
      id: 1,
      dotColor: 'bg-amber-400',
      user: 'GSDMA Dispatcher',
      time: '12 min ago',
      text: 'Incident opened. Auto-correlation confirmed across 2 adjacent nodes.',
    },
    {
      id: 2,
      dotColor: 'bg-red-500',
      user: 'Station Officer (Fire)',
      time: '8 min ago',
      text: 'HAZMAT Unit 3 mobilized towards Vatva Phase II.',
    },
    {
      id: 3,
      dotColor: 'bg-blue-500',
      user: 'Traffic Police Cell',
      time: '3 min ago',
      text: 'Diverting heavy vehicles from Vatva canal crossing.',
    },
  ])
  const [newNote, setNewNote] = useState('')

  // Advance single agency to next stage
  const handleAdvanceStage = (agencyId) => {
    const stageOrder = ['Not Notified', 'Notified', 'Acknowledged', 'Responding', 'On Scene']
    setLocalDispatches((prev) =>
      prev.map((item) => {
        if (item.id === agencyId || item.agency === agencyId) {
          const currIdx = stageOrder.indexOf(item.status)
          const nextIdx = Math.min(stageOrder.length - 1, currIdx + 1)
          return {
            ...item,
            status: stageOrder[nextIdx],
            timeNote: nextIdx === 4 ? 'Arrived on scene' : 'Just advanced',
          }
        }
        return item
      })
    )
    if (advanceDispatchStage) {
      advanceDispatchStage(agencyId)
    }
  }

  // Escalate all agencies
  const handleEscalateAll = () => {
    setLocalDispatches((prev) =>
      prev.map((item) => {
        if (item.status === 'Not Notified') {
          return { ...item, status: 'Notified', timeNote: 'Escalated now' }
        }
        if (item.status === 'Notified') {
          return { ...item, status: 'Acknowledged', timeNote: 'Auto-acknowledged' }
        }
        if (item.status === 'Acknowledged') {
          return { ...item, status: 'Responding', timeNote: 'Mobilized immediately' }
        }
        return item
      })
    )
    if (escalateAllAgencies) {
      escalateAllAgencies()
    }
  }

  // Handle add note
  const handleAddNote = (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setIncidentNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        dotColor: 'bg-blue-500',
        user: 'Duty Officer (GSDMA)',
        time: 'Just now',
        text: newNote.trim(),
      },
    ])
    setNewNote('')
  }

  // Publish advisory
  const handlePublishAdvisory = () => {
    if (setEmergencyModalData) {
      setEmergencyModalData({
        title: 'Authorize & Broadcast Public Advisory',
        message:
          'This will broadcast the trilingual emergency warning to citizen cell broadcasts, web portal, and public sirens across Narol-Vatva & Isanpur Zone.',
        requireTyped: false,
        onConfirm: () => {
          if (publishAdvisory) {
            publishAdvisory({
              zone: advisoryZone,
              severity: 'warning',
              en: { title: 'Chemical Vapor Plume Watch', message: advisoryEn, action: 'Stay indoors with windows shut.' },
              gu: { title: 'ઔદ્યોગિક વાયુ ચેતવણી', message: advisoryGu, action: 'ઘરમાં રહો અને બારીઓ બંધ રાખો.' },
              hi: { title: 'औद्योगिक गैस चेतावनी', message: advisoryHi, action: 'घर के भीतर रहें और खिड़कियां बंद रखें।' },
            })
          }
          setAdvisoryPublished(true)
          setTimeout(() => setAdvisoryPublished(false), 3000)
        },
      })
    } else {
      setAdvisoryPublished(true)
      setTimeout(() => setAdvisoryPublished(false), 3000)
    }
  }

  // Resolve incident
  const handleResolveIncident = () => {
    if (setEmergencyModalData) {
      setEmergencyModalData({
        title: 'Resolve & Archive Incident ALT-101',
        message: 'Confirm that industrial chemical vapor levels have decayed to baseline and all agencies are demobilized.',
        requireTyped: true,
        onConfirm: () => {
          alert('Incident ALT-101 has been marked resolved and archived to system audit.')
        },
      })
    } else {
      alert('Incident ALT-101 has been marked resolved and archived to system audit.')
    }
  }

  // Render Agency Icon based on type
  const renderAgencyIcon = (type) => {
    switch (type) {
      case 'ambulance':
        return (
          <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="16" height="13" rx="2" />
              <path d="M17 9l4 2v6h-4" />
              <circle cx="6" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
              <path d="M9 8v4M7 10h4" />
            </svg>
          </div>
        )
      case 'building':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
            </svg>
          </div>
        )
      case 'dome':
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M3 10h18M12 2l9 5H3l9-5zM6 10v11M10 10v11M14 10v11M18 10v11" />
            </svg>
          </div>
        )
      case 'police':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 16H9m10 0h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-3l-2-4H8L6 9H3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1" />
              <circle cx="6.5" cy="16.5" r="2.5" />
              <circle cx="16.5" cy="16.5" r="2.5" />
              <path d="M12 3v3" />
            </svg>
          </div>
        )
      case 'fire':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6 space-y-6 font-sans">

      {/* ─── Top Breadcrumb ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 font-sans">
        <Link to="/alerts" className="text-blue-600 hover:text-blue-700 hover:underline">
          Alerts Queue
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">Command Console</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500 font-mono">ALT-101</span>
      </div>

      {/* ─── 1. Active Command Incident Banner Card ───────────────────────── */}
      <div className="bg-white border border-red-100/90 rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(239,68,68,0.06)] relative overflow-hidden transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

          {/* Left: Biohazard Squircle + Info */}
          <div className="flex items-start gap-4">
            {/* Biohazard Squircle Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-red-600 flex items-center justify-center text-amber-300 shadow-md shadow-red-500/25 flex-shrink-0">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="2.5" />
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 0 1 7.15 4.42l-3.58 2.07A4 4 0 0 0 12 8a4 4 0 0 0-3.57 2.49L4.85 8.42A8 8 0 0 1 12 4zm-8 8a7.92 7.92 0 0 1 .85-3.58l3.58 2.07A4 4 0 0 0 8 12a4 4 0 0 0 1.5 3.12l-3.58 2.07A7.92 7.92 0 0 1 4 12zm8 8a8 8 0 0 1-7.15-4.42l3.58-2.07A4 4 0 0 0 12 16a4 4 0 0 0 3.57-2.49l3.58 2.07A8 8 0 0 1 12 20zm8-8a7.92 7.92 0 0 1-.85 3.58l-3.58-2.07A4 4 0 0 0 16 12a4 4 0 0 0-1.5-3.12l3.58-2.07A7.92 7.92 0 0 1 20 12z" />
              </svg>
            </div>

            <div>
              {/* Top Meta Details Strip */}
              <div className="flex items-center gap-3.5 flex-wrap text-xs font-sans">
                <span className="text-red-600 font-extrabold tracking-wider flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  ACTIVE COMMAND INCIDENT · ALT-101
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">
                  Confidence <strong className="font-extrabold text-slate-900 ml-0.5">86.4%</strong>
                </span>
                <span className="text-slate-500">
                  Duration <strong className="font-extrabold text-slate-900 ml-0.5">12 min</strong>
                </span>
                <span className="text-slate-500">
                  Commander <strong className="font-extrabold text-slate-900 ml-0.5">Dy. Collector K. Patel</strong>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 leading-snug">
                Elevated Volatile Organic Chemical Plume
              </h1>

              {/* Zone */}
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                <span className="text-rose-500">📍</span>
                <span>Zone: <strong className="text-slate-700">Narol–Vatva GIDC Industrial Corridor, Ahmedabad</strong></span>
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleResolveIncident}
              className="px-5 py-2.5 rounded-2xl border border-slate-300/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>✓</span>
              <span>Resolve &amp; Archive</span>
            </button>

            <button
              type="button"
              onClick={handleEscalateAll}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-bold transition-all shadow-md shadow-red-500/25 flex items-center gap-1.5 cursor-pointer hover:scale-102"
            >
              <span>⚡</span>
              <span>Escalate All Agencies</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Multi-Agency Dispatch Board (Automated SLA Flow) ───────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] space-y-7 font-sans">

        {/* Board Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
                <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
                <circle cx="12" cy="12" r="2" />
                <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                Multi-Agency Dispatch Board <span className="font-normal text-slate-500 text-sm">(Automated SLA Flow)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Live status tracking across GSDMA, Fire, Municipal, Police, and EMS units
              </p>
            </div>
          </div>

          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full px-3.5 py-1 text-xs font-bold font-sans flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>SLA Engine Active</span>
          </span>
        </div>

        {/* ─── Top 5-Stage Stepper Progress Line ────────────────────────────── */}
        <div className="grid grid-cols-5 gap-2 items-center pt-2">
          {KANBAN_STAGES.map((st, idx) => (
            <div key={st.id} className="relative flex flex-col items-center">
              {/* Connector lines between nodes */}
              {idx < KANBAN_STAGES.length - 1 && (
                <div
                  className={clsx(
                    'absolute top-3.5 left-1/2 w-full h-[3px] -z-0 pointer-events-none rounded-full',
                    idx === 0 || idx === 1 ? 'bg-blue-500' : 'bg-slate-200'
                  )}
                />
              )}

              {/* Number Circle */}
              <div
                className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white z-10 shadow-xs transition-transform',
                  st.color
                )}
              >
                {st.number}
              </div>

              {/* Stage label and timing */}
              <div className="mt-2 text-center">
                <div className="text-xs font-bold text-slate-800 leading-tight">{st.label}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{st.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── 5-Column Kanban Board ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {KANBAN_STAGES.map((stage) => {
            const items = localDispatches.filter((d) => d.status === stage.id)

            return (
              <div
                key={stage.id}
                className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between min-h-[340px] space-y-3"
              >
                <div>
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3">
                    <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/70 shadow-2xs">
                      {items.length}
                    </span>
                  </div>

                  {/* Cards inside Column */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={clsx(
                          'rounded-2xl p-4 transition-all space-y-3 shadow-xs hover:shadow-sm',
                          item.highlight
                            ? 'bg-amber-50/30 border-2 border-amber-300 shadow-amber-500/10'
                            : 'bg-white border border-slate-200/90 hover:border-slate-300'
                        )}
                      >
                        {/* Agency Icon & Title */}
                        <div className="flex items-start gap-2.5">
                          {renderAgencyIcon(item.iconType)}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {item.agency}
                            </h4>
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight mt-0.5">
                              {item.channel}
                            </p>
                          </div>
                        </div>

                        {/* Officer & Timestamp */}
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          {item.officer && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                              <span>👤</span>
                              <span>{item.officer}</span>
                            </div>
                          )}
                          {item.timeNote && (
                            <div className="text-[10px] text-slate-400 font-sans">
                              {item.timeNote}
                            </div>
                          )}
                        </div>

                        {/* Advance Stage Button */}
                        <button
                          type="button"
                          onClick={() => handleAdvanceStage(item.id)}
                          className="w-full bg-blue-50/80 hover:bg-blue-100/90 text-blue-600 text-xs font-bold py-1.5 px-3 rounded-xl border border-blue-100 transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Advance Stage</span>
                          <span>→</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Empty State */}
                {items.length === 0 && (
                  <div className="h-full min-h-[220px] rounded-2xl border border-dashed border-slate-200/90 flex flex-col items-center justify-center p-6 text-center">
                    <svg className="w-8 h-8 text-slate-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" fill="currentColor" opacity="0.3" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" fill="currentColor" opacity="0.3" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span className="text-xs text-slate-400 font-medium">No agencies in stage</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>

      {/* ─── 3. Split: Public Advisory Composer & Operational Incident Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left Column: Public Advisory Composer ── */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] space-y-4 font-sans flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                  🔔
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Public Advisory Composer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review and approve citizen warning before pushing to public portal
                  </p>
                </div>
              </div>
              <Link
                to="/public"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>Open Public Portal</span>
                <span>↗</span>
              </Link>
            </div>

            {/* Field 1: Affected Locality / Zone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Affected locality / zone
              </label>
              <input
                type="text"
                value={advisoryZone}
                onChange={(e) => setAdvisoryZone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>

            {/* Field 2: English Advisory Text (Left Blue Accent) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                English advisory text (plain language)
              </label>
              <textarea
                rows={2}
                value={advisoryEn}
                onChange={(e) => setAdvisoryEn(e.target.value)}
                className="w-full bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-300 resize-none font-medium leading-relaxed shadow-2xs"
              />
            </div>

            {/* Field 3: Gujarati Translation (Left Amber Accent) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                <span>Gujarati translation (ગુજરાતી)</span>
                <span className="text-amber-500 text-[11px] font-semibold flex items-center gap-1">
                  <span>✨</span>
                  <span>AI-translated — please review</span>
                </span>
              </label>
              <textarea
                rows={2}
                value={advisoryGu}
                onChange={(e) => setAdvisoryGu(e.target.value)}
                className="w-full bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-slate-300 resize-none font-medium leading-relaxed shadow-2xs"
              />
            </div>

            {/* Field 4: Hindi Translation (Left Cyan Accent) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                <span>Hindi translation (हिन्दी)</span>
                <span className="text-amber-500 text-[11px] font-semibold flex items-center gap-1">
                  <span>✨</span>
                  <span>AI-translated — please review</span>
                </span>
              </label>
              <textarea
                rows={2}
                value={advisoryHi}
                onChange={(e) => setAdvisoryHi(e.target.value)}
                className="w-full bg-white border border-slate-200 border-l-4 border-l-cyan-500 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-slate-300 resize-none font-medium leading-relaxed shadow-2xs"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handlePublishAdvisory}
              className="w-full h-11 bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.005]"
            >
              <span>📢</span>
              <span>
                {advisoryPublished ? '✓ Advisory Broadcasted to Public Portal!' : 'Authorize & Broadcast Public Advisory'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Right Column: Shared Multi-Agency Incident Log ── */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] space-y-4 font-sans flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                📜
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Shared Multi-Agency Incident Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live operational audit entries visible across Police, Fire, Municipal, and GSDMA
                </p>
              </div>
            </div>

            {/* Timeline Notes List */}
            <div className="space-y-4 pt-3 max-h-[380px] overflow-y-auto pr-1">
              {incidentNotes.map((note) => (
                <div key={note.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={clsx('w-2.5 h-2.5 rounded-full inline-block', note.dotColor)} />
                      <span className="font-bold text-slate-900">{note.user}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-sans">{note.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 pl-4 leading-relaxed font-normal">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form to Post New Update */}
          <form onSubmit={handleAddNote} className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an operational update to the incident record..."
              className="flex-1 bg-slate-50/80 border border-slate-200 rounded-full px-5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer flex-shrink-0"
            >
              Post
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}
