import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useStore, REGIONS, SENSOR_CATEGORIES, detectGujaratLandmark } from '../store/useStore'
import RiskMap from '../components/map/RiskMap'
import clsx from 'clsx'

export default function MapPage() {
  const nodes = useStore((s) => s.nodes)
  const addNode = useStore((s) => s.addNode)
  const selectedRegion = useStore((s) => s.selectedRegion)

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [mapMode, setMapMode] = useState('normal') // 'normal' | 'satellite' | 'night'
  const [placementMode, setPlacementMode] = useState(false)
  const [clickedCoords, setClickedCoords] = useState(null)
  const [timeHour, setTimeHour] = useState(24) // 24 = "Now", 0 = "-24h"
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef(null)
  const [deployedToast, setDeployedToast] = useState(null)

  // Layer toggles — Wind Plume enabled by default
  const [showRings, setShowRings] = useState(true)
  const [showWind, setShowWind] = useState(true)

  // Camera center based on selected region
  const activeRegionObj = REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0]

  // Playback animation controller
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setTimeHour((prev) => {
          if (prev >= 24) {
            setIsPlaying(false)
            return 24
          }
          return prev + 1
        })
      }, 700)
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current)
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying])

  // Transform nodes dynamically according to the selected point on the 24-hour timeline
  const replayedNodes = useMemo(() => {
    const hoursAgo = 24 - timeHour
    if (hoursAgo === 0) return nodes

    return nodes.map((node, index) => {
      // Deterministic pseudo-temporal wave variation based on node seed and time offset
      const seed = (node.latitude * 100 + node.longitude * 10 + index) % 10
      const wave = Math.sin((hoursAgo + seed) * 0.45)
      const cosWave = Math.cos((hoursAgo + seed * 1.3) * 0.35)

      // Time-shifted risk score (drifts with historical diurnal / weather cycles)
      const baseRisk = node.risk_score || 25
      const adjustedRisk = Math.max(10, Math.min(96, Math.round(baseRisk + wave * 22 + (hoursAgo === 12 ? 15 : 0))))

      let adjustedSeverity = 'advisory'
      if (adjustedRisk >= 70) adjustedSeverity = 'emergency'
      else if (adjustedRisk >= 50) adjustedSeverity = 'warning'
      else if (adjustedRisk >= 35) adjustedSeverity = 'watch'

      // Time-shifted sensor readings
      const waterOffset = Math.round(wave * 18)
      const tempOffset = parseFloat((cosWave * 3.5).toFixed(1))
      const aqiOffset = Math.round(wave * 26)

      const timeLabel = hoursAgo === 0 ? 'Live' : `${hoursAgo}h ago`

      return {
        ...node,
        risk_score: adjustedRisk,
        severity: adjustedSeverity,
        water_level_cm: node.water_level_cm != null ? Math.max(5, node.water_level_cm + waterOffset) : undefined,
        temperature_c: node.temperature_c != null ? Math.max(18, parseFloat((node.temperature_c + tempOffset).toFixed(1))) : undefined,
        smoke_aqi: node.smoke_aqi != null ? Math.max(15, node.smoke_aqi + aqiOffset) : undefined,
        last_update: timeLabel,
      }
    })
  }, [nodes, timeHour])

  // Filter nodes by category
  const displayedNodes = replayedNodes.filter((n) => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false
    return true
  })

  // Stable map click callback for node deployment
  const handleMapClick = useCallback((lat, lng) => {
    setClickedCoords({ lat, lng })
  }, [])

  const handleDeploymentConfirm = (sensorData) => {
    addNode(sensorData)
    // Auto-switch filter to 'all' so the new node is immediately visible
    setCategoryFilter('all')
    setClickedCoords(null)
    setPlacementMode(false)
    setDeployedToast(`Deployed ${sensorData.name} at ${sensorData.location}`)
    setTimeout(() => setDeployedToast(null), 5000)
  }

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden font-sans">

      {/* ─── Top Placement Mode Action Banner ────────────────────────────── */}
      {placementMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[600] pointer-events-auto flex items-center gap-3 bg-slate-900/95 text-white px-5 py-2.5 rounded-full shadow-2xl border-2 border-red-500/80 font-mono text-xs backdrop-blur-md animate-fade-in">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="font-bold text-red-100">
            🎯 DEPLOY MODE: Click anywhere on the map to place sensor node
          </span>
          <button
            type="button"
            onClick={() => setPlacementMode(false)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-full text-[11px] transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ─── Deployment Success Toast ────────────────────────────────────── */}
      {deployedToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[600] pointer-events-none flex items-center gap-2.5 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-2xl font-mono text-xs font-bold animate-bounce">
          <span>✅</span>
          <span>{deployedToast}</span>
        </div>
      )}

      {/* ─── Top Floating Filter Strip ──────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
        {/* Left: Category Filter Pills */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full p-1.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] flex items-center gap-1.5 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all',
              categoryFilter === 'all'
                ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            All Sensors ({nodes.length})
          </button>
          {SENSOR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap font-medium',
                categoryFilter === cat.id
                  ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white font-bold shadow-md shadow-blue-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span>{cat.icon}</span>
              <span className="hidden md:inline">{cat.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Right: Map Modes, Layer Controls & Placement Trigger */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full p-1.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] flex items-center gap-2 flex-wrap">
          {/* Map Mode Buttons: Normal | Satellite | Night */}
          <div className="flex items-center bg-slate-100/90 rounded-full p-0.5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setMapMode('normal')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1',
                mapMode === 'normal'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="OpenStreetMap Standard"
            >
              <span>🗺️</span>
              <span className="hidden md:inline">Normal</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1',
                mapMode === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Esri World Imagery"
            >
              <span>🛰️</span>
              <span className="hidden md:inline">Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('night')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1',
                mapMode === 'night'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Tactical Dark Mode"
            >
              <span>🌙</span>
              <span className="hidden md:inline">Night</span>
            </button>
          </div>

          {/* Correlation Rings Toggle */}
          <button
            type="button"
            onClick={() => setShowRings(!showRings)}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-mono transition-all font-semibold',
              showRings
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            ⭕ Correlation Rings
          </button>

          {/* Wind Plume Toggle — Prominent High-Visibility Button */}
          <button
            type="button"
            onClick={() => setShowWind(!showWind)}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-mono transition-all font-bold flex items-center gap-1.5 border',
              showWind
                ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-sm shadow-purple-500/20'
                : 'text-slate-500 hover:bg-slate-100 border-transparent'
            )}
          >
            <span>💨</span>
            <span>Wind Plumes</span>
            {showWind && (
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            )}
          </button>

          {/* Deploy Node Trigger Button */}
          <button
            type="button"
            onClick={() => setPlacementMode(!placementMode)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all shadow-md flex items-center gap-1.5',
              placementMode
                ? 'bg-red-600 text-white animate-pulse shadow-red-500/30'
                : 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/25'
            )}
          >
            <span>{placementMode ? '✕ Cancel Deploy' : '📍 Deploy Node'}</span>
          </button>
        </div>
      </div>

      {/* ─── Bottom-Left: 24h Time Scrubber & Spatial Replay ────────────── */}
      <div className="absolute bottom-6 left-4 z-[500] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12)] w-88 space-y-2.5 pointer-events-auto font-sans">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (timeHour >= 24 && !isPlaying) {
                  setTimeHour(0)
                  setIsPlaying(true)
                } else {
                  setIsPlaying(!isPlaying)
                }
              }}
              className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause replay' : 'Play spatial historical timeline'}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <span className="font-bold text-slate-800">
              24h Spatial Replay
            </span>
          </div>

          <span className={clsx(
            'px-2.5 py-0.5 rounded-full font-bold text-[11px] border',
            timeHour === 24
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          )}>
            {timeHour === 24 ? '● LIVE (Now)' : `⏱ T - ${24 - timeHour}h`}
          </span>
        </div>

        {/* Timeline Slider with visual gradient track */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="24"
            step="1"
            value={timeHour}
            onChange={(e) => {
              setIsPlaying(false)
              setTimeHour(parseInt(e.target.value))
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* Quick jump presets */}
          <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-500">
            <button
              type="button"
              onClick={() => { setIsPlaying(false); setTimeHour(0) }}
              className={clsx('hover:text-blue-600 font-medium', timeHour === 0 && 'text-blue-600 font-bold')}
            >
              -24h
            </button>
            <button
              type="button"
              onClick={() => { setIsPlaying(false); setTimeHour(12) }}
              className={clsx('hover:text-blue-600 font-medium', timeHour === 12 && 'text-blue-600 font-bold')}
            >
              -12h
            </button>
            <button
              type="button"
              onClick={() => { setIsPlaying(false); setTimeHour(18) }}
              className={clsx('hover:text-blue-600 font-medium', timeHour === 18 && 'text-blue-600 font-bold')}
            >
              -6h
            </button>
            <button
              type="button"
              onClick={() => { setIsPlaying(false); setTimeHour(24) }}
              className={clsx('hover:text-emerald-600 font-bold', timeHour === 24 && 'text-emerald-600')}
            >
              Live Now
            </button>
          </div>
        </div>

        {/* Informative subtitle indicating active replay state */}
        {timeHour < 24 && (
          <div className="text-[10px] font-mono text-amber-600 bg-amber-50/80 rounded-xl px-2.5 py-1 flex items-center justify-between border border-amber-200/60">
            <span>Historical event replay active</span>
            <button
              type="button"
              onClick={() => { setIsPlaying(false); setTimeHour(24) }}
              className="underline font-bold hover:text-amber-800 ml-1"
            >
              Return to Live
            </button>
          </div>
        )}
      </div>

      {/* ─── Main Map Component ─────────────────────────────────────────── */}
      <RiskMap
        nodes={displayedNodes}
        height="100%"
        center={activeRegionObj.center}
        zoom={activeRegionObj.zoom}
        placementMode={placementMode}
        onMapClick={handleMapClick}
        showCorrelationRings={showRings}
        showWindDrift={showWind}
        mode={mapMode}
        onModeChange={setMapMode}
        showModeSwitcher={false}
      />

      {/* ─── High-Priority Modal for Click-to-Deploy Sensor ─────────────── */}
      {clickedCoords && (
        <DeploymentModal
          point={clickedCoords}
          onClose={() => setClickedCoords(null)}
          onConfirm={handleDeploymentConfirm}
        />
      )}
    </div>
  )
}

// ─── Modal Dialog for Node Deployment ─────────────────────────────────────────
function DeploymentModal({ point, onClose, onConfirm }) {
  const detected = detectGujaratLandmark(point.lat, point.lng)
  const [selectedCategory, setSelectedCategory] = useState(detected.category || 'flood')
  const [nodeName, setNodeName] = useState(
    detected.isNearby ? `${detected.name.split(',')[0]} Sentinel` : `Sensor Node (${point.lat.toFixed(3)}, ${point.lng.toFixed(3)})`
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    const catObj = SENSOR_CATEGORIES.find((c) => c.id === selectedCategory) || SENSOR_CATEGORIES[0]

    onConfirm({
      name: nodeName,
      category: selectedCategory,
      sensor_type: catObj.name,
      region: detected.region || 'ahmedabad',
      location: detected.name,
      latitude: point.lat,
      longitude: point.lng,
      connectivity: 'WiFi 6 + LoRa Mesh (Auto GPS)',
      battery_pct: 100,
      risk_score: Math.floor(Math.random() * 20) + 15,
      severity: 'advisory',
      status: 'online',
    })
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>📍</span>
              <span>Deploy Node at Selected GPS</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">Gujarat Environmental Sensor Mesh</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* GPS Details Card */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1 font-mono">
          <div>
            GPS Coordinates:{' '}
            <b className="text-blue-600">{point.lat.toFixed(4)}° N, {point.lng.toFixed(4)}° E</b>
          </div>
          <div className="text-slate-700">
            Detected Landmark:{' '}
            <b className="text-slate-900">{detected.name}</b>
          </div>
          {detected.distanceText && (
            <div className="text-[11px] text-slate-500">
              Proximity: {detected.distanceText}
            </div>
          )}
        </div>

        {/* Deployment Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-slate-700 font-mono block mb-1 font-bold">Node Name</label>
            <input
              type="text"
              required
              autoFocus
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 font-mono block mb-1 font-bold">Sensor Bay Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:outline-none transition-all font-medium"
            >
              {SENSOR_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-2.5 rounded-full font-mono shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Confirm Deployment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 bg-slate-100 text-slate-600 rounded-full font-mono border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
