// pages/PublicPortal.jsx — Citizen-Facing Public Safety Portal (No Login Required)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, REGIONS } from '../store/useStore'
import clsx from 'clsx'

export default function PublicPortal() {
  const advisories = useStore((s) => s.advisories)
  const language = useStore((s) => s.publicLanguage)
  const setLanguage = useStore((s) => s.setPublicLanguage)
  const [selectedZone, setSelectedZone] = useState('ahmedabad')
  const [phone, setPhone] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const activeAdvisory = advisories[0]

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!phone) return
    setSubscribed(true)
    setTimeout(() => setSubscribed(false), 4000)
    setPhone('')
  }

  // Multilingual UI Dictionary
  const UI_TEXT = {
    en: {
      portalTitle: 'Gujarat Citizen Environmental Safety Portal',
      subtitle: 'Official, verified disaster advisories and safety guidance from GSDMA.',
      statusNormal: 'Normal Conditions in Your Area',
      statusWarning: 'Advisory Active: Caution Advised',
      statusEmergency: 'EMERGENCY: Immediate Precaution Required',
      whatShouldIDo: 'What Should You Do Right Now?',
      verifiedBadge: 'Verified Official GSDMA Broadcast',
      subscribeTitle: 'Get Free Instant SMS Emergency Alerts',
      subscribeDesc: 'Receive verified evacuation notices directly on your mobile during cyclones, floods, and toxic smog.',
      subscribeBtn: 'Subscribe for SMS Alerts',
      backToAgency: '← Authority / Agency Command Login',
    },
    gu: {
      portalTitle: 'ગુજરાત નાગરિક પર્યાવરણ સુરક્ષા પોર્ટલ',
      subtitle: 'GSDMA દ્વારા માન્ય સત્તાવાર આપત્તિ ચેતવણીઓ અને સલામતી માર્ગદર્શન.',
      statusNormal: 'તમારા વિસ્તારમાં સ્થિતિ સામાન્ય છે',
      statusWarning: 'ચેતવણી જારી: સાવચેતી રાખવાની સલાહ',
      statusEmergency: 'કટોકટી: તાત્કાલિક સાવચેતી જરૂરી',
      whatShouldIDo: 'તમારે અત્યારે શું કરવું જોઈએ?',
      verifiedBadge: 'GSDMA માન્ય સત્તાવાર પ્રસારણ',
      subscribeTitle: 'મફત ઇન્સ્ટન્ટ SMS ચેતવણી મેળવો',
      subscribeDesc: 'પૂર, વાવાઝોડું કે ઝેરી ગેસ દરમિયાન સીધા તમારા ફોન પર મેસેજ મેળવો.',
      subscribeBtn: 'SMS ચેતવણી માટે સબ્સ્ક્રાઇબ કરો',
      backToAgency: '← સત્તાવાર અધિકારી પ્રવેશ',
    },
    hi: {
      portalTitle: 'गुजरात नागरिक पर्यावरण सुरक्षा पोर्टल',
      subtitle: 'GSDMA द्वारा अधिकृत आधिकारिक आपदा सलाह और सुरक्षा मार्गदर्शन।',
      statusNormal: 'आपके क्षेत्र में स्थिति सामान्य है',
      statusWarning: 'चेतावनी सक्रिय: सावधानी बरतने की सलाह',
      statusEmergency: 'आपातकाल: तुरंत सावधानी बरतें',
      whatShouldIDo: 'आपको अभी क्या करना चाहिए?',
      verifiedBadge: 'GSDMA अधिकृत आधिकारिक प्रसारण',
      subscribeTitle: 'मुफ्त आपातकालीन SMS अलर्ट प्राप्त करें',
      subscribeDesc: 'बाढ़, आग या जहरीली गैस की स्थिति में सीधे अपने मोबाइल पर आधिकारिक चेतावनी पाएं।',
      subscribeBtn: 'SMS अलर्ट के लिए सब्सक्राइब करें',
      backToAgency: '← अधिकारी कमांड लॉगिन',
    },
  }

  const t = UI_TEXT[language] || UI_TEXT.en
  const currentText = activeAdvisory ? activeAdvisory[language] || activeAdvisory.en : null

  return (
    <div className="text-[#0F172A] font-sans pb-16 animate-slide-up">
      {/* ─── Top Citizen Sub-Bar (Below TopHeader) ─────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 lg:px-8 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
            🌍
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              Eco<span className="text-emerald-700">Monitor</span> Citizen Safety
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              GSDMA Public Environmental Network
            </div>
          </div>
        </div>

        {/* Right: Language Switcher & Agency Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex bg-slate-100 border border-slate-300 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={clsx(
                'px-2.5 py-1 rounded transition-colors',
                language === 'en' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('gu')}
              className={clsx(
                'px-2.5 py-1 rounded transition-colors',
                language === 'gu' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              ગુજરાતી
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={clsx(
                'px-2.5 py-1 rounded transition-colors',
                language === 'hi' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              हिन्दी
            </button>
          </div>

          <Link
            to="/dashboard"
            className="hidden sm:inline-block text-xs font-mono font-semibold text-emerald-700 hover:underline"
          >
            ← Command Center
          </Link>
        </div>
      </div>


      {/* ─── Main Content Container ─────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Portal Introduction Banner */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            {t.portalTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#475569] max-w-xl mx-auto">
            {t.subtitle}
          </p>

          {/* Region Picker for Citizen */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 shadow-xs text-xs font-mono">
              <span>📍 Your Zone:</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="font-bold text-[#0F172A] bg-transparent focus:outline-none cursor-pointer"
              >
                {REGIONS.filter((r) => r.id !== 'all').map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─── Big High-Contrast Status Banner ──────────────────────────── */}
        {activeAdvisory ? (
          <div className="bg-[#FFFBEB] border-2 border-[#B58900] rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#B58900] animate-ping" />
                <span className="text-xs font-mono font-bold uppercase text-[#B58900] tracking-wider">
                  {t.statusWarning}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#475569] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded-full">
                {t.verifiedBadge}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                {currentText?.title || activeAdvisory.en.title}
              </h2>
              <p className="text-xs font-mono text-[#475569]">
                📍 Zone: <b className="text-[#0F172A]">{activeAdvisory.zone}</b> · Published {activeAdvisory.published_at}
              </p>
            </div>

            <p className="text-sm text-[#0F172A] leading-relaxed bg-white/70 p-3.5 rounded-xl border border-[#CBD5E1]">
              {currentText?.message || activeAdvisory.en.message}
            </p>
          </div>
        ) : (
          <div className="bg-[#E8F5E9] border-2 border-[#2E7D32] rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <div>
              <div className="text-sm font-bold text-[#2E7D32] uppercase font-mono">
                {t.statusNormal}
              </div>
              <p className="text-xs text-[#475569] mt-0.5">
                All hydrological levels, forest thermal arrays, and industrial air monitors are operating within safe seasonal limits.
              </p>
            </div>
          </div>
        )}

        {/* ─── "What Should I Do Right Now?" Action Card ─────────────────── */}
        <div className="bg-white border border-[#E3E8EF] rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
            <span>🛡️</span> {t.whatShouldIDo}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#F7F9FB] border border-[#E3E8EF] p-3 rounded-xl space-y-1">
              <div className="font-bold text-[#0B6E4F]">1. Immediate Health & Shelter</div>
              <p className="text-[#475569]">
                {currentText?.action || 'Keep residential windows closed during industrial thermal inversions.'}
              </p>
            </div>

            <div className="bg-[#F7F9FB] border border-[#E3E8EF] p-3 rounded-xl space-y-1">
              <div className="font-bold text-[#0B6E4F]">2. Emergency Contacts</div>
              <p className="text-[#475569]">
                Dial <b>101</b> for Fire, <b>108</b> for Medical EMS, or <b>1077</b> for GSDMA State Disaster Control.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Free SMS Alerts Subscription Form ─────────────────────────── */}
        <div className="bg-white border border-[#E3E8EF] rounded-2xl p-6 shadow-sm space-y-3">
          <div>
            <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
              <span>📱</span> {t.subscribeTitle}
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              {t.subscribeDesc}
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className="flex-1 bg-[#F7F9FB] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0B6E4F]"
            />
            <button
              type="submit"
              className="bg-[#0B6E4F] hover:bg-[#08573F] text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
            >
              {subscribed ? '✓ Subscribed Successfully!' : t.subscribeBtn}
            </button>
          </form>
          <p className="text-[10px] text-[#94A3B8] font-mono">
            Zero spam. Powered directly by Gujarat State Disaster Management Authority emergency gateway.
          </p>
        </div>
      </main>
    </div>
  )
}
