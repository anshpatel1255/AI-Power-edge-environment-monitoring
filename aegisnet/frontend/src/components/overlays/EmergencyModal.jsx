// components/overlays/EmergencyModal.jsx — Irreversible Action Confirmation Dialog
import { useState } from 'react'
import { useStore } from '../../store/useStore'

export default function EmergencyModal() {
  const modalData = useStore((s) => s.emergencyModalData)
  const setModalData = useStore((s) => s.setEmergencyModalData)
  const [confirmText, setConfirmText] = useState('')

  if (!modalData) return null

  const handleConfirm = () => {
    if (modalData.requireTyped && confirmText.trim().toUpperCase() !== 'CONFIRM') return
    modalData.onConfirm()
    setModalData(null)
    setConfirmText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="bg-white border-2 border-red-500 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <div className="w-10 h-10 rounded-control bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
            ⚠️
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-sans">{modalData.title || 'Emergency Confirmation'}</h3>
            <p className="text-[11px] text-red-600 font-sans font-semibold">Irreversible State Escalation</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          {modalData.message || 'Are you sure you want to broadcast this emergency escalation to all inter-agency command centers?'}
        </p>

        {modalData.requireTyped && (
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-control border border-slate-200">
            <label className="text-[11px] text-slate-600 block font-sans font-medium">
              Type <b className="text-red-600 font-mono">CONFIRM</b> to execute action:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRM"
              className="w-full bg-white border border-slate-300 rounded-control px-3 py-1.5 text-xs text-slate-900 font-mono focus:border-red-600 focus:outline-none uppercase"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={modalData.requireTyped && confirmText.trim().toUpperCase() !== 'CONFIRM'}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2 rounded-control text-xs font-sans transition-colors shadow-sm"
          >
            Authorize Emergency Action
          </button>
          <button
            type="button"
            onClick={() => {
              setModalData(null)
              setConfirmText('')
            }}
            className="px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-control text-xs font-sans border border-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
