// pages/MapPage.jsx — Geographic Environmental Risk Map with Layer Toggles & 24h Time Scrubber
import { useState } from 'react'
import { useStore, REGIONS, SENSOR_CATEGORIES, detectGujaratLandmark } from '../store/useStore'
import RiskMap from '../components/map/RiskMap'
import clsx from 'clsx'

export default function MapPage() {
  const nodes = useStore((s) => s.nodes)
  const addNode = useStore((s) => s.addNode)
  const selectedRegion = useStore((s) => s.selectedRegion)

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [placementMode, setPlacementMode] = useState(false)
  const [clickedCoords, setClickedCoords] = useState(null)
  const [timeHour, setTimeHour] = useState(24) // 24 = "Now"

  // Layer toggles
  const [showRings, setShowRings] = useState(true)
  const [showWind, setShowWind] = useState(true)

  // Camera center based on selected region
  const activeRegionObj = REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0]

  // Filter nodes by category
  const displayedNodes = nodes.filter((n) => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false
    return true
  })

  const handleMapClick = (lat, lng) => {
    if (!placementMode) return
    setClickedCoords({ lat, lng })
  }

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden font-sans">
      {/* ─── Top Floating Filter Strip ──────────────────────────────────── */}
      <div className="absolute top-3 left-4 right-4 z-[500] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
        {/* Left: Category Filter Pills */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs border border-[#CBD5E1] rounded-2xl p-1.5 shadow-md flex items-center gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setCategoryFilter('all')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors',
              categoryFilter === 'all'
                ? 'bg-[#0B6E4F] text-white shadow-xs'
                : 'text-[#475569] hover:bg-[#EEF2F6]'
            )}
          >
            All Sensors ({nodes.length})
          </button>
          {SENSOR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={clsx(
                'px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5 whitespace-nowrap',
                categoryFilter === cat.id
                  ? 'bg-[#0B6E4F] text-white font-bold shadow-xs'
                  : 'text-[#475569] hover:bg-[#EEF2F6]'
              )}
            >
              <span>{cat.icon}</span>
              <span className="hidden md:inline">{cat.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Right: Layer Controls & Placement Trigger */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xs border border-[#CBD5E1] rounded-2xl p-1.5 shadow-md flex items-center gap-2">
          <button
            onClick={() => setShowRings(!showRings)}
            className={clsx(
              'px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors',
              showRings ? 'bg-[#E8F5E9] text-[#0B6E4F] font-bold' : 'text-[#94A3B8]'
            )}
          >
            ⭕ Correlation Rings
          </button>
          <button
            onClick={() => setShowWind(!showWind)}
            className={clsx(
              'px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors',
              showWind ? 'bg-[#E8F5E9] text-[#0B6E4F] font-bold' : 'text-[#94A3B8]'
            )}
          >
            💨 Wind Plume
          </button>
          <button
            onClick={() => setPlacementMode(!placementMode)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-xs flex items-center gap-1',
              placementMode
                ? 'bg-[#C62828] text-white animate-pulse'
                : 'bg-[#0B6E4F] hover:bg-[#08573F] text-white'
            )}
          >
            <span>{placementMode ? '✕ Cancel' : '📍 Click Map to Deploy'}</span>
          </button>
        </div>
      </div>

      {/* ─── Bottom-Left: 24h Time Scrubber Slider ──────────────────────── */}
      <div className="absolute bottom-6 left-4 z-[500] bg-white/95 backdrop-blur-xs border border-[#CBD5E1] rounded-2xl p-4 shadow-lg w-80 space-y-2 pointer-events-auto font-sans">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
            <span>⏱️</span> 24h Spatial Event Replay
          </span>
          <span className="text-[#0B6E4F] font-bold">
            {timeHour === 24 ? 'LIVE (Now)' : `T - ${24 - timeHour}h`}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          value={timeHour}
          onChange={(e) => setTimeHour(parseInt(e.target.value))}
          className="w-full accent-[#0B6E4F] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
          <span>-24 hours</span>
          <span>-12h</span>
          <span>Live Telemetry</span>
        </div>
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
      />

      {/* ─── Modal for Click-to-Deploy Sensor ───────────────────────────── */}
      {clickedCoords && (
        <DeploymentModal
          point={clickedCoords}
          onClose={() => setClickedCoords(null)}
          onConfirm={(sensorData) => {
            addNode(sensorData)
            setClickedCoords(null)
            setPlacementMode(false)
          }}
        />
      )}
    </div>
  )
}

function DeploymentModal({ point, onClose, onConfirm }) {
  const detected = detectGujaratLandmark(point.lat, point.lng)
  const [sensorType, setSensorType] = useState('Flood & Water Level')
  const [nodeName, setNodeName] = useState(
    detected.isNearby ? `${detected.name.split(',')[0]} Sentinel` : `Sensor Node (${point.lat.toFixed(3)}, ${point.lng.toFixed(3)})`
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({
      name: nodeName,
      category: detected.category || 'flood',
      sensor_type: sensorType,
      region: detected.region || 'ahmedabad',
      location: detected.name,
      latitude: point.lat,
      longitude: point.lng,
      connectivity: 'WiFi 6 + LoRa Mesh (Auto GPS)',
      battery_pct: 100,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in font-sans">
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3E8EF] pb-3">
          <div>
            <h3 className="font-bold text-base text-[#0F172A]">Deploy Node at Selected GPS</h3>
            <p className="text-[11px] text-[#475569] font-mono">Gujarat Geographic Mesh Layer</p>
          </div>
          <button onClick={onClose} className="text-[#475569]">✕</button>
        </div>

        <div className="bg-[#F7F9FB] border border-[#CBD5E1] p-3 rounded-xl text-xs space-y-1 font-mono">
          <div>GPS: <b className="text-[#0B6E4F]">{point.lat.toFixed(4)}° N, {point.lng.toFixed(4)}° E</b></div>
          <div>Asset Match: <b className="text-[#0F172A]">{detected.distanceText}</b></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[#475569] font-mono block mb-1 font-bold">Node Name</label>
            <input
              type="text"
              required
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
            />
          </div>

          <div>
            <label className="text-[#475569] font-mono block mb-1 font-bold">Sensor Bay Category</label>
            <select
              value={sensorType}
              onChange={(e) => setSensorType(e.target.value)}
              className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
            >
              {SENSOR_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#0B6E4F] hover:bg-[#08573F] text-white font-bold py-2 rounded-xl font-mono shadow-xs"
            >
              Confirm Deployment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 bg-[#F7F9FB] text-[#475569] rounded-xl font-mono border border-[#CBD5E1]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
