// pages/MapPage.jsx — Real Dynamic Gujarat Tactical GIS Map & Sensor Deployment Console

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  Polygon,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore, detectGujaratLandmark, SENSOR_TYPES, AI_HOTSPOT_SUGGESTIONS } from '../store/useStore'
import clsx from 'clsx'

// Real Gujarat Geographical Center & Bounds
const GUJARAT_CENTER = [22.85, 71.95]
const DEFAULT_ZOOM = 8

// Quick District & Regional Navigators across Gujarat
const GUJARAT_REGIONS = [
  { name: 'All Gujarat', center: [22.85, 71.95], zoom: 8, icon: 'public' },
  { name: 'Ahmedabad', center: [23.03, 72.58], zoom: 12, icon: 'apartment' },
  { name: 'Gandhinagar', center: [23.22, 72.65], zoom: 13, icon: 'account_balance' },
  { name: 'Surat', center: [21.19, 72.83], zoom: 12, icon: 'water' },
  { name: 'Vadodara', center: [22.31, 73.18], zoom: 12, icon: 'factory' },
  { name: 'Rajkot', center: [22.30, 70.80], zoom: 12, icon: 'location_city' },
  { name: 'Bharuch', center: [21.71, 72.99], zoom: 12, icon: 'bridge' },
  { name: 'Kutch / Bhuj', center: [23.25, 69.67], zoom: 11, icon: 'terrain' },
]

// Map Tile Providers
const TILE_LAYERS = {
  dark: {
    name: 'Tactical Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
    attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics',
    maxZoom: 18,
  },
  street: {
    name: 'Street Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
}

// Real Gujarat Catchment Basins
const GUJARAT_BASINS = [
  {
    name: 'Sabarmati River Flood Catchment (Ahmedabad - Gandhinagar Corridor)',
    type: 'flood',
    color: '#00e5ff',
    coords: [
      [23.27, 72.68], [23.24, 72.67], [23.18, 72.63], [23.12, 72.60],
      [23.05, 72.58], [22.98, 72.54], [22.88, 72.48], [22.75, 72.42],
      [22.78, 72.55], [22.92, 72.62], [23.04, 72.64], [23.15, 72.67], [23.27, 72.72]
    ],
  },
  {
    name: 'Tapi River Basin & Surat Coastal Estuary',
    type: 'flood',
    color: '#38bdf8',
    coords: [
      [21.28, 73.12], [21.22, 72.95], [21.19, 72.82], [21.16, 72.71],
      [21.10, 72.68], [21.12, 72.82], [21.17, 72.96], [21.24, 73.15]
    ],
  },
  {
    name: 'Narmada River Basin (Bharuch - Golden Bridge)',
    type: 'flood',
    color: '#6bd8cb',
    coords: [
      [21.75, 73.15], [21.72, 73.04], [21.69, 72.96], [21.64, 72.85],
      [21.60, 72.74], [21.64, 72.72], [21.72, 72.92], [21.76, 73.08]
    ],
  },
  {
    name: 'Narol-Vatva Chemical Industrial Emissions Corridor',
    type: 'pollution',
    color: '#a855f7',
    coords: [
      [22.995, 72.575], [22.982, 72.610], [22.950, 72.618],
      [22.942, 72.580], [22.965, 72.565]
    ],
  },
]

// Central Emergency Gateways in Gujarat
const GUJARAT_GATEWAYS = [
  { id: 'GW-GNR', name: 'GSDMA Central Command Hub, Gandhinagar', lat: 23.2156, lng: 72.6369, zone: 'GNR HQ' },
  { id: 'GW-AHD', name: 'AMC Disaster Management Control, Ahmedabad', lat: 23.0275, lng: 72.5850, zone: 'AHD HQ' },
  { id: 'GW-SRT', name: 'SMC Coastal Emergency Hub, Surat', lat: 21.1702, lng: 72.8311, zone: 'SRT HQ' },
  { id: 'GW-VAD', name: 'VMC Industrial Operations Cell, Vadodara', lat: 22.3072, lng: 73.1812, zone: 'VAD HQ' },
]

function MapFlyController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 })
    }
  }, [center, zoom, map])
  return null
}

function MapEventsHandler({ onMapClick, onMouseMove }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng)
    },
    mousemove: (e) => {
      if (onMouseMove) onMouseMove(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function formatNodeForDrawer(node) {
  if (!node) return null
  const maxRisk = Math.max(node.risk_flood || 0, node.risk_fire || 0, node.risk_pollution || 0)
  const isCritical = maxRisk >= 70 || node.status === 'critical'
  const isWarning = (maxRisk >= 35 && maxRisk < 70) || node.status === 'warning'
  const isOffline = node.status === 'offline'

  let statusText = 'NORMAL'
  let badgeBg = 'bg-primary'
  let badgeText = 'text-primary'

  if (isCritical) {
    statusText = 'CRITICAL'
    badgeBg = 'bg-error'
    badgeText = 'text-error'
  } else if (isWarning) {
    statusText = 'WARNING'
    badgeBg = 'bg-secondary'
    badgeText = 'text-secondary'
  } else if (isOffline) {
    statusText = 'OFFLINE'
    badgeBg = 'bg-outline'
    badgeText = 'text-outline'
  }

  const waterCm = node.water_level_cm != null ? node.water_level_cm : 20.0
  const tempC = node.temperature_c != null ? node.temperature_c : 29.4
  const humPct = node.humidity_pct != null ? node.humidity_pct : 64
  const aqiVal = node.smoke_aqi != null ? node.smoke_aqi : 42

  return {
    id: node.node_id || node.id || 'S-001',
    name: node.name || 'Tactical Sensor Probe',
    status: statusText,
    zone: (node.city ? (node.city.toUpperCase() + ' • ') : '') + (node.location || node.location_desc || 'GUJARAT SURVEILLANCE GRID').toUpperCase(),
    deviceTag: '#ENV-' + (node.node_id || '001'),
    temp: typeof tempC === 'number' ? tempC.toFixed(1) : String(tempC),
    tempDiff: node.tempDiff || '+1.6°C vs baseline',
    humidity: typeof humPct === 'number' ? String(humPct) : '64',
    humidityState: humPct > 80 ? 'Saturated / Heavy' : humPct > 60 ? 'Moderate Humidity' : 'Nominal Range',
    aqi: typeof aqiVal === 'number' ? String(aqiVal) : '42',
    aqiState: aqiVal > 200 ? 'Severe Hazardous' : aqiVal > 100 ? 'Unhealthy Spikes' : aqiVal > 60 ? 'Moderate Alert' : 'Good Air Quality',
    water: typeof waterCm === 'number' ? (waterCm / 100).toFixed(2) : '0.45',
    waterMargin: isCritical ? 'SURGE CREST BREACH (+0.4m)' : isWarning ? 'ELEVATED FLOW (+0.2m)' : 'Crest Margin: +1.8m (Nominal)',
    battery: node.battery_pct != null ? String(node.battery_pct) : '92',
    batteryState: node.solar_charging ? 'Solar Trickle ON' : 'Battery Reserve Nominal',
    signal: node.rssi != null ? (node.rssi + ' dBm') : '-72 dBm',
    signalState: node.connection || 'LoRaWAN SF7 (Reliable)',
    lastUpdate: node.last_update || '4 sec ago',
    badgeBg,
    badgeText,
    isCritical,
    isWarning,
    isOffline,
    latitude: node.latitude,
    longitude: node.longitude,
    raw: node,
  }
}

export default function MapPage() {
  const nodes = useStore((s) => s.nodes)
  const addSensor = useStore((s) => s.addSensor)
  const aiHotspots = useStore((s) => s.aiHotspots) || AI_HOTSPOT_SUGGESTIONS

  const [flyoutOpen, setFlyoutOpen] = useState(true)
  const [selectedSensorId, setSelectedSensorId] = useState('S-001')
  const [searchQuery, setSearchQuery] = useState('')
  const [threatFilter, setThreatFilter] = useState('ALL')
  const [tileMode, setTileMode] = useState('dark')
  const [placementMode, setPlacementMode] = useState(false)
  const [deploySuccessMsg, setDeploySuccessMsg] = useState('')

  const [cursorCoords, setCursorCoords] = useState({ lat: 23.0300, lng: 72.5800 })
  const [mapTarget, setMapTarget] = useState({ center: GUJARAT_CENTER, zoom: DEFAULT_ZOOM })

  const [chosenSpot, setChosenSpot] = useState(null)
  const [chosenType, setChosenType] = useState('Water Level / Flood')
  const [customNodeName, setCustomNodeName] = useState('')

  const effectiveNodes = useMemo(() => {
    if (nodes && nodes.length > 0) return nodes
    return [
      {
        node_id: 'S-001',
        name: 'Sensor S-001 (Air Sentinel)',
        type: 'Air Quality / Gas',
        city: 'Ahmedabad',
        location: 'Narol-Vatva Industrial Zone, Ahmedabad',
        latitude: 22.9734,
        longitude: 72.5898,
        battery_pct: 88,
        solar_charging: true,
        rssi: -68,
        connection: 'LoRa Mesh (GPS Sync)',
        status: 'warning',
        risk_flood: 12,
        risk_fire: 14,
        risk_pollution: 65,
        water_level_cm: 20.0,
        temperature_c: 29.2,
        humidity_pct: 62,
        smoke_aqi: 142,
        last_update: '4 sec ago',
      },
      {
        node_id: 'S-002',
        name: 'Sensor S-002 (Water Sentinel)',
        type: 'Water Level / Flood',
        city: 'Gandhinagar',
        location: 'Sant Sarovar Dam / Sabarmati, Gandhinagar',
        latitude: 23.2385,
        longitude: 72.6710,
        battery_pct: 94,
        solar_charging: true,
        rssi: -71,
        connection: 'LoRa Mesh (GPS Sync)',
        status: 'warning',
        risk_flood: 62,
        risk_fire: 6,
        risk_pollution: 16,
        water_level_cm: 180.0,
        temperature_c: 27.0,
        humidity_pct: 78,
        smoke_aqi: 24,
        last_update: '6 sec ago',
      },
      {
        node_id: 'S-003',
        name: 'Sensor S-003 (Forest Sentinel)',
        type: 'Thermal & Flame',
        city: 'Gandhinagar',
        location: 'Indroda Nature Park & Green Belt',
        latitude: 23.1950,
        longitude: 72.6520,
        battery_pct: 82,
        solar_charging: false,
        rssi: -79,
        connection: 'LoRa Multi-Hop (GPS Sync)',
        status: 'online',
        risk_flood: 5,
        risk_fire: 28,
        risk_pollution: 18,
        water_level_cm: 15.0,
        temperature_c: 34.2,
        humidity_pct: 42,
        smoke_aqi: 38,
        last_update: '12 sec ago',
      },
      {
        node_id: 'S-004',
        name: 'Sensor S-004 (Tapi Hydro Probe)',
        type: 'Water Level / Flood',
        city: 'Surat',
        location: 'Tapi River Weir Causeway, Surat',
        latitude: 21.1959,
        longitude: 72.8302,
        battery_pct: 96,
        solar_charging: true,
        rssi: -61,
        connection: 'LoRaWAN SF7 (Strong)',
        status: 'online',
        risk_flood: 25,
        risk_fire: 4,
        risk_pollution: 30,
        water_level_cm: 85.0,
        temperature_c: 28.5,
        humidity_pct: 74,
        smoke_aqi: 45,
        last_update: '8 sec ago',
      },
      {
        node_id: 'S-005',
        name: 'Sensor S-005 (Petrochemical Sentinel)',
        type: 'Gas & Chemical Pollution',
        city: 'Vadodara',
        location: 'Nandesari Petrochemical Belt, Vadodara',
        latitude: 22.4110,
        longitude: 73.0980,
        battery_pct: 79,
        solar_charging: true,
        rssi: -68,
        connection: 'LoRaWAN SF7',
        status: 'warning',
        risk_flood: 10,
        risk_fire: 22,
        risk_pollution: 58,
        water_level_cm: 22.0,
        temperature_c: 30.1,
        humidity_pct: 54,
        smoke_aqi: 158,
        last_update: '14 sec ago',
      },
      {
        node_id: 'S-014',
        name: 'Sensor S-014 (Vasna Flood Sluice)',
        type: 'Water Level / Flood',
        city: 'Ahmedabad',
        location: 'Vasna Barrage Sluice Gates, Ahmedabad',
        latitude: 22.9860,
        longitude: 72.5510,
        battery_pct: 76,
        solar_charging: true,
        rssi: -91,
        connection: 'LoRaWAN SF10 (Weak)',
        status: 'critical',
        risk_flood: 88,
        risk_fire: 10,
        risk_pollution: 40,
        water_level_cm: 284.0,
        temperature_c: 38.4,
        humidity_pct: 92,
        smoke_aqi: 64,
        last_update: '2 sec ago',
      },
      {
        node_id: 'S-008',
        name: 'Sensor S-008 (Aji Dam Monitor)',
        type: 'Water Level / Flood',
        city: 'Rajkot',
        location: 'Aji Dam Catchment, Rajkot',
        latitude: 22.2580,
        longitude: 70.8320,
        battery_pct: 91,
        solar_charging: true,
        rssi: -73,
        connection: 'LoRaWAN SF7',
        status: 'online',
        risk_flood: 18,
        risk_fire: 12,
        risk_pollution: 20,
        water_level_cm: 60.0,
        temperature_c: 29.8,
        humidity_pct: 58,
        smoke_aqi: 35,
        last_update: '18 sec ago',
      },
      {
        node_id: 'S-009',
        name: 'Sensor S-009 (Narmada River Watch)',
        type: 'Water Level / Flood',
        city: 'Bharuch',
        location: 'Golden Bridge / Narmada River, Bharuch',
        latitude: 21.7050,
        longitude: 72.9880,
        battery_pct: 88,
        solar_charging: true,
        rssi: -66,
        connection: 'LoRaWAN SF7',
        status: 'warning',
        risk_flood: 48,
        risk_fire: 8,
        risk_pollution: 28,
        water_level_cm: 140.0,
        temperature_c: 28.2,
        humidity_pct: 70,
        smoke_aqi: 48,
        last_update: '22 sec ago',
      },
      {
        node_id: 'S-031',
        name: 'Sensor S-031 (Gulf Estuary Logger)',
        type: 'Submersible Marine',
        city: 'Khambhat',
        location: 'Gulf of Khambhat Estuary Delta',
        latitude: 21.6500,
        longitude: 72.5500,
        battery_pct: 0,
        solar_charging: false,
        rssi: null,
        connection: 'Link Terminated',
        status: 'offline',
        risk_flood: 0,
        risk_fire: 0,
        risk_pollution: 0,
        water_level_cm: null,
        temperature_c: null,
        humidity_pct: null,
        smoke_aqi: null,
        last_update: '18 hrs ago',
      },
    ]
  }, [nodes])

  const [layers, setLayers] = useState({
    topography: true,
    heatmap: true,
    mesh: true,
    basins: true,
    aiSuggestions: true,
  })

  const selectedNodeRaw = useMemo(() => {
    return (
      effectiveNodes.find((n) => (n.node_id || n.id) === selectedSensorId) ||
      effectiveNodes[0]
    )
  }, [effectiveNodes, selectedSensorId])

  const selectedSensor = useMemo(() => {
    return formatNodeForDrawer(selectedNodeRaw)
  }, [selectedNodeRaw])

  const filteredNodes = useMemo(() => {
    return effectiveNodes.filter((node) => {
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        (node.node_id && node.node_id.toLowerCase().includes(q)) ||
        (node.name && node.name.toLowerCase().includes(q)) ||
        (node.city && node.city.toLowerCase().includes(q)) ||
        (node.location && node.location.toLowerCase().includes(q))

      if (!matchSearch) return false

      if (threatFilter === 'FLOOD') return (node.risk_flood || 0) >= 30 || (node.type || '').includes('Water')
      if (threatFilter === 'FIRE') return (node.risk_fire || 0) >= 20 || (node.type || '').includes('Thermal') || (node.type || '').includes('Fire')
      if (threatFilter === 'POLLUTION') return (node.risk_pollution || 0) >= 35 || (node.type || '').includes('Air') || (node.type || '').includes('Gas')

      return true
    })
  }, [effectiveNodes, searchQuery, threatFilter])

  const counts = useMemo(() => {
    let normal = 0, warning = 0, critical = 0, offline = 0
    effectiveNodes.forEach((n) => {
      const maxRisk = Math.max(n.risk_flood || 0, n.risk_fire || 0, n.risk_pollution || 0)
      if (n.status === 'offline') offline++
      else if (maxRisk >= 70 || n.status === 'critical') critical++
      else if (maxRisk >= 35 || n.status === 'warning') warning++
      else normal++
    })
    return { normal, warning, critical, offline }
  }, [effectiveNodes])

  const handleMapClick = (lat, lng) => {
    const landmark = detectGujaratLandmark(lat, lng)
    const suggestedName = landmark.isNearby
      ? ('Sensor S-0' + (effectiveNodes.length + 1) + ' (' + landmark.name.split(',')[0] + ')')
      : ('Sensor S-0' + (effectiveNodes.length + 1) + ' (Gujarat Grid)')

    setChosenSpot({
      lat,
      lng,
      landmarkName: landmark.name,
      isNearby: landmark.isNearby,
      distanceText: landmark.distanceText,
    })
    setCustomNodeName(suggestedName)
    setPlacementMode(true)
  }

  const handleDeploySensor = (e) => {
    if (e) e.preventDefault()
    if (!chosenSpot) return

    const newId = 'S-0' + (effectiveNodes.length + 1)
    let cityDetected = 'Gujarat Network'
    if (chosenSpot.landmarkName.includes('Ahmedabad')) cityDetected = 'Ahmedabad'
    else if (chosenSpot.landmarkName.includes('Gandhinagar')) cityDetected = 'Gandhinagar'
    else if (chosenSpot.landmarkName.includes('Surat')) cityDetected = 'Surat'
    else if (chosenSpot.landmarkName.includes('Vadodara')) cityDetected = 'Vadodara'
    else if (chosenSpot.landmarkName.includes('Rajkot')) cityDetected = 'Rajkot'
    else if (chosenSpot.landmarkName.includes('Bharuch')) cityDetected = 'Bharuch'

    const newNode = {
      node_id: newId,
      name: customNodeName || ('Sensor ' + newId + ' (' + cityDetected + ')'),
      type: chosenType,
      city: cityDetected,
      location: chosenSpot.landmarkName,
      location_desc: 'Field deployment at ' + chosenSpot.landmarkName + ' (' + chosenSpot.lat.toFixed(4) + '° N, ' + chosenSpot.lng.toFixed(4) + '° E)',
      latitude: chosenSpot.lat,
      longitude: chosenSpot.lng,
      battery_pct: 100,
      solar_charging: true,
      rssi: -65,
      connection: 'LoRa Mesh (GPS Active)',
      status: 'online',
      water_level_cm: chosenType.includes('Water') ? 35.0 : 15.0,
      temperature_c: 28.6,
      humidity_pct: 65,
      smoke_aqi: chosenType.includes('Air') ? 54 : 32,
      risk_flood: chosenType.includes('Water') ? 22 : 8,
      risk_fire: (chosenType.includes('Thermal') || chosenType.includes('Fire')) ? 20 : 6,
      risk_pollution: (chosenType.includes('Air') || chosenType.includes('Gas')) ? 28 : 10,
      last_update: 'Just installed',
    }

    addSensor(newNode)
    setSelectedSensorId(newId)
    setFlyoutOpen(true)
    setDeploySuccessMsg('✓ Successfully deployed ' + newNode.name + ' at ' + chosenSpot.landmarkName)
    setChosenSpot(null)
    setPlacementMode(false)

    setTimeout(() => {
      setDeploySuccessMsg('')
    }, 4000)
  }

  const handleInstallHotspot = (hotspot) => {
    const newId = 'S-0' + (effectiveNodes.length + 1)
    const newNode = {
      node_id: newId,
      name: 'Sensor ' + newId + ' (' + hotspot.name.split(',')[0] + ')',
      type: hotspot.sensor_type,
      city: hotspot.city,
      location: hotspot.name,
      location_desc: hotspot.ai_rationale,
      latitude: hotspot.lat,
      longitude: hotspot.lng,
      battery_pct: 100,
      solar_charging: true,
      rssi: -64,
      connection: 'LoRa Mesh (Auto-Provisioned)',
      status: 'online',
      water_level_cm: hotspot.recommended_for === 'water' ? 42.0 : 18.0,
      temperature_c: 28.0,
      humidity_pct: 68,
      smoke_aqi: hotspot.recommended_for === 'air' ? 58 : 34,
      risk_flood: hotspot.recommended_for === 'water' ? 26 : 8,
      risk_fire: hotspot.recommended_for === 'fire' ? 24 : 6,
      risk_pollution: (hotspot.recommended_for === 'air' || hotspot.recommended_for === 'gas') ? 32 : 12,
      last_update: 'Just installed',
    }

    addSensor(newNode)
    setSelectedSensorId(newId)
    setMapTarget({ center: [hotspot.lat, hotspot.lng], zoom: 14 })
    setFlyoutOpen(true)
    setDeploySuccessMsg('✓ AI Placement Active: Deployed ' + newNode.name)
    setTimeout(() => setDeploySuccessMsg(''), 4000)
  }

  return (
    <div style={{position:'relative', width:'100%', height:'calc(100vh - 4rem)', backgroundColor:'#080d09', overflow:'hidden', display:'flex', flexDirection:'column', userSelect:'none'}}>
      {/* ─── Top Tactical Filter & Action Bar ───────────────────────────────── */}
      <div style={{height:'3rem', borderBottom:'1px solid #1a261d', backgroundColor:'rgba(16,24,18,0.95)', backdropFilter:'blur(12px)', padding:'0 1rem', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:30, boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'0.75rem', flex:1}}>
          <div style={{position:'relative', width:'18rem'}}>
            <span className="material-symbols-outlined" style={{position:'absolute', left:'0.625rem', top:'50%', transform:'translateY(-50%)', fontSize:'18px', color:'#839587'}}>
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Gujarat City, Area (e.g. Sabarmati, Surat)..."
              style={{width:'100%', backgroundColor:'#152018', borderRadius:'4px', paddingLeft:'2rem', paddingRight:'0.5rem', paddingTop:'0.25rem', paddingBottom:'0.25rem', fontFamily:'monospace', fontSize:'11px', color:'#e1e7e2', border:'1px solid #1a261d', outline:'none'}}
            />
          </div>

          <div style={{height:'1rem', width:'1px', backgroundColor:'#1a261d'}} className="hidden md:block"></div>

          <div className="hidden lg:flex" style={{alignItems:'center', gap:'1rem', fontFamily:'monospace', fontSize:'11px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.375rem'}}>
              <span style={{width:'8px', height:'8px', borderRadius:'9999px', backgroundColor:'#96d5a3'}}></span>
              <span style={{color:'#839587', textTransform:'uppercase', fontSize:'10px'}}>Normal</span>
              <span style={{fontWeight:'bold', color:'#e1e7e2'}}>{counts.normal}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'0.375rem'}}>
              <span style={{width:'8px', height:'8px', borderRadius:'9999px', backgroundColor:'#ffb77d'}}></span>
              <span style={{color:'#839587', textTransform:'uppercase', fontSize:'10px'}}>Warning</span>
              <span style={{fontWeight:'bold', color:'#ffb77d'}}>{counts.warning}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'0.375rem'}}>
              <span style={{width:'8px', height:'8px', borderRadius:'9999px', backgroundColor:'#ffb4ab'}} className="animate-pulse"></span>
              <span style={{color:'#839587', textTransform:'uppercase', fontSize:'10px'}}>Critical</span>
              <span style={{fontWeight:'bold', color:'#ffb4ab'}}>{counts.critical}</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'0.375rem'}}>
              <span style={{width:'8px', height:'8px', borderRadius:'9999px', backgroundColor:'#839587'}}></span>
              <span style={{color:'#839587', textTransform:'uppercase', fontSize:'10px'}}>Offline</span>
              <span style={{fontWeight:'bold', color:'#839587'}}>{counts.offline}</span>
            </div>
          </div>

          <div style={{height:'1rem', width:'1px', backgroundColor:'#1a261d'}} className="hidden xl:block"></div>

          <button
            onClick={() => setPlacementMode(!placementMode)}
            style={placementMode
              ? { backgroundColor: '#96d5a3', color: '#00210d', borderColor: '#96d5a3' }
              : { backgroundColor: '#152018', color: '#96d5a3', borderColor: 'rgba(150,213,163,0.3)' }
            }
            className="px-3 py-1 rounded text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
            <span>{placementMode ? 'Click Anywhere on Gujarat Map' : '➕ Choose Area to Install Sensor'}</span>
          </button>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'0.375rem'}}>
          <button
            onClick={() => setThreatFilter('ALL')}
            className={clsx(
              'px-2.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer',
              threatFilter === 'ALL'
                ? 'bg-primary-container text-primary border border-primary/30'
                : 'text-[#839587] hover:text-[#e1e7e2]'
            )}
          >
            ALL THREATS
          </button>
          <button
            onClick={() => setThreatFilter('FLOOD')}
            className={clsx(
              'px-2.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer',
              threatFilter === 'FLOOD'
                ? 'bg-tertiary-container text-tertiary border border-tertiary/30'
                : 'text-[#839587] hover:text-[#e1e7e2]'
            )}
          >
            <span style={{width:'6px', height:'6px', borderRadius:'9999px', backgroundColor:'#6bd8cb'}}></span>
            FLOOD
          </button>
          <button
            onClick={() => setThreatFilter('FIRE')}
            className={clsx(
              'px-2.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer',
              threatFilter === 'FIRE'
                ? 'bg-secondary-container text-secondary border border-secondary/30'
                : 'text-[#839587] hover:text-[#e1e7e2]'
            )}
          >
            <span style={{width:'6px', height:'6px', borderRadius:'9999px', backgroundColor:'#ffb77d'}}></span>
            FIRE / SMOKE
          </button>
          <button
            onClick={() => setThreatFilter('POLLUTION')}
            className={clsx(
              'px-2.5 py-0.5 rounded text-[10px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer',
              threatFilter === 'POLLUTION'
                ? 'bg-[#243729] text-[#e1e7e2] border border-[#839587]/30'
                : 'text-[#839587] hover:text-[#e1e7e2]'
            )}
          >
            <span style={{width:'6px', height:'6px', borderRadius:'9999px', backgroundColor:'#a855f7'}}></span>
            POLLUTION
          </button>
        </div>
      </div>

      {deploySuccessMsg && (
        <div style={{position:'absolute', top:'3.5rem', left:'50%', transform:'translateX(-50%)', zIndex:50, backgroundColor:'#14532d', color:'#96d5a3', padding:'0.5rem 1rem', borderRadius:'0.75rem', border:'1px solid rgba(150,213,163,0.4)', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.5)', fontFamily:'monospace', fontSize:'12px', display:'flex', alignItems:'center', gap:'0.5rem'}} className="animate-bounce">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{deploySuccessMsg}</span>
        </div>
      )}

      {/* ─── Main Map Viewport ──────────────────────────────────────────────── */}
      <div style={{position:'relative', flex:1, width:'100%', overflow:'hidden', backgroundColor:'#0c120e'}}>
        <MapContainer
          center={GUJARAT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%', backgroundColor: '#0c120e' }}
          className="z-0"
          zoomControl={false}
        >
          <TileLayer
            key={tileMode}
            url={TILE_LAYERS[tileMode].url}
            attribution={TILE_LAYERS[tileMode].attribution}
            maxZoom={TILE_LAYERS[tileMode].maxZoom}
          />

          <MapFlyController center={mapTarget.center} zoom={mapTarget.zoom} />

          <MapEventsHandler
            onMapClick={handleMapClick}
            onMouseMove={(lat, lng) => setCursorCoords({ lat, lng })}
          />

          {layers.basins &&
            GUJARAT_BASINS.map((basin, idx) => (
              <Polygon
                key={'basin-' + idx}
                positions={basin.coords}
                pathOptions={{
                  color: basin.color,
                  fillColor: basin.color,
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4 6',
                }}
              >
                <Tooltip sticky>
                  <div style={{fontFamily:'monospace', fontSize:'11px', backgroundColor:'#080d09', color:'#e1e7e2', padding:'6px', borderRadius:'4px', border:'1px solid #1a261d'}}>
                    <div style={{fontWeight:'bold', color:'#96d5a3', display:'flex', alignItems:'center', gap:'4px'}}>
                      <span>🌊</span> {basin.name}
                    </div>
                    <div style={{fontSize:'10px', color:'#839587', marginTop:'2px'}}>Automated Hydrological Catchment Watch</div>
                  </div>
                </Tooltip>
              </Polygon>
            ))}

          {layers.mesh &&
            filteredNodes.map((node) => {
              let gw = GUJARAT_GATEWAYS[0]
              if (node.city === 'Ahmedabad') gw = GUJARAT_GATEWAYS[1]
              else if (node.city === 'Surat') gw = GUJARAT_GATEWAYS[2]
              else if (node.city === 'Vadodara') gw = GUJARAT_GATEWAYS[3]

              return (
                <Polyline
                  key={'mesh-link-' + (node.node_id || node.id)}
                  positions={[
                    [node.latitude, node.longitude],
                    [gw.lat, gw.lng],
                  ]}
                  pathOptions={{
                    color: node.status === 'critical' ? '#ffb4ab' : '#96d5a3',
                    weight: 1.5,
                    dashArray: '3 6',
                    opacity: 0.45,
                  }}
                />
              )
            })}

          {GUJARAT_GATEWAYS.map((gw) => (
            <CircleMarker
              key={gw.id}
              center={[gw.lat, gw.lng]}
              radius={7}
              pathOptions={{
                color: '#6bd8cb',
                fillColor: '#00403a',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Tooltip permanent={false} direction="top">
                <div style={{fontFamily:'monospace', fontSize:'11px', backgroundColor:'#080d09', color:'#e1e7e2', padding:'6px', borderRadius:'4px', border:'1px solid #1a261d'}}>
                  <div style={{color:'#6bd8cb', fontWeight:'bold'}}>📡 {gw.name}</div>
                  <div style={{fontSize:'10px', color:'#839587'}}>Regional LoRaWAN Mesh Gateway Hub</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {layers.aiSuggestions &&
            aiHotspots.map((hotspot) => (
              <CircleMarker
                key={hotspot.id}
                center={[hotspot.lat, hotspot.lng]}
                radius={8}
                pathOptions={{
                  color: '#ffb77d',
                  fillColor: '#542d00',
                  fillOpacity: 0.7,
                  weight: 2,
                  dashArray: '3 4',
                }}
              >
                <Popup>
                  <div style={{fontFamily:'monospace', fontSize:'12px', color:'#e1e7e2', padding:'4px', minWidth:'240px', backgroundColor:'#152018', borderRadius:'6px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#ffb77d', fontWeight:'bold', fontSize:'11px', marginBottom:'4px'}}>
                      <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                      <span>AI PLACEMENT RECOMMENDATION</span>
                    </div>
                    <div style={{fontWeight:'bold', fontSize:'14px', color:'#e1e7e2', marginBottom:'4px'}}>{hotspot.name}</div>
                    <div style={{fontSize:'11px', color:'#96d5a3', marginBottom:'6px', fontWeight:'600'}}>
                      Suggested Type: {hotspot.sensor_type}
                    </div>
                    <div style={{backgroundColor:'#080d09', padding:'8px', borderRadius:'4px', border:'1px solid #1a261d', fontSize:'10px', color:'#839587', fontFamily:'sans-serif', marginBottom:'10px'}}>
                      {hotspot.ai_rationale}
                    </div>
                    <button
                      onClick={() => handleInstallHotspot(hotspot)}
                      style={{width:'100%', padding:'6px', backgroundColor:'#14532d', color:'#96d5a3', fontWeight:'bold', borderRadius:'6px', border:'1px solid rgba(150,213,163,0.3)', transition:'background-color 0.15s', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px'}}
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      <span>Install Sensor Here (1-Click)</span>
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {chosenSpot && (
            <CircleMarker
              center={[chosenSpot.lat, chosenSpot.lng]}
              radius={14}
              pathOptions={{
                color: '#96d5a3',
                fillColor: '#14532d',
                fillOpacity: 0.85,
                weight: 3,
                dashArray: '2 4',
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -12]}>
                <div style={{fontSize:'10px', fontFamily:'monospace', backgroundColor:'#080d09', color:'#96d5a3', padding:'2px 8px', borderRadius:'4px', border:'1px solid #96d5a3', fontWeight:'bold', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.5)', display:'flex', alignItems:'center', gap:'4px'}}>
                  <span>📍</span> Chosen Area for Sensor
                </div>
              </Tooltip>
            </CircleMarker>
          )}

          {filteredNodes.map((node) => {
            const isSelected = (node.node_id || node.id) === selectedSensorId
            const maxRisk = Math.max(node.risk_flood || 0, node.risk_fire || 0, node.risk_pollution || 0)
            const isCritical = maxRisk >= 70 || node.status === 'critical'
            const isWarning = (maxRisk >= 35 && maxRisk < 70) || node.status === 'warning'
            const isOffline = node.status === 'offline'

            let pinColor = '#96d5a3'
            if (isCritical) pinColor = '#ffb4ab'
            else if (isWarning) pinColor = '#ffb77d'
            else if (isOffline) pinColor = '#839587'

            return (
              <CircleMarker
                key={node.node_id || node.id}
                center={[node.latitude, node.longitude]}
                radius={isSelected ? 14 : isCritical ? 12 : 9}
                pathOptions={{
                  color: isSelected ? '#ffffff' : pinColor,
                  fillColor: pinColor,
                  fillOpacity: 0.85,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedSensorId(node.node_id || node.id)
                    setFlyoutOpen(true)
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div style={{fontFamily:'monospace', fontSize:'11px', backgroundColor:'#080d09', color:'#e1e7e2', padding:'6px', borderRadius:'4px', border:'1px solid #1a261d'}}>
                    <div style={{fontWeight:'bold', display:'flex', alignItems:'center', gap:'6px', color: pinColor }}>
                      <span style={{width:'8px', height:'8px', borderRadius:'9999px', backgroundColor: pinColor }}></span>
                      <span>{(node.node_id || node.id)}: {node.name}</span>
                    </div>
                    <div style={{fontSize:'10px', color:'#839587', marginTop:'2px'}}>
                      {node.city} • {node.type}
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* ─── Floating Layer Stack Controller (Top-Left) ──────────────────── */}
        <div style={{position:'absolute', top:'1rem', left:'1rem', zIndex:30, width:'16rem', backgroundColor:'rgba(16,24,18,0.95)', backdropFilter:'blur(12px)', borderRadius:'0.75rem', padding:'0.75rem', border:'1px solid #1a261d', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.5)', color:'#e1e7e2', fontFamily:'monospace'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1a261d', paddingBottom:'0.5rem', marginBottom:'0.625rem'}}>
            <span style={{fontWeight:'bold', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', color:'#839587', display:'flex', alignItems:'center', gap:'6px'}}>
              <span className="material-symbols-outlined text-[16px] text-primary">layers</span>
              <span>Layer Stack</span>
            </span>
            <span style={{fontSize:'10px', color:'#96d5a3', fontWeight:'bold'}}>GUJARAT GIS</span>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:'6px', fontSize:'12px'}}>
            {/* Tile switcher */}
            <div style={{backgroundColor:'#152018', padding:'6px', borderRadius:'6px', border:'1px solid #1a261d', marginBottom:'4px'}}>
              <span style={{fontSize:'10px', color:'#839587', display:'block', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Map Style</span>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'4px'}}>
                {Object.entries(TILE_LAYERS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setTileMode(key)}
                    style={tileMode === key
                      ? { backgroundColor: '#96d5a3', color: '#00210d', padding:'4px 0', fontSize:'10px', borderRadius:'4px', fontWeight:'bold', border:'none', cursor:'pointer' }
                      : { backgroundColor: '#080d09', color: '#839587', padding:'4px 0', fontSize:'10px', borderRadius:'4px', border:'none', cursor:'pointer' }
                    }
                  >
                    {item.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Checkboxes */}
            <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'4px 6px', borderRadius:'4px'}}>
              <span style={{fontSize:'11px', color:'#e1e7e2', display:'flex', alignItems:'center', gap:'8px'}}>
                <span className="material-symbols-outlined text-[16px] text-tertiary">waves</span>
                <span>Catchment Basins</span>
              </span>
              <input
                type="checkbox"
                checked={layers.basins}
                onChange={(e) => setLayers({ ...layers, basins: e.target.checked })}
                className="accent-primary"
              />
            </label>

            <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'4px 6px', borderRadius:'4px'}}>
              <span style={{fontSize:'11px', color:'#e1e7e2', display:'flex', alignItems:'center', gap:'8px'}}>
                <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
                <span>LoRa Sensor Mesh</span>
              </span>
              <input
                type="checkbox"
                checked={layers.mesh}
                onChange={(e) => setLayers({ ...layers, mesh: e.target.checked })}
                className="accent-primary"
              />
            </label>

            <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'4px 6px', borderRadius:'4px'}}>
              <span style={{fontSize:'11px', color:'#e1e7e2', display:'flex', alignItems:'center', gap:'8px'}}>
                <span className="material-symbols-outlined text-[16px] text-secondary">lightbulb</span>
                <span>AI Placement Hints</span>
              </span>
              <input
                type="checkbox"
                checked={layers.aiSuggestions}
                onChange={(e) => setLayers({ ...layers, aiSuggestions: e.target.checked })}
                className="accent-primary"
              />
            </label>
          </div>
        </div>

        {/* ─── Floating Gujarat Regional Quick Jumper Bar ──────────────────── */}
        <div className="hidden md:flex" style={{position:'absolute', top:'1rem', left:'18rem', zIndex:30, alignItems:'center', gap:'4px', backgroundColor:'rgba(16,24,18,0.95)', backdropFilter:'blur(12px)', padding:'6px 8px', borderRadius:'0.75rem', border:'1px solid #1a261d', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.5)'}}>
          <span style={{fontSize:'10px', color:'#839587', textTransform:'uppercase', fontFamily:'monospace', padding:'0 6px', fontWeight:'bold'}}>Region:</span>
          {GUJARAT_REGIONS.map((reg) => (
            <button
              key={reg.name}
              onClick={() => setMapTarget({ center: reg.center, zoom: reg.zoom })}
              style={{padding:'4px 8px', borderRadius:'4px', backgroundColor:'#152018', color:'#e1e7e2', fontSize:'11px', fontFamily:'monospace', border:'1px solid #1a261d', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', transition:'all 0.15s'}}
              onMouseEnter={e => { e.currentTarget.style.color = '#96d5a3'; e.currentTarget.style.backgroundColor = '#1c2b20'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#e1e7e2'; e.currentTarget.style.backgroundColor = '#152018'; }}
            >
              <span className="material-symbols-outlined text-[14px] text-primary">{reg.icon}</span>
              <span>{reg.name}</span>
            </button>
          ))}
        </div>

        {/* ─── Easy Area Selection & Sensor Deployment HUD (Bottom Center) ─── */}
        {chosenSpot && (
          <div style={{position:'absolute', bottom:'1.5rem', left:'50%', transform:'translateX(-50%)', zIndex:40, width:'100%', maxWidth:'42rem', backgroundColor:'rgba(16,24,18,0.98)', backdropFilter:'blur(16px)', borderRadius:'1rem', padding:'1rem', border:'2px solid #96d5a3', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.7)', fontFamily:'monospace', color:'#e1e7e2'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1a261d', paddingBottom:'0.625rem', marginBottom:'0.75rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <div style={{width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#14532d', display:'flex', alignItems:'center', justifyContent:'center', color:'#96d5a3'}}>
                  <span className="material-symbols-outlined text-[20px]">add_location</span>
                </div>
                <div>
                  <h4 style={{fontWeight:'bold', fontSize:'14px', color:'#e1e7e2', margin:0}}>Install Environmental Sensor at Chosen Area</h4>
                  <p style={{fontSize:'11px', color:'#96d5a3', margin:0}}>{chosenSpot.landmarkName}</p>
                </div>
              </div>
              <button
                onClick={() => setChosenSpot(null)}
                style={{color:'#839587', background:'none', border:'none', cursor:'pointer', fontSize:'18px', padding:'0 8px'}}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeploySensor} style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'0.75rem'}}>
                <div>
                  <label style={{fontSize:'10px', color:'#839587', textTransform:'uppercase', display:'block', marginBottom:'4px'}}>Sensor Designation / Name</label>
                  <input
                    type="text"
                    value={customNodeName}
                    onChange={(e) => setCustomNodeName(e.target.value)}
                    style={{width:'100%', backgroundColor:'#152018', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', color:'#e1e7e2', border:'1px solid #1a261d', outline:'none'}}
                  />
                </div>

                <div>
                  <label style={{fontSize:'10px', color:'#839587', textTransform:'uppercase', display:'block', marginBottom:'4px'}}>Exact Gujarat GPS Coordinates</label>
                  <div style={{width:'100%', backgroundColor:'#080d09', borderRadius:'6px', padding:'6px 12px', fontSize:'12px', color:'#96d5a3', fontWeight:'bold', border:'1px solid #1a261d'}}>
                    {chosenSpot.lat.toFixed(4)}° N, {chosenSpot.lng.toFixed(4)}° E
                  </div>
                </div>
              </div>

              <div>
                <label style={{fontSize:'10px', color:'#839587', textTransform:'uppercase', display:'block', marginBottom:'6px'}}>
                  Select Monitoring Capability
                </label>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'6px'}}>
                  {SENSOR_TYPES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setChosenType(st.type)}
                      style={chosenType === st.type
                        ? { padding:'6px 8px', borderRadius:'6px', textAlign:'left', border:'1px solid #96d5a3', backgroundColor:'#14532d', color:'#96d5a3', fontWeight:'bold', cursor:'pointer' }
                        : { padding:'6px 8px', borderRadius:'6px', textAlign:'left', border:'1px solid #1a261d', backgroundColor:'#152018', color:'#839587', cursor:'pointer' }
                      }
                    >
                      <div style={{fontSize:'11px', fontWeight:'600'}}>{st.label}</div>
                      <div style={{fontSize:'9px', color:'#839587', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:'flex', gap:'8px', paddingTop:'4px'}}>
                <button
                  type="submit"
                  style={{flex:1, padding:'10px', backgroundColor:'#96d5a3', color:'#00210d', fontWeight:'bold', borderRadius:'8px', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', border:'none', cursor:'pointer', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.5)'}}
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  <span>Confirm & Deploy Sensor to Mesh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChosenSpot(null)}
                  style={{padding:'10px 16px', backgroundColor:'#152018', color:'#839587', borderRadius:'8px', fontSize:'12px', border:'1px solid #1a261d', cursor:'pointer'}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Bottom-Left Tactical Status & Coordinates HUD ───────────────── */}
        <div style={{position:'absolute', bottom:'1rem', left:'1rem', zIndex:30, display:'flex', alignItems:'center', gap:'8px', backgroundColor:'rgba(16,24,18,0.95)', backdropFilter:'blur(12px)', padding:'6px 12px', borderRadius:'6px', border:'1px solid #1a261d', fontFamily:'monospace', fontSize:'11px', color:'#839587', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.5)'}}>
          <button
            onClick={() => setMapTarget({ center: GUJARAT_CENTER, zoom: DEFAULT_ZOOM })}
            style={{color:'#96d5a3', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontWeight:'bold'}}
          >
            <span className="material-symbols-outlined text-[14px]">center_focus_strong</span>
            <span>Reset View</span>
          </button>
          <span style={{color:'#1a261d'}}>|</span>
          <span>{cursorCoords.lat.toFixed(4)}° N, {cursorCoords.lng.toFixed(4)}° E</span>
          <span style={{color:'#1a261d'}}>|</span>
          <span style={{color:'#96d5a3'}}>1:25,000 MESH</span>
        </div>

        {/* ─── Right-Hand Slide-Out Telemetry Drawer ───────────────────────── */}
        <div
          style={{
            position:'absolute', top:0, right:0, height:'100%', width:'24rem',
            backgroundColor:'rgba(16,24,18,0.96)', backdropFilter:'blur(20px)',
            borderLeft:'1px solid #1a261d', zIndex:30,
            transform: flyoutOpen ? 'translateX(0)' : 'translateX(100%)',
            transition:'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display:'flex', flexDirection:'column', boxShadow:'-10px 0 30px rgba(0,0,0,0.7)',
            overflowY:'auto', userSelect:'none'
          }}
        >
          {/* Drawer Header */}
          <div style={{padding:'1rem', borderBottom:'1px solid #1a261d', display:'flex', alignItems:'center', justifyContent:'space-between', backgroundColor:'rgba(8,13,9,0.8)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <span className="material-symbols-outlined text-[20px]" style={{color:'#96d5a3'}}>sensors</span>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <span style={{fontFamily:'monospace', fontSize:'16px', fontWeight:'bold', color:'#e1e7e2'}}>
                  {selectedSensor.id}
                </span>
                <span
                  style={selectedSensor.isCritical
                    ? { backgroundColor:'rgba(255,180,171,0.2)', color:'#ffb4ab', border:'1px solid rgba(255,180,171,0.3)' }
                    : selectedSensor.isWarning
                    ? { backgroundColor:'rgba(255,183,125,0.2)', color:'#ffb77d', border:'1px solid rgba(255,183,125,0.3)' }
                    : { backgroundColor:'rgba(150,213,163,0.2)', color:'#96d5a3', border:'1px solid rgba(150,213,163,0.3)' }
                  }
                  className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider"
                >
                  {selectedSensor.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => setFlyoutOpen(false)}
              style={{padding:'4px', borderRadius:'4px', background:'none', border:'none', color:'#839587', cursor:'pointer'}}
              onMouseEnter={e => e.currentTarget.style.color='#e1e7e2'}
              onMouseLeave={e => e.currentTarget.style.color='#839587'}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{padding:'1rem', display:'flex', flexDirection:'column', gap:'1rem', flex:1}}>
            {/* Zone Tag */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'monospace', fontSize:'11px', color:'#839587'}}>
              <span style={{fontWeight:'600', color:'#e1e7e2'}}>{selectedSensor.zone}</span>
              <span>{selectedSensor.deviceTag}</span>
            </div>

            {/* Live stream pill */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'monospace', fontSize:'10px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'6px', color:'#96d5a3', fontWeight:'bold'}}>
                <span style={{width:'8px', height:'8px', borderRadius:'9999px', backgroundColor:'#96d5a3'}} className="animate-pulse"></span>
                <span>LIVE TELEMETRY STREAM</span>
              </div>
              <span style={{color:'#839587'}}>{selectedSensor.lastUpdate}</span>
            </div>

            {/* 2x3 Metric Grid */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'8px', fontFamily:'monospace'}}>
              {/* Temperature */}
              <div style={{backgroundColor:'#152018', padding:'10px', borderRadius:'8px', display:'flex', flexDirection:'column', justifyContent:'space-between', border:'1px solid #1a261d'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:'#839587'}}>
                  <span style={{fontSize:'10px', textTransform:'uppercase'}}>Ambient Temp</span>
                  <span className="material-symbols-outlined text-[16px]" style={{color:'#ffb77d'}}>thermostat</span>
                </div>
                <div style={{marginTop:'8px', display:'flex', alignItems:'baseline', gap:'4px'}}>
                  <span style={{fontSize:'18px', color:'#e1e7e2', fontWeight:'bold'}}>{selectedSensor.temp}</span>
                  <span style={{fontSize:'12px', color:'#839587'}}>°C</span>
                </div>
                <span style={{fontSize:'10px', color:'#ffb77d', marginTop:'4px'}}>{selectedSensor.tempDiff}</span>
              </div>

              {/* Humidity */}
              <div style={{backgroundColor:'#152018', padding:'10px', borderRadius:'8px', display:'flex', flexDirection:'column', justifyContent:'space-between', border:'1px solid #1a261d'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:'#839587'}}>
                  <span style={{fontSize:'10px', textTransform:'uppercase'}}>Rel Humidity</span>
                  <span className="material-symbols-outlined text-[16px]" style={{color:'#6bd8cb'}}>water_drop</span>
                </div>
                <div style={{marginTop:'8px', display:'flex', alignItems:'baseline', gap:'4px'}}>
                  <span style={{fontSize:'18px', color:'#e1e7e2', fontWeight:'bold'}}>{selectedSensor.humidity}</span>
                  <span style={{fontSize:'12px', color:'#839587'}}>%</span>
                </div>
                <span style={{fontSize:'10px', color:'#839587', marginTop:'4px'}}>{selectedSensor.humidityState}</span>
              </div>

              {/* AQI */}
              <div style={{backgroundColor:'#152018', padding:'10px', borderRadius:'8px', display:'flex', flexDirection:'column', justifyContent:'space-between', border:'1px solid #1a261d'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:'#839587'}}>
                  <span style={{fontSize:'10px', textTransform:'uppercase'}}>AQI (PM2.5)</span>
                  <span className="material-symbols-outlined text-[16px]" style={{color:'#ffb77d'}}>air</span>
                </div>
                <div style={{marginTop:'8px', display:'flex', alignItems:'baseline', gap:'4px'}}>
                  <span style={{fontSize:'18px', color:'#ffb77d', fontWeight:'bold'}}>{selectedSensor.aqi}</span>
                  <span style={{fontSize:'12px', color:'#839587'}}>AQI</span>
                </div>
                <span style={{fontSize:'10px', color:'#ffb77d', marginTop:'4px'}}>{selectedSensor.aqiState}</span>
              </div>

              {/* Water Level */}
              <div style={{backgroundColor:'#152018', padding:'10px', borderRadius:'8px', display:'flex', flexDirection:'column', justifyContent:'space-between', border:'1px solid #1a261d'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:'#839587'}}>
                  <span style={{fontSize:'10px', textTransform:'uppercase'}}>Water Level</span>
                  <span className="material-symbols-outlined text-[16px]" style={{color:'#6bd8cb'}}>waves</span>
                </div>
                <div style={{marginTop:'8px', display:'flex', alignItems:'baseline', gap:'4px'}}>
                  <span style={{fontSize:'18px', color:'#e1e7e2', fontWeight:'bold'}}>{selectedSensor.water}</span>
                  <span style={{fontSize:'12px', color:'#839587'}}>m</span>
                </div>
                <span style={{fontSize:'10px', color:'#96d5a3', marginTop:'4px'}}>{selectedSensor.waterMargin}</span>
              </div>

              {/* Battery */}
              <div style={{backgroundColor:'#152018', padding:'10px', borderRadius:'8px', display:'flex', flexDirection:'column', justifyContent:'space-between', border:'1px solid #1a261d'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:'#839587'}}>
                  <span style={{fontSize:'10px', textTransform:'uppercase'}}>Battery</span>
                  <span className="material-symbols-outlined text-[16px]" style={{color:'#96d5a3'}}>solar_power</span>
                </div>
                <div style={{marginTop:'8px', display:'flex', alignItems:'baseline', gap:'4px'}}>
                  <span style={{fontSize:'18px', color:'#e1e7e2', fontWeight:'bold'}}>{selectedSensor.battery}</span>
                  <span style={{fontSize:'12px', color:'#839587'}}>%</span>
                </div>
                <span style={{fontSize:'10px', color:'#96d5a3', marginTop:'4px'}}>{selectedSensor.batteryState}</span>
              </div>

              {/* RF Uplink */}
              <div style={{backgroundColor:'#152018', padding:'10px', borderRadius:'8px', display:'flex', flexDirection:'column', justifyContent:'space-between', border:'1px solid #1a261d'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', color:'#839587'}}>
                  <span style={{fontSize:'10px', textTransform:'uppercase'}}>RF Uplink</span>
                  <span className="material-symbols-outlined text-[16px]" style={{color:'#96d5a3'}}>cell_tower</span>
                </div>
                <div style={{marginTop:'8px', display:'flex', alignItems:'baseline'}}>
                  <span style={{fontSize:'14px', color:'#e1e7e2', fontWeight:'bold'}}>{selectedSensor.signal}</span>
                </div>
                <span style={{fontSize:'10px', color:'#96d5a3', marginTop:'4px'}}>{selectedSensor.signalState}</span>
              </div>
            </div>

            {/* 6-Hour Trend Curve */}
            <div style={{backgroundColor:'#152018', padding:'12px', borderRadius:'8px', display:'flex', flexDirection:'column', gap:'8px', border:'1px solid #1a261d', fontFamily:'monospace'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <span style={{fontSize:'10px', color:'#839587', textTransform:'uppercase', letterSpacing:'0.05em'}}>6-Hour Trend Curve</span>
                <span style={{fontSize:'10px', color:'#96d5a3', fontWeight:'bold'}}>AQI / WATER DELTA</span>
              </div>
              <svg style={{width:'100%', height:'56px'}} preserveAspectRatio="none" viewBox="0 0 240 60">
                <defs>
                  <linearGradient id="gujaratSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffb77d" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ffb77d" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,42 Q 40,38 80,48 T 140,24 T 190,32 T 240,12 L 240,60 L 0,60 Z"
                  fill="url(#gujaratSparkGrad)"
                />
                <path
                  d="M 0,42 Q 40,38 80,48 T 140,24 T 190,32 T 240,12"
                  fill="none"
                  stroke="#ffb77d"
                  strokeWidth="2"
                />
                <circle cx="240" cy="12" r="3" fill="#ffb77d" />
              </svg>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'10px', color:'#839587'}}>
                <span>T -6h (08:30)</span>
                <span>T -3h (11:30)</span>
                <span style={{color:'#ffb77d', fontWeight:'bold'}}>NOW (14:32)</span>
              </div>
            </div>

            {/* Operational Actions */}
            <div style={{display:'flex', flexDirection:'column', gap:'8px', marginTop:'auto', paddingTop:'8px', fontFamily:'monospace'}}>
              <button
                style={{width:'100%', padding:'8px 12px', borderRadius:'6px', backgroundColor:'#14532d', color:'#96d5a3', fontSize:'12px', fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', border:'1px solid rgba(150,213,163,0.3)', cursor:'pointer'}}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Recalibrate Sensor Node
              </button>
              <button
                style={{width:'100%', padding:'8px 12px', borderRadius:'6px', backgroundColor:'#5c0c11', color:'#ffb4ab', fontSize:'12px', fontWeight:'600', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', border:'1px solid rgba(255,180,171,0.3)', cursor:'pointer'}}
              >
                <span className="material-symbols-outlined text-[16px]">emergency_share</span>
                Dispatch Inspection Team
              </button>
              <Link
                to={'/nodes/' + selectedSensor.id}
                style={{width:'100%', padding:'8px 12px', borderRadius:'6px', backgroundColor:'#152018', color:'#e1e7e2', fontSize:'12px', fontWeight:'500', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', border:'1px solid #1a261d', textDecoration:'none'}}
              >
                <span className="material-symbols-outlined text-[16px]">query_stats</span>
                Full Historical Diagnostics
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer Reopen Toggle if Closed */}
        {!flyoutOpen && (
          <button
            onClick={() => setFlyoutOpen(true)}
            style={{position:'absolute', top:'1rem', right:'1rem', zIndex:30, padding:'6px 12px', borderRadius:'8px', backgroundColor:'rgba(16,24,18,0.9)', backdropFilter:'blur(8px)', border:'1px solid #1a261d', color:'#e1e7e2', display:'flex', alignItems:'center', gap:'6px', fontFamily:'monospace', fontSize:'12px', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.5)', cursor:'pointer'}}
          >
            <span className="material-symbols-outlined text-[18px]" style={{color:'#96d5a3'}}>dock_to_left</span>
            <span>Open Telemetry Dock</span>
          </button>
        )}
      </div>
    </div>
  )
}
