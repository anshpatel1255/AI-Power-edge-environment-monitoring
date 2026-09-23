// pages/PublicPortal.jsx — Citizen-Facing Public Safety Portal (No Login Required)
// Exact visual match to Gujarat State Disaster Management Authority (GSDMA) Citizen Safety Portal

import { useState, useEffect } from 'react'
import clsx from 'clsx'

// Zone presets for Gujarat
const ZONE_DATA = {
  ahmedabad: {
    name: 'Ahmedabad Metro',
    pill: 'Narol-Vatva sensor cluster',
    aqi: 168,
    aqiStatus: 'Poor',
    windSpeed: '12 km/h',
    windDir: 'Blowing SW → NE',
    nodesOnline: '2,140 / 2,180',
    gridUptime: '98.2% grid uptime',
    nodesShort: '2.1k',
    activeAdvisories: '1 Caution',
    advisoryScope: 'Ahmedabad zone only',
    advisoryCount: 1,
    advisoryTitle: 'Elevated Volatile Organic Chemical Plume',
    advisoryZone: 'Narol-Vatva & Isanpur Zone, Ahmedabad',
    advisoryPublished: 'Published 6 minutes ago',
    residentsRadius: 'Est. 42,000 residents in radius',
    advisoryDesc:
      'Elevated industrial chemical vapors have been detected by three ground-level sensors near the Vatva GIDC estate. Residents with asthma, COPD, or other respiratory conditions should stay indoors with windows and vents sealed. A follow-up update is expected within 90 minutes as GPCB inspection teams reach the site.',
    nearestShelter: 'Isanpur Community Hall · 1.4 km away',
    severity: 'CAUTION',
    severityPercent: 60,
    snapshotName: 'AHMEDABAD METRO',
    stats: {
      issued30Days: '7',
      avgTime: '54 sec',
      subscribers: '184,302',
      languages: 'EN / GU / HI',
    },
  },
  surat: {
    name: 'Surat Industrial',
    pill: 'Pandesara & Sachin cluster',
    aqi: 135,
    aqiStatus: 'Moderate',
    windSpeed: '16 km/h',
    windDir: 'Blowing W → E',
    nodesOnline: '1,840 / 1,890',
    gridUptime: '97.4% grid uptime',
    nodesShort: '1.8k',
    activeAdvisories: '1 Watch',
    advisoryScope: 'Surat Coastal zone',
    advisoryCount: 1,
    advisoryTitle: 'Localized Coastal Wind & Humidity Advisory',
    advisoryZone: 'Hazira & Dumas Belt, Surat',
    advisoryPublished: 'Published 24 minutes ago',
    residentsRadius: 'Est. 68,000 residents in radius',
    advisoryDesc:
      'High coastal wind gusts and increased particulate concentration recorded near Hazira corridor. Industrial units instructed to activate misting barriers. Fishermen advised to refrain from deep sea ventures.',
    nearestShelter: 'Dumas Cyclone Evacuation Shelter · 2.1 km away',
    severity: 'WATCH',
    severityPercent: 35,
    snapshotName: 'SURAT INDUSTRIAL',
    stats: {
      issued30Days: '5',
      avgTime: '48 sec',
      subscribers: '142,910',
      languages: 'EN / GU / HI',
    },
  },
  vadodara: {
    name: 'Vadodara Petrochem',
    pill: 'Nandesari & Koyali cluster',
    aqi: 112,
    aqiStatus: 'Moderate',
    windSpeed: '9 km/h',
    windDir: 'Blowing NW → SE',
    nodesOnline: '1,420 / 1,450',
    gridUptime: '97.9% grid uptime',
    nodesShort: '1.4k',
    activeAdvisories: '0 Active',
    advisoryScope: 'Normal conditions',
    advisoryCount: 0,
    advisoryTitle: 'Atmospheric Inversion Precaution',
    advisoryZone: 'Nandesari Industrial Area, Vadodara',
    advisoryPublished: 'Published 2 hours ago',
    residentsRadius: 'Est. 28,000 residents in radius',
    advisoryDesc:
      'Ambient air quality index stable within permissible regulatory parameters. Regular monitoring active across all 32 perimeter electrochemical sensors.',
    nearestShelter: 'Nandesari Civic Facility · 0.8 km away',
    severity: 'WATCH',
    severityPercent: 20,
    snapshotName: 'VADODARA PETROCHEM',
    stats: {
      issued30Days: '4',
      avgTime: '51 sec',
      subscribers: '98,420',
      languages: 'EN / GU / HI',
    },
  },
  gandhinagar: {
    name: 'Gandhinagar Capital',
    pill: 'Sector 24 & GIFT City cluster',
    aqi: 72,
    aqiStatus: 'Good',
    windSpeed: '11 km/h',
    windDir: 'Blowing N → S',
    nodesOnline: '1,620 / 1,640',
    gridUptime: '98.8% grid uptime',
    nodesShort: '1.6k',
    activeAdvisories: '0 Active',
    advisoryScope: 'Normal conditions',
    advisoryCount: 0,
    advisoryTitle: 'Sabarmati Basin Hydrological Watch',
    advisoryZone: 'Gandhinagar & GIFT City Corridor',
    advisoryPublished: 'Published 3 hours ago',
    residentsRadius: 'Est. 35,000 residents in radius',
    advisoryDesc:
      'Sabarmati water level nominal at 128.4 ft. Meteorological sensors indicate clear atmospheric conditions and optimal air quality throughout the urban zone.',
    nearestShelter: 'Sector 11 Community Center · 1.2 km away',
    severity: 'WATCH',
    severityPercent: 15,
    snapshotName: 'GANDHINAGAR CAPITAL',
    stats: {
      issued30Days: '3',
      avgTime: '42 sec',
      subscribers: '112,850',
      languages: 'EN / GU / HI',
    },
  },
}

// Translations for 3 languages
const TRANSLATIONS = {
  en: {
    livePill: 'GRID SYNCED 4 SEC AGO',
    heroTitle: "Know what's happening in your zone,\nbefore it reaches your door.",
    heroSub:
      'Verified advisories, live environmental readings, and step-by-step guidance from the Gujarat State Disaster Management Authority.',
    yourZone: 'Your Zone:',
    aqiLabel: 'AIR QUALITY (AQI)',
    windLabel: 'WIND SPEED',
    nodesLabel: 'SENSOR NODES ONLINE',
    advisoriesLabel: 'ACTIVE ADVISORIES',
    advisoryActive: 'ADVISORY ACTIVE • CAUTION ADVISED',
    verifiedBadge: 'Verified Official GSDMA Broadcast',
    fullBulletin: 'Full bulletin',
    shareAdvisory: 'Share advisory',
    printNotice: 'Print notice',
    severityLevel: 'SEVERITY LEVEL',
    nearestShelter: 'Nearest clean-air shelter:',
    whatToDoTitle: 'What should you do right now?',
    guidance1Title: 'Health & shelter',
    guidance1_1: 'Wear an N95 mask outdoors',
    guidance1_2: 'Shut windows, seal door gaps',
    guidance1_3: 'Avoid outdoor exercise until cleared',
    guidance2Title: 'Emergency contacts',
    guidance2_1: '101 — Fire & hazmat response',
    guidance2_2: '108 — Medical emergency (EMS)',
    guidance2_3: '1077 — GSDMA state control room',
    guidance3Title: 'Vulnerable groups',
    guidance3_1: 'Children & elderly: remain indoors',
    guidance3_2: 'Pregnant residents: avoid the affected zone',
    guidance3_3: 'Carry inhalers if asthmatic',
    guidance4Title: 'Report a hazard',
    guidance4Text:
      'Noticed a smell, leak, or smoke near you? File a geotagged citizen report — it routes straight to the nearest response unit.',
    subscribeTitle: 'Get instant alerts on your phone',
    subscribeSub:
      'Free SMS and WhatsApp notices the moment an advisory is issued for your zone — no app, no login required.',
    subscribeBtn: 'Subscribe for alerts',
    subscribedBtn: '✓ Subscribed!',
    privacyText: 'Zero spam. Powered directly by the GSDMA emergency gateway.',
    gridSnapshot: 'GRID SNAPSHOT',
    advisories30Days: 'Advisories issued (30 days)',
    avgTimeToAlert: 'Avg. time to first alert',
    citizensSubscribed: 'Citizens subscribed',
    languagesSupported: 'Languages supported',
    recentAdvisories: 'Recent advisories',
    viewFullHistory: 'View full history →',
    hideHistory: 'Show fewer ↑',
    activeBadge: 'ACTIVE',
    resolvedBadge: 'RESOLVED',
  },
  gu: {
    livePill: 'ગ્રીડ ૪ સેકન્ડ પહેલા સમન્વયિત',
    heroTitle: 'તમારા વિસ્તારમાં શું થઈ રહ્યું છે તે જાણો,\nતે તમારા ઘર સુધી પહોંચે તે પહેલાં.',
    heroSub:
      'ગુજરાત રાજ્ય આપત્તિ વ્યવસ્થાપન સત્તામંડળ (GSDMA) તરફથી માન્ય સત્તાવાર ચેતવણીઓ, લાઈવ પર્યાવરણ રીડિંગ્સ અને પગલાંવાર માર્ગદર્શન.',
    yourZone: 'તમારો વિસ્તાર:',
    aqiLabel: 'વાયુ ગુણવત્તા (AQI)',
    windLabel: 'પવનની ઝડપ',
    nodesLabel: 'સેન્સર નોડ્સ ઓનલાઇન',
    advisoriesLabel: 'સક્રિય સલાહ',
    advisoryActive: 'ચેતવણી જારી • સાવચેતી રાખવાની સલાહ',
    verifiedBadge: 'GSDMA માન્ય સત્તાવાર પ્રસારણ',
    fullBulletin: 'સંપૂર્ણ બુલેટિન',
    shareAdvisory: 'શેર કરો',
    printNotice: 'પ્રિન્ટ નોટિસ',
    severityLevel: 'તીવ્રતા સ્તર',
    nearestShelter: 'નજીકનું સ્વચ્છ હવા આશ્રયસ્થાન:',
    whatToDoTitle: 'તમારે અત્યારે શું કરવું જોઈએ?',
    guidance1Title: 'આરોગ્ય અને આશ્રય',
    guidance1_1: 'બહાર નીકળતી વખતે N95 માસ્ક પહેરો',
    guidance1_2: 'બારીઓ બંધ કરો, દરવાજાની તિરાડો સીલ કરો',
    guidance1_3: 'પરિસ્થિતિ સામાન્ય ન થાય ત્યાં સુધી કસરત ટાળો',
    guidance2Title: 'ઇમરજન્સી સંપર્કો',
    guidance2_1: '101 — અગ્નિશામક અને હેઝમેટ રિસ્પોન્સ',
    guidance2_2: '108 — તબીબી કટોકટી (EMS)',
    guidance2_3: '1077 — GSDMA સ્ટેટ કંટ્રોલ રૂમ',
    guidance3Title: 'સંવેદનશીલ જૂથો',
    guidance3_1: 'બાળકો અને વૃદ્ધો: ઘરની અંદર રહો',
    guidance3_2: 'સગર્ભા મહિલાઓ: પ્રભાવિત વિસ્તાર ટાળો',
    guidance3_3: 'અસ્થમા હોય તો ઇન્હેલર સાથે રાખો',
    guidance4Title: 'જોખમની જાણ કરો',
    guidance4Text:
      'નજીકમાં ગંધ, લીકેજ કે ધુમાડો જણાયો? જિયોટેગ કરેલ નાગરિક રિપોર્ટ નોંધાવો — તે સીધો નજીકના રિસ્પોન્સ યુનિટ સુધી પહોંચશે.',
    subscribeTitle: 'તમારા ફોન પર તાત્કાલિક ચેતવણી મેળવો',
    subscribeSub:
      'તમારા વિસ્તાર માટે ચેતવણી જાહેર થતાં જ મફત SMS અને WhatsApp સંદેશા મેળવો — કોઈ એપ કે લોગિનની જરૂર નથી.',
    subscribeBtn: 'ચેતવણી માટે સબ્સ્ક્રાઇબ કરો',
    subscribedBtn: '✓ સબ્સ્ક્રાઇબ સફળ!',
    privacyText: 'શૂન્ય સ્પામ. સીધા GSDMA ઇમરજન્સી ગેટવે દ્વારા સંચાલિત.',
    gridSnapshot: 'ગ્રીડ ઝાંખી',
    advisories30Days: 'જારી કરેલ ચેતવણીઓ (૩૦ દિવસ)',
    avgTimeToAlert: 'પ્રથમ એલર્ટનો સરેરાશ સમય',
    citizensSubscribed: 'જોડાયેલ નાગરિકો',
    languagesSupported: 'સમર્થિત ભાષાઓ',
    recentAdvisories: 'તાજેતરની સલાહ',
    viewFullHistory: 'સંપૂર્ણ ઇતિહાસ જુઓ →',
    hideHistory: 'ઓછું બતાવો ↑',
    activeBadge: 'સક્રિય',
    resolvedBadge: 'ઉકેલાયેલ',
  },
  hi: {
    livePill: 'ग्रिड 4 सेकंड पहले सिंक किया गया',
    heroTitle: 'अपने क्षेत्र में क्या हो रहा है, उसे जानें,\nइससे पहले कि वह आपके दरवाजे तक पहुंचे।',
    heroSub:
      'गुजरात राज्य आपदा प्रबंधन प्राधिकरण (GSDMA) से सत्यापित आधिकारिक चेतावनियाँ, वास्तविक समय पर्यावरण रीडिंग और चरण-दर-चरण मार्गदर्शन।',
    yourZone: 'आपका क्षेत्र:',
    aqiLabel: 'वायु गुणवत्ता (AQI)',
    windLabel: 'हवा की गति',
    nodesLabel: 'सेंसर नोड्स ऑनलाइन',
    advisoriesLabel: 'सक्रिय चेतावनियाँ',
    advisoryActive: 'चेतावनी सक्रिय • सावधानी की सलाह',
    verifiedBadge: 'GSDMA अधिकृत आधिकारिक प्रसारण',
    fullBulletin: 'संपूर्ण बुलेटिन',
    shareAdvisory: 'शेयर करें',
    printNotice: 'प्रिंट नोटिस',
    severityLevel: 'गंभीरता स्तर',
    nearestShelter: 'निकटतम स्वच्छ हवा आश्रय:',
    whatToDoTitle: 'आपको अभी क्या करना चाहिए?',
    guidance1Title: 'स्वास्थ्य और आश्रय',
    guidance1_1: 'बाहर जाते समय N95 मास्क पहनें',
    guidance1_2: 'खिड़कियां बंद रखें, दरवाजों के अंतराल सील करें',
    guidance1_3: 'स्थिति सामान्य होने तक बाहरी व्यायाम से बचें',
    guidance2Title: 'आपातकालीन संपर्क',
    guidance2_1: '101 — अग्निशमन और हज़मैट प्रतिक्रिया',
    guidance2_2: '108 — चिकित्सा आपातकाल (EMS)',
    guidance2_3: '1077 — GSDMA राज्य नियंत्रण कक्ष',
    guidance3Title: 'संवेदनशील समूह',
    guidance3_1: 'बच्चे और बुजुर्ग: घर के अंदर रहें',
    guidance3_2: 'गर्भवती महिलाएं: प्रभावित क्षेत्र से बचें',
    guidance3_3: 'अस्थमा के मरीज इनहेलर साथ रखें',
    guidance4Title: 'खतरे की सूचना दें',
    guidance4Text:
      'क्या आपने पास में गंध, रिसाव या धुआं देखा? जियोटैग्ड नागरिक रिपोर्ट दर्ज करें — यह सीधे निकटतम प्रतिक्रिया दल तक पहुंचती है।',
    subscribeTitle: 'अपने फोन पर तुरंत अलर्ट प्राप्त करें',
    subscribeSub:
      'जैसे ही आपके क्षेत्र के लिए सलाह जारी हो, मुफ्त SMS और व्हाट्सएप संदेश प्राप्त करें — किसी ऐप या लॉगिन की आवश्यकता नहीं।',
    subscribeBtn: 'अलर्ट के लिए सब्सक्राइब करें',
    subscribedBtn: '✓ सफलतापूर्वक सब्सक्राइब किया गया!',
    privacyText: 'शून्य स्पैम। सीधे GSDMA आपातकालीन गेटवे द्वारा संचालित।',
    gridSnapshot: 'ग्रिड स्नैपशॉट',
    advisories30Days: 'जारी चेतावनियाँ (30 दिन)',
    avgTimeToAlert: 'पहले अलर्ट का औसत समय',
    citizensSubscribed: 'सब्सक्राइब किए गए नागरिक',
    languagesSupported: 'समर्थित भाषाएं',
    recentAdvisories: 'हाल की चेतावनियाँ',
    viewFullHistory: 'पूरा इतिहास देखें →',
    hideHistory: 'कम दिखाएं ↑',
    activeBadge: 'सक्रिय',
    resolvedBadge: 'हल किया गया',
  },
}

// Circular SVG Progress Ring Gauge
function CircularGauge({ value, percent, color, trackColor, label, status, subtext, size = 68 }) {
  const strokeWidth = 5.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.06)] flex items-center gap-4 transition-all hover:shadow-md">
      {/* Gauge SVG */}
      <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute font-bold text-slate-800 text-xs sm:text-sm">
          {value}
        </span>
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 truncate">
          {label}
        </div>
        <div className="text-base font-extrabold text-slate-900 truncate mt-0.5">
          {status}
        </div>
        <div className="text-xs text-slate-400 truncate mt-0.5 font-normal">
          {subtext}
        </div>
      </div>
    </div>
  )
}

export default function PublicPortal() {
  const [selectedZoneKey, setSelectedZoneKey] = useState('ahmedabad')
  const [language, setLanguage] = useState('en')
  const [phone, setPhone] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [bulletinModalOpen, setBulletinModalOpen] = useState(false)
  const [hazardModalOpen, setHazardModalOpen] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)

  // Hazard report form state
  const [hazardForm, setHazardForm] = useState({
    type: 'Chemical Odor / Vapors',
    location: '',
    description: '',
    phone: '',
  })
  const [hazardSubmitted, setHazardSubmitted] = useState(false)

  const zone = ZONE_DATA[selectedZoneKey] || ZONE_DATA.ahmedabad
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  // Trigger feedback toast
  const triggerToast = (msg) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  // Handle phone subscription
  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!phone || phone.trim().length < 8) {
      triggerToast('Please enter a valid 10-digit mobile number')
      return
    }
    setSubscribed(true)
    triggerToast('✓ Mobile alert registered! You will receive emergency broadcasts.')
    setTimeout(() => {
      setPhone('')
      setSubscribed(false)
    }, 4500)
  }

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: zone.advisoryTitle,
        text: `Official GSDMA Advisory: ${zone.advisoryTitle} in ${zone.advisoryZone}. Stay indoors.`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(window.location.href)
      triggerToast('🔗 Official GSDMA advisory link copied to clipboard!')
    }
  }

  // Handle hazard submit
  const handleHazardSubmit = (e) => {
    e.preventDefault()
    setHazardSubmitted(true)
    setTimeout(() => {
      setHazardSubmitted(false)
      setHazardModalOpen(false)
      triggerToast('✓ Incident #GSDMA-8492 logged. Nearest response unit alerted!')
      setHazardForm({
        type: 'Chemical Odor / Vapors',
        location: '',
        description: '',
        phone: '',
      })
    }, 1200)
  }

  // Recent advisories data
  const RECENT_ADVISORIES = [
    {
      id: 'adv-1',
      title: 'Elevated Volatile Organic Chemical Plume',
      meta: 'Narol-Vatva & Isanpur Zone · 6 minutes ago',
      status: 'ACTIVE',
      dotColor: 'bg-amber-500 ring-amber-100',
      badgeClass: 'bg-[#fef3c7] text-[#b45309] border-amber-200',
    },
    {
      id: 'adv-2',
      title: 'Heat advisory — surface temperature above 44°C',
      meta: 'Rajkot & Saurashtra belt · Resolved yesterday, 6:40 PM',
      status: 'RESOLVED',
      dotColor: 'bg-emerald-500 ring-emerald-100',
      badgeClass: 'bg-[#ecfdf5] text-[#047857] border-emerald-200',
    },
    {
      id: 'adv-3',
      title: 'Localized flash-flood watch after heavy rainfall',
      meta: 'Surat Coastal, Tapi basin · Resolved 3 days ago',
      status: 'RESOLVED',
      dotColor: 'bg-emerald-500 ring-emerald-100',
      badgeClass: 'bg-[#ecfdf5] text-[#047857] border-emerald-200',
    },
    {
      id: 'adv-4',
      title: 'Cyclone outer-band wind advisory',
      meta: 'Coastal Saurashtra · Resolved 9 days ago',
      status: 'RESOLVED',
      dotColor: 'bg-emerald-500 ring-emerald-100',
      badgeClass: 'bg-[#ecfdf5] text-[#047857] border-emerald-200',
    },
    {
      id: 'adv-5',
      title: 'Industrial particulate smog threshold exceeded',
      meta: 'Ankleshwar GIDC Corridor · Resolved 14 days ago',
      status: 'RESOLVED',
      dotColor: 'bg-emerald-500 ring-emerald-100',
      badgeClass: 'bg-[#ecfdf5] text-[#047857] border-emerald-200',
      extended: true,
    },
    {
      id: 'adv-6',
      title: 'Tidal surge watch for Gulf of Khambhat',
      meta: 'Bhavnagar & Dahej Port · Resolved 22 days ago',
      status: 'RESOLVED',
      dotColor: 'bg-emerald-500 ring-emerald-100',
      badgeClass: 'bg-[#ecfdf5] text-[#047857] border-emerald-200',
      extended: true,
    },
  ]

  const visibleAdvisories = showAllHistory
    ? RECENT_ADVISORIES
    : RECENT_ADVISORIES.filter((a) => !a.extended)

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans pb-24">
      {/* ─── Main Content Canvas ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 space-y-6 sm:space-y-7">

        {/* ─── SECTION 1: HERO & REAL-TIME ZONE OVERVIEW ─────────────────── */}
        <section className="text-center space-y-4">
          {/* Top Live Pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#eef4ff] border border-blue-100 text-blue-600 text-[11px] font-mono font-bold tracking-wider uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>LIVE</span>
              <span className="text-blue-300">•</span>
              <span>{t.livePill}</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-[44px] font-black text-slate-900 tracking-tight leading-[1.15] max-w-3xl mx-auto whitespace-pre-line">
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-500 text-xs sm:text-sm md:text-[15px] max-w-2xl mx-auto font-normal leading-relaxed">
            {t.heroSub}
          </p>

          {/* Zone Selector Pill */}
          <div className="flex justify-center pt-1">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200/90 rounded-full px-5 py-2 shadow-xs text-xs sm:text-sm">
              <span className="text-rose-500 text-sm">📍</span>
              <span className="text-slate-700 font-semibold">{t.yourZone}</span>
              <select
                value={selectedZoneKey}
                onChange={(e) => setSelectedZoneKey(e.target.value)}
                className="font-bold text-blue-600 bg-transparent focus:outline-none cursor-pointer pr-1"
              >
                <option value="ahmedabad">Ahmedabad Metro</option>
                <option value="surat">Surat Industrial</option>
                <option value="vadodara">Vadodara Petrochem</option>
                <option value="gandhinagar">Gandhinagar Capital</option>
              </select>
            </div>
          </div>

          {/* 4 Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 pt-3 text-left">
            {/* Card 1: Air Quality */}
            <CircularGauge
              value={zone.aqi}
              percent={68}
              color="#f59e0b"
              trackColor="#fef3c7"
              label={t.aqiLabel}
              status={zone.aqiStatus}
              subtext={zone.pill}
            />

            {/* Card 2: Wind Speed */}
            <CircularGauge
              value={zone.windSpeed.split(' ')[0]}
              percent={35}
              color="#3b82f6"
              trackColor="#dbeafe"
              label={t.windLabel}
              status={zone.windSpeed}
              subtext={zone.windDir}
            />

            {/* Card 3: Sensor Nodes Online */}
            <CircularGauge
              value={zone.nodesShort}
              percent={98}
              color="#10b981"
              trackColor="#d1fae5"
              label={t.nodesLabel}
              status={zone.nodesOnline}
              subtext={zone.gridUptime}
            />

            {/* Card 4: Active Advisories */}
            <CircularGauge
              value={zone.advisoryCount}
              percent={zone.advisoryCount > 0 ? 25 : 0}
              color="#f43f5e"
              trackColor="#ffe4e6"
              label={t.advisoriesLabel}
              status={zone.activeAdvisories}
              subtext={zone.advisoryScope}
            />
          </div>
        </section>

        {/* ─── SECTION 2: ACTIVE ADVISORY BANNER ─────────────────────────── */}
        <section className="bg-[#fffdf2] border border-amber-300/80 rounded-[26px] p-6 sm:p-7 shadow-xs">
          {/* Top Row: Advisory Active + Verified Pill */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-amber-800 tracking-wider uppercase">
                {t.advisoryActive}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/95 border border-amber-200 text-slate-700 text-xs font-semibold px-3.5 py-1 rounded-full shadow-2xs">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{t.verifiedBadge}</span>
            </div>
          </div>

          {/* Banner Inner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {zone.advisoryTitle}
              </h2>

              <div className="flex items-center gap-3.5 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <span className="text-rose-500">📍</span>
                  <span>{zone.advisoryZone}</span>
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <span className="text-slate-400">🕒</span>
                  <span>{zone.advisoryPublished}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span className="text-slate-400">👤</span>
                <span>{zone.residentsRadius}</span>
              </div>

              {/* White inner callout box */}
              <div className="bg-white/95 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-2xs">
                {zone.advisoryDesc}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBulletinOpen(true)}
                  className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>📄</span>
                  <span>{t.fullBulletin}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="text-blue-500">🔗</span>
                  <span>{t.shareAdvisory}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>{t.printNotice}</span>
                </button>
              </div>
            </div>

            {/* Right Severity Column */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between h-full">
                <div>
                  <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                    {t.severityLevel}
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${zone.severityPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase mt-2">
                      <span>WATCH</span>
                      <span className={clsx('font-bold', zone.severity === 'CAUTION' ? 'text-amber-600' : 'text-slate-400')}>
                        CAUTION
                      </span>
                      <span className={clsx('font-bold', zone.severity === 'SEVERE' ? 'text-rose-600' : 'text-slate-400')}>
                        SEVERE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clean Air Shelter */}
                <div className="text-xs text-slate-600 pt-4 mt-4 border-t border-slate-100 leading-relaxed">
                  {t.nearestShelter}{' '}
                  <b className="text-slate-900 font-bold">{zone.nearestShelter.split('·')[0]}</b>
                  {zone.nearestShelter.includes('·') && (
                    <span className="text-slate-500">· {zone.nearestShelter.split('·')[1]}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: ACTION GUIDANCE ("What should you do right now?") ── */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.whatToDoTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* Card 1: Health & shelter */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center text-sm shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-3 mb-2.5">
                  {t.guidance1Title}
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance1_1}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance1_2}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance1_3}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Emergency contacts */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-sm shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-3 mb-2.5">
                  {t.guidance2Title}
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance2_1}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance2_2}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance2_3}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: Vulnerable groups */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-sm shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-3 mb-2.5">
                  {t.guidance3Title}
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance3_1}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance3_2}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span>{t.guidance3_3}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 4: Report a hazard */}
            <div
              onClick={() => setHazardModalOpen(true)}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.06)] flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-3 mb-2.5 flex items-center justify-between">
                  <span>{t.guidance4Title}</span>
                  <span className="text-emerald-500 text-xs font-mono font-bold group-hover:translate-x-1 transition-transform">→</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.guidance4Text}
                </p>
              </div>
              <div className="pt-3 text-[11px] font-bold text-emerald-600">
                Click to submit geotagged report
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: CITIZEN ALERT SUBSCRIPTION & GRID SNAPSHOT ───────── */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Instant Alerts Form */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Phone Icon Squircle */}
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.subscribeTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {t.subscribeSub}
              </p>

              {/* Language Selector Pills */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { key: 'en', label: 'English' },
                  { key: 'gu', label: 'ગુજરાતી' },
                  { key: 'hi', label: 'हिंदी' },
                ].map(({ key, label }) => {
                  const isSel = language === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLanguage(key)}
                      className={clsx(
                        'px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
                        isSel
                          ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Phone Input & Subscribe Button */}
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="flex items-center gap-2.5 bg-[#f8fafc] border border-slate-200 rounded-full px-4 py-2.5 flex-1 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all shadow-inner">
                  <span className="text-pink-500 text-sm">📞</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none w-full font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {subscribed ? t.subscribedBtn : t.subscribeBtn}
                </button>
              </form>

              {/* Privacy text */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                <span>🔒</span>
                <span>{t.privacyText}</span>
              </div>
            </div>

            {/* Right Column: Dark Navy Grid Snapshot Box */}
            <div className="lg:col-span-5">
              <div className="bg-[#0b192c] rounded-2xl p-6 text-white shadow-xl space-y-4">
                <div className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                  {t.gridSnapshot} • {zone.snapshotName}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400">{t.advisories30Days}</span>
                    <span className="font-extrabold text-white text-sm">{zone.stats.issued30Days}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400">{t.avgTimeToAlert}</span>
                    <span className="font-extrabold text-white text-sm">{zone.stats.avgTime}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800">
                    <span className="text-slate-400">{t.citizensSubscribed}</span>
                    <span className="font-extrabold text-white text-sm">{zone.stats.subscribers}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">{t.languagesSupported}</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs">{zone.stats.languages}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: RECENT ADVISORIES LIST ─────────────────────────── */}
        <section className="space-y-3 pt-2">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.recentAdvisories}
            </h2>
            <button
              type="button"
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{showAllHistory ? t.hideHistory : t.viewFullHistory}</span>
            </button>
          </div>

          {/* List Card Container */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.06)] divide-y divide-slate-100 overflow-hidden">
            {visibleAdvisories.map((adv) => (
              <div
                key={adv.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Status Dot */}
                  <div className={clsx('w-2.5 h-2.5 rounded-full ring-4 flex-shrink-0', adv.dotColor)} />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {adv.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {adv.meta}
                    </p>
                  </div>
                </div>

                {/* Status Pill Badge */}
                <div className={clsx('font-mono font-bold text-[10px] tracking-wider px-3 py-1 rounded-full uppercase border flex-shrink-0', adv.badgeClass)}>
                  {adv.status === 'ACTIVE' ? t.activeBadge : t.resolvedBadge}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── POPUP / MODAL: FULL OFFICIAL BULLETIN ─────────────────────────── */}
      {bulletinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-slide-up space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-mono font-bold border border-amber-200 uppercase mb-2">
                  <span>● GSDMA OFFICIAL BULLETIN</span>
                  <span>·</span>
                  <span>ID: ADV-2026-0923</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {zone.advisoryTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Issued by: State Emergency Operations Centre (SEOC), Gandhinagar
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulletinModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Technical bulletin body */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>🔬</span> Atmospheric & Sensor Telemetry
                </div>
                <p className="text-xs text-slate-600">
                  Multiple electrochemical sensors across Narol-Vatva have recorded heightened VOC and particulate plumes under current 12 km/h SW → NE wind vectors. An atmospheric boundary inversion layer is currently restricting vertical dispersion.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Mandated Protective Directives:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                  <li>Residential ventilation systems and HVAC intakes within a 3.5 km radius must be closed.</li>
                  <li>Industrial units in Vatva GIDC Phase II and IV are directed to halt non-critical batch reactions.</li>
                  <li>Vulnerable individuals with respiratory sensitivities are prioritized for transit to Isanpur Community Hall.</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <span>ℹ️</span> Clean-Air Shelter Protocol
                </div>
                <p>
                  Isanpur Community Hall has been activated with industrial HEPA filtration scrubbers and high-flow air curtains. Medical teams from Ahmedabad Municipal Corporation (AMC) are stationed on-site.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
              <div className="text-[11px] font-mono text-slate-400">
                Emergency Hotline: Dial 1077 (Toll-Free)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Print Notice
                </button>
                <button
                  type="button"
                  onClick={() => setBulletinModalOpen(false)}
                  className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Close Bulletin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── POPUP / MODAL: CITIZEN HAZARD REPORT ─────────────────────────── */}
      {hazardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-slide-up space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                  📢
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    File a Citizen Hazard Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct routing to Gujarat Disaster Response & Fire units
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHazardModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleHazardSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hazard Classification
                </label>
                <select
                  value={hazardForm.type}
                  onChange={(e) => setHazardForm({ ...hazardForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option>Chemical Odor / Vapors</option>
                  <option>Toxic Industrial Smog / Smoke</option>
                  <option>Chemical / Effluent Spill</option>
                  <option>Flash Flooding / Waterlogging</option>
                  <option>Extreme Heat / Fire Outbreak</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Nearest Landmark
                </label>
                <input
                  type="text"
                  required
                  value={hazardForm.location}
                  onChange={(e) => setHazardForm({ ...hazardForm, location: e.target.value })}
                  placeholder="e.g., Near Vatva Canal Road Phase 4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observations / Severity Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={hazardForm.description}
                  onChange={(e) => setHazardForm({ ...hazardForm, description: e.target.value })}
                  placeholder="Pungent sulfur odor noticeable since 15 mins, eye irritation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (For dispatch status SMS)
                </label>
                <input
                  type="tel"
                  value={hazardForm.phone}
                  onChange={(e) => setHazardForm({ ...hazardForm, phone: e.target.value })}
                  placeholder="+91 98765 43210 (Optional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setHazardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hazardSubmitted}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {hazardSubmitted ? 'Transmitting Report...' : 'Submit Geotagged Report →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
