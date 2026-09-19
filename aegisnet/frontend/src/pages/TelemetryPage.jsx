// TelemetryPage.jsx — Code Vortex Live Telemetry
// Exact recreation of the Code Vortex Live Telemetry specification
// Fully functional with real-time dynamic sensor values from Zustand store, physical USB hardware, and packet simulator.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { webSerialService } from '../services/webSerialService'
import './TelemetryPage.css'

// ─── Helpers & Formatting ───────────────────────────────────────────────────
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const fmt = (v, d) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const RANK = { ok: 0, warn: 1, poor: 2, bad: 3 }
const STATE_LBL = { ok: 'Normal', warn: 'Watch', poor: 'Warning', bad: 'Alert' }
const SEV = { bad: 'Critical', poor: 'Warning', warn: 'Watch' }
const SPAN = { '1h': 36e5, '6h': 216e5, '24h': 864e5, '7d': 6048e5 }
const TONE_ON_BLUE = { ok: '#86efac', warn: '#fde68a', poor: '#fdba74', bad: '#fda4af' }

function ago(t) {
  if (!t) return 'Just now'
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  return s < 15 ? 'Just now' : s < 60 ? `${s} s ago` : `${Math.floor(s / 60)} min ago`
}

function decFor(step) {
  return step % 1 === 0 ? 0 : (step * 10 % 1 === 0 ? 1 : 2)
}

function tlabel(t, full, win) {
  const d = new Date(t)
  if (win === 'live') return d.toLocaleTimeString('en-GB')
  if (win === '7d') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + (full ? ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '')
  return (full && win === '24h' ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' : '') + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ─── Station Specifications ─────────────────────────────────────────────────
const STATIONS_DEF = [
  {
    id: 'flood',
    name: 'Flood monitoring station',
    short: 'Flood',
    node: 'ESP32-FLOOD',
    icon: 'i-drop',
    color: '#1f6bf5',
    loc: 'Sant Sarovar Dam, Sabarmati, Gandhinagar',
    lat: '23.2385',
    lng: '72.6710',
    metrics: [
      {
        id: 'water',
        label: 'Water surface distance',
        param: 'Water Distance',
        unit: 'cm',
        dec: 1,
        base: 45,
        noise: 0.7,
        min: 0,
        max: 100,
        note: 'Safe above 30 cm. Alert below 20 cm.',
        levels: [[20, 'Alert', 'bad'], [30, 'Warning', 'warn'], [Infinity, 'Normal', 'ok']],
        alert: { t: 'Water level rising fast', x: 'The water surface is close to the sensor. Check the dam gates and downstream areas.' }
      },
      {
        id: 'soil',
        label: 'Soil moisture saturation',
        param: 'Soil Saturation',
        unit: '%',
        dec: 1,
        base: 69.4,
        noise: 0.6,
        min: 0,
        max: 100,
        note: 'Medium moisture. Runoff risk is low.',
        levels: [[85, 'Normal', 'ok'], [92, 'Saturated', 'warn'], [Infinity, 'Runoff risk', 'bad']],
        alert: { t: 'Soil is close to saturation', x: 'Extra rain would run off instead of soaking in. Watch the drainage channels.' }
      }
    ],
    charts: [
      {
        title: 'Water level trend',
        tag: 'Target above 30 cm',
        series: [{ m: 'water', color: '#1f6bf5' }],
        y: { l: [0, 80] },
        lines: [
          { v: 30, label: 'Safe threshold', c: '#16a34a' },
          { v: 20, label: 'Surge threshold', c: '#ef4444' }
        ]
      },
      {
        title: 'Soil moisture trend',
        tag: 'Saturation %',
        series: [{ m: 'soil', color: '#16a34a' }],
        y: { l: [0, 100] }
      }
    ]
  },
  {
    id: 'co',
    name: 'CO and thermal hazard node',
    short: 'CO + thermal',
    node: 'ESP32-COTEMP',
    icon: 'i-flame',
    color: '#f97316',
    loc: 'Indroda Nature Park perimeter, Gandhinagar',
    lat: '23.1950',
    lng: '72.6520',
    metrics: [
      {
        id: 'co',
        label: 'CO gas (MQ-7)',
        param: 'CO Gas (MQ-7)',
        unit: 'ppm',
        dec: 2,
        base: 2.71,
        noise: 0.1,
        min: 0,
        max: 10,
        note: 'Safe limit below 5.0 ppm.',
        levels: [[5, 'Normal', 'ok'], [9, 'Warning', 'poor'], [Infinity, 'Danger', 'bad']],
        alert: { t: 'Carbon monoxide rising', x: 'CO is above the safe limit. Ventilate the area and check for smouldering material.' }
      },
      {
        id: 'temp',
        label: 'Ambient temperature',
        param: 'Ambient Temp',
        unit: '°C',
        dec: 1,
        base: 27.7,
        noise: 0.15,
        min: 0,
        max: 50,
        note: 'Sensor DHT11/DHT22.',
        levels: [[38, 'Normal', 'ok'], [45, 'Hot', 'poor'], [Infinity, 'Extreme', 'bad']],
        alert: { t: 'High ambient temperature', x: 'Heat is above the safe range for field crews and equipment.' }
      },
      {
        id: 'hum',
        label: 'Relative humidity',
        param: 'Relative Humidity',
        unit: '%',
        dec: 1,
        base: 61.8,
        noise: 0.4,
        min: 0,
        max: 100,
        note: 'Standard comfort zone.',
        levels: [[70, 'Normal', 'ok'], [85, 'Humid', 'warn'], [Infinity, 'Very humid', 'poor']],
        alert: { t: 'Humidity is high', x: 'Damp air can affect sensor accuracy and increase mould risk.' }
      },
      {
        id: 'flame',
        label: 'Flame sensor',
        param: 'Flame Sensor',
        unit: '',
        kind: 'binary',
        dec: 0,
        base: 0,
        noise: 0,
        min: 0,
        max: 1,
        note: 'Optical IR spectrum.',
        levels: [[0, 'Clear', 'ok'], [Infinity, 'Detected', 'bad']],
        alert: { t: 'Flame detected', x: 'The infrared sensor sees a flame. Send a response team now.' }
      }
    ],
    charts: [
      {
        title: 'CO concentration',
        tag: 'MQ-7 (ppm)',
        series: [{ m: 'co', color: '#f97316' }],
        y: { l: [0, 8] }
      },
      {
        title: 'Temperature and humidity',
        series: [
          { m: 'temp', color: '#f97316', label: 'Temp' },
          { m: 'hum', color: '#12b8d8', label: 'Humidity', axis: 'r' }
        ],
        y: { l: [0, 40], r: [0, 100] }
      },
      {
        title: 'Flame status',
        tag: 'IR binary state',
        series: [{ m: 'flame', color: '#ef4444' }],
        y: { l: [0, 1] },
        ticks: 1,
        noArea: true
      }
    ]
  },
  {
    id: 'air',
    name: 'Pollution and air quality node',
    short: 'Air quality',
    node: 'ESP32-POLLUTION',
    icon: 'i-wind',
    color: '#12b8d8',
    loc: 'Narol-Vatva GIDC industrial corridor, Ahmedabad',
    lat: '22.9734',
    lng: '72.5898',
    metrics: [
      {
        id: 'pm1',
        label: 'PM1.0 ultrafine',
        param: 'PM1.0 Density',
        unit: 'µg/m³',
        dec: 1,
        base: 45,
        noise: 1.2,
        min: 0,
        max: 150,
        note: 'Direct lung deposition band.',
        levels: [[35, 'Good', 'ok'], [60, 'Moderate', 'warn'], [Infinity, 'High', 'bad']],
        alert: { t: 'Ultrafine particles above normal', x: 'PM1.0 can pass deep into the lungs. Limit time outdoors.' }
      },
      {
        id: 'pm25',
        label: 'PM2.5 particles',
        param: 'PM2.5 Density',
        unit: 'µg/m³',
        dec: 0,
        base: 49,
        noise: 1.2,
        min: 0,
        max: 150,
        note: 'Optical dust sensor feed.',
        levels: [[30, 'Good', 'ok'], [45, 'Moderate', 'warn'], [90, 'Poor', 'poor'], [Infinity, 'Severe', 'bad']],
        alert: { t: 'PM2.5 above the safe level', x: 'Fine particles are high across the corridor. Outdoor masks are recommended.' }
      },
      {
        id: 'pm10',
        label: 'PM10 particles',
        param: 'PM10 Density',
        unit: 'µg/m³',
        dec: 0,
        base: 65,
        noise: 1.6,
        min: 0,
        max: 200,
        note: 'Heavy particulate matter.',
        levels: [[50, 'Good', 'ok'], [60, 'Moderate', 'warn'], [Infinity, 'Severe', 'bad']],
        alert: { t: 'Heavy particulate matter', x: 'PM10 is well above safe limits. Outdoor workers should wear masks.' }
      },
      {
        id: 'od',
        label: 'PM2.5 optical density',
        param: 'PM2.5 Optical',
        unit: 'µg/m³',
        dec: 0,
        base: 49,
        noise: 1.2,
        min: 0,
        max: 150,
        note: 'Raw optical channel.',
        levels: [[35, 'Normal', 'ok'], [80, 'Elevated', 'warn'], [Infinity, 'High', 'bad']],
        alert: { t: 'Optical density is elevated', x: 'The raw optical channel reads above its baseline. Cross-check with the PM2.5 feed.' }
      },
      {
        id: 'mq135',
        label: 'MQ-135 toxic gas',
        param: 'MQ-135 Toxic Gas',
        unit: '%',
        dec: 1,
        base: 34.6,
        noise: 0.9,
        min: 0,
        max: 100,
        note: 'Ammonia, benzene and smoke.',
        levels: [[20, 'Normal', 'ok'], [30, 'Elevated', 'warn'], [Infinity, 'Alert', 'bad']],
        alert: { t: 'Toxic gas spike detected', x: 'Ammonia and benzene fumes are above the safe baseline. The on-device model flagged a rapid rise.' }
      },
      {
        id: 'mq4',
        label: 'MQ-4 combustible gas',
        param: 'MQ-4 Combustible',
        unit: '%',
        dec: 1,
        base: 15.6,
        noise: 0.5,
        min: 0,
        max: 100,
        note: 'Methane and natural gas.',
        levels: [[25, 'Normal', 'ok'], [40, 'Elevated', 'warn'], [Infinity, 'Alert', 'bad']],
        alert: { t: 'Combustible gas building up', x: 'Methane levels are rising. Remove ignition sources nearby.' }
      }
    ],
    charts: [
      {
        title: 'Toxic and combustible gas',
        series: [
          { m: 'mq135', color: '#ef4444', label: 'MQ-135' },
          { m: 'mq4', color: '#1f6bf5', label: 'MQ-4' }
        ],
        y: { l: [0, 100] }
      },
      {
        title: 'PM2.5 particulate density',
        tag: 'µg/m³',
        series: [{ m: 'pm25', color: '#f97316' }],
        y: { l: [0, 80] }
      },
      {
        title: 'PM10 particulate density',
        tag: 'µg/m³',
        series: [{ m: 'pm10', color: '#ef4444' }],
        y: { l: [0, 120] }
      },
      {
        title: 'PM1.0 ultrafine density',
        tag: 'µg/m³',
        series: [{ m: 'pm1', color: '#12b8d8' }],
        y: { l: [0, 80] }
      }
    ]
  }
]

// ─── Pseudo-random Generator for Historical Windows ─────────────────────────
function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(a) {
  return function() {
    a |= 0
    a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function buildWin(mDef, w, currentVal) {
  const N = 48
  const span = SPAN[w] || 36e5
  const now = Date.now()
  const dt = span / (N - 1)
  const r = rng(hash(mDef.id + w))
  const amp = (mDef.noise || 0.5) * 5
  const ph = r() * 6.283
  const cyc = { '1h': 1.5, '6h': 2, '24h': 2.5, '7d': 4 }[w] || 2
  const out = []
  for (let i = 0; i < N; i++) {
    let v = mDef.kind === 'binary' ? 0 : mDef.base + amp * Math.sin(ph + i / (N - 1) * cyc * 6.283) * 0.7 + (r() - 0.5) * amp * 0.9
    out.push({ t: now - span + i * dt, v: clamp(v, mDef.min, mDef.max) })
  }
  if (mDef.kind !== 'binary' && currentVal != null) {
    out[N - 1].v = currentVal
  }
  return out
}

// ─── Pure SVG Chart Component ───────────────────────────────────────────────
function SvgChart({ def, stationId, chartIndex, win, liveData, metricValues, metricsDefMap }) {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(480)
  const [hoverData, setHoverData] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setWidth(entry.contentRect.width)
        }
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Build series data
  const seriesInfo = useMemo(() => {
    return def.series.map((s) => {
      const mDef = metricsDefMap[s.m]
      const curVal = metricValues[s.m]
      let data = []
      if (win === 'live') {
        data = liveData[s.m] || []
      } else {
        data = buildWin(mDef, win, curVal)
      }
      return {
        ...s,
        mDef,
        axis: s.axis || 'l',
        data
      }
    })
  }, [def.series, metricsDefMap, metricValues, win, liveData])

  const H = 210
  const n = seriesInfo[0]?.data?.length || 0
  const hasR = seriesInfo.some((s) => s.axis === 'r')
  const padL = 42
  const padR = hasR ? 42 : 14
  const padT = 14
  const padB = 28
  const pw = Math.max(10, width - padL - padR)
  const ph = H - padT - padB

  // Scale calculation
  const scales = useMemo(() => {
    const calcAxis = (a) => {
      let [lo, hi] = def.y[a] || [0, 100]
      const ticks = def.ticks || 4
      const stp = (hi - lo) / ticks
      let mx = -Infinity
      seriesInfo.forEach((s) => {
        if (s.axis === a) {
          s.data.forEach((p) => {
            if (p.v > mx) mx = p.v
          })
        }
      })
      if (mx > hi) {
        hi = lo + Math.ceil((mx - lo) / stp) * stp
      }
      return {
        lo,
        hi,
        stp,
        ticks: Math.round((hi - lo) / stp),
        dec: decFor(stp)
      }
    }
    return {
      l: calcAxis('l'),
      r: hasR ? calcAxis('r') : null
    }
  }, [def, seriesInfo, hasR])

  const X = useCallback((i) => padL + (i * pw) / Math.max(1, n - 1), [padL, pw, n])
  const Y = useCallback((v, a) => {
    const sc = scales[a] || scales.l
    return padT + ph - ((v - sc.lo) / Math.max(0.0001, sc.hi - sc.lo)) * ph
  }, [scales, padT, ph])

  const handlePointerMove = (e) => {
    if (!containerRef.current || n < 2) return
    const rect = containerRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const idx = clamp(Math.round(((px - padL) / pw) * (n - 1)), 0, n - 1)
    const exactX = X(idx)

    const items = seriesInfo.map((s) => {
      const pt = s.data[idx]
      const val = pt ? pt.v : 0
      const formatted = s.mDef.kind === 'binary'
        ? (val ? 'Detected' : 'Clear')
        : fmt(val, s.mDef.dec) + (s.mDef.unit ? ' ' + s.mDef.unit : '')
      return {
        label: s.label || s.mDef.label,
        color: s.color,
        formatted,
        y: Y(val, s.axis)
      }
    })

    const timeStr = tlabel(seriesInfo[0].data[idx]?.t || Date.now(), true, win)
    const tipLeft = exactX + 14 + 180 > width ? exactX - 14 - 180 : exactX + 14

    setHoverData({
      x: exactX,
      tipLeft: Math.max(8, tipLeft),
      timeStr,
      items
    })
  }

  const handlePointerLeave = () => {
    setHoverData(null)
  }

  // Generate curves
  const curves = useMemo(() => {
    if (n < 2) return []
    return seriesInfo.map((s, sIdx) => {
      const pts = s.data.map((p, j) => [X(j), Y(p.v, s.axis)])
      let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
      for (let j = 1; j < pts.length; j++) {
        const [x0, y0] = pts[j - 1]
        const [x1, y1] = pts[j]
        const mx = ((x0 + x1) / 2).toFixed(1)
        d += ` C ${mx},${y0.toFixed(1)} ${mx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
      }
      const areaD = `${d} L ${pts[n - 1][0].toFixed(1)},${padT + ph} L ${pts[0][0].toFixed(1)},${padT + ph} Z`
      const lastPt = pts[n - 1]
      return {
        lineD: d,
        areaD,
        lastPt,
        color: s.color,
        hasArea: seriesInfo.length === 1 && !def.noArea,
        gradId: `cg-${stationId}-${chartIndex}-${sIdx}`
      }
    })
  }, [seriesInfo, n, X, Y, padT, ph, def.noArea, stationId, chartIndex])

  // X ticks
  const xIndices = useMemo(() => {
    if (n < 2) return []
    return [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (n - 1))))]
  }, [n])

  return (
    <div className="chart">
      <div className="c-head">
        <h4>{def.title}</h4>
        <div>
          {def.tag ? (
            <span className="c-tag">{def.tag}</span>
          ) : (
            def.series.map((x, idx) => (
              <span key={idx} className="lg">
                <i style={{ background: x.color }} />
                {x.label}
              </span>
            ))
          )}
        </div>
      </div>

      <div
        className="plot"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <svg viewBox={`0 0 ${width} ${H}`} width={width} height={H}>
          <defs>
            {curves.map((c) => (
              <linearGradient key={c.gradId} id={c.gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={c.color} stopOpacity="0.28" />
                <stop offset="1" stopColor={c.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines and Left Y Labels */}
          {Array.from({ length: scales.l.ticks + 1 }).map((_, k) => {
            const y = padT + ph - (k / scales.l.ticks) * ph
            const val = scales.l.lo + k * scales.l.stp
            return (
              <g key={`grid-l-${k}`}>
                <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="#e8edf6" strokeWidth="1" />
                <text x={padL - 8} y={y + 4} textAnchor="end">
                  {fmt(val, scales.l.dec)}
                </text>
              </g>
            )
          })}

          {/* Right Y Labels if dual axes */}
          {hasR && scales.r && Array.from({ length: scales.r.ticks + 1 }).map((_, k) => {
            const y = padT + ph - (k / scales.r.ticks) * ph
            const val = scales.r.lo + k * scales.r.stp
            return (
              <text key={`grid-r-${k}`} x={width - padR + 8} y={y + 4} textAnchor="start">
                {fmt(val, scales.r.dec)}
              </text>
            )
          })}

          {/* X Axis Time Labels */}
          {seriesInfo[0]?.data?.length > 0 && xIndices.map((ix, j) => {
            const anchor = j === 0 ? 'start' : j === xIndices.length - 1 ? 'end' : 'middle'
            const pt = seriesInfo[0].data[ix]
            return (
              <text key={`x-lbl-${j}`} x={X(ix)} y={H - 8} textAnchor={anchor}>
                {pt ? tlabel(pt.t, false, win) : ''}
              </text>
            )
          })}

          {/* Threshold Reference Lines */}
          {def.lines && def.lines.map((l, lIdx) => {
            const y = Y(l.v, 'l')
            return (
              <g key={`thresh-${lIdx}`}>
                <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={l.c} strokeWidth="1.4" strokeDasharray="5 5" opacity="0.8" />
                <text x={width - padR - 4} y={y - 5} textAnchor="end" style={{ fill: l.c, fontWeight: 700 }}>
                  {l.label}
                </text>
              </g>
            )
          })}

          {/* Data Curves & Fills */}
          {curves.map((c, cIdx) => (
            <g key={`curve-${cIdx}`}>
              {c.hasArea && <path d={c.areaD} fill={`url(#${c.gradId})`} />}
              <path d={c.lineD} fill="none" stroke={c.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {c.lastPt && (
                <circle cx={c.lastPt[0]} cy={c.lastPt[1]} r="4" fill="#fff" stroke={c.color} strokeWidth="2.2" />
              )}
            </g>
          ))}

          {/* Interactive Hover Indicators */}
          {hoverData && (
            <g>
              <line
                x1={hoverData.x}
                x2={hoverData.x}
                y1={padT}
                y2={padT + ph}
                stroke="#9aa8c2"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              {hoverData.items.map((item, itIdx) => (
                <circle
                  key={`hd-${itIdx}`}
                  cx={hoverData.x}
                  cy={item.y}
                  r="5"
                  fill={item.color}
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoverData && (
          <div className="tip" style={{ left: `${hoverData.tipLeft}px`, display: 'block' }}>
            <b>{hoverData.timeStr}</b>
            {hoverData.items.map((it, itIdx) => (
              <div key={`tip-item-${itIdx}`}>
                <i style={{ background: it.color }} />
                {it.label}: {it.formatted}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Telemetry Page Component ──────────────────────────────────────────
export default function TelemetryPage() {
  const esp32Nodes      = useStore((s) => s.esp32Nodes)
  const usbConnected    = useStore((s) => s.usbConnected)
  const setUsbModalOpen = useStore((s) => s.setUsbModalOpen)
  const selectedRegion  = useStore((s) => s.selectedRegion || 'All Gujarat Grid')
  const lastPhysicalPacketTime = useStore((s) => s.lastPhysicalPacketTime)

  const [timeRange, setTimeRange] = useState('live')
  const [isSimulating, setIsSimulating] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimeoutRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => setToastMsg(''), 2800)
  }, [])

  // Find 3 primary ESP32 nodes from store
  const floodNode = useMemo(() => (
    esp32Nodes.find((n) => n.node_id?.includes('FLOOD') || n.category === 'flood')
  ), [esp32Nodes])

  const cotempNode = useMemo(() => (
    esp32Nodes.find((n) => n.node_id?.includes('COTEMP') || n.category === 'fire')
  ), [esp32Nodes])

  const pollutionNode = useMemo(() => (
    esp32Nodes.find((n) => n.node_id?.includes('POLLUTION') || n.category === 'air')
  ), [esp32Nodes])

  // Flattened metrics dictionary
  const metricsDefMap = useMemo(() => {
    const map = {}
    STATIONS_DEF.forEach((s) => s.metrics.forEach((m) => { map[m.id] = { ...m, station: s } }))
    return map
  }, [])

  // Live metric values state
  const [metricValues, setMetricValues] = useState(() => {
    const init = {}
    STATIONS_DEF.forEach((s) => s.metrics.forEach((m) => {
      init[m.id] = m.base
    }))
    return init
  })

  // Live rolling history buffer (30 points each)
  const [liveData, setLiveData] = useState(() => {
    const now = Date.now()
    const init = {}
    STATIONS_DEF.forEach((s) => s.metrics.forEach((m) => {
      const arr = []
      for (let i = 0; i < 30; i++) {
        arr.push({ t: now - (29 - i) * 2000, v: m.base })
      }
      init[m.id] = arr
    }))
    return init
  })

  // Logs stream state
  const [logs, setLogs] = useState(() => [
    { id: 1, t: Date.now() - 1000, st: 'ESP32-POLLUTION', param: 'MQ-135 Toxic Gas', val: '34.6 %', tone: 'warn', lab: 'Elevated', fresh: false },
    { id: 2, t: Date.now() - 2200, st: 'ESP32-POLLUTION', param: 'PM2.5 Density', val: '49 µg/m³', tone: 'warn', lab: 'Moderate', fresh: false },
    { id: 3, t: Date.now() - 3500, st: 'ESP32-COTEMP', param: 'Ambient Temp', val: '27.7 °C', tone: 'ok', lab: 'Normal', fresh: false },
    { id: 4, t: Date.now() - 4800, st: 'ESP32-COTEMP', param: 'CO Gas (MQ-7)', val: '2.71 ppm', tone: 'ok', lab: 'Normal', fresh: false },
    { id: 5, t: Date.now() - 6100, st: 'ESP32-FLOOD', param: 'Water Distance', val: '45.0 cm', tone: 'ok', lab: 'Normal', fresh: false },
    { id: 6, t: Date.now() - 7400, st: 'ESP32-FLOOD', param: 'Soil Saturation', val: '69.4 %', tone: 'ok', lab: 'Normal', fresh: false }
  ])

  // Filters for logs
  const [logStationFilter, setLogStationFilter] = useState('')
  const [logSearchQuery, setLogSearchQuery] = useState('')

  // Check levels & tone
  const getMetricTone = useCallback((mDef, v) => {
    const matched = mDef.levels.find((l) => v <= l[0])
    return matched ? matched[2] : 'ok'
  }, [])

  const getMetricLabel = useCallback((mDef, v) => {
    const matched = mDef.levels.find((l) => v <= l[0])
    return matched ? matched[1] : 'Normal'
  }, [])

  // ─── Immediate Physical Hardware Ingestion ────────────────────────────────
  // When ESP32 transmits packets via USB Web Serial or ESP-NOW Gateway, immediately
  // lock all measured physical values onto the page without artificial smoothing or simulated noise.
  useEffect(() => {
    if (!floodNode && !cotempNode && !pollutionNode) return
    const now = Date.now()
    const liveMetrics = {}
    const newLogEntries = []

    // 1. Flood Node (Ultrasonic water level + analog soil moisture)
    if (floodNode?.is_live_hw) {
      if (floodNode.water_level_cm != null) {
        liveMetrics.water = floodNode.water_level_cm
        newLogEntries.push({
          st: 'ESP32-FLOOD',
          param: 'Water Distance',
          val: `${fmt(floodNode.water_level_cm, 1)} cm`,
          mKey: 'water'
        })
      }
      if (floodNode.soil_moisture != null) {
        liveMetrics.soil = floodNode.soil_moisture
        newLogEntries.push({
          st: 'ESP32-FLOOD',
          param: 'Soil Saturation',
          val: `${fmt(floodNode.soil_moisture, 1)} %`,
          mKey: 'soil'
        })
      }
    }

    // 2. CO/Thermal Node (MQ-7 CO gas + DHT11/22 Temperature/Humidity + Optical Flame IR)
    if (cotempNode?.is_live_hw) {
      if (cotempNode.gas_ppm != null) {
        liveMetrics.co = cotempNode.gas_ppm
        newLogEntries.push({
          st: 'ESP32-COTEMP',
          param: 'CO Gas (MQ-7)',
          val: `${fmt(cotempNode.gas_ppm, 2)} ppm`,
          mKey: 'co'
        })
      }
      if (cotempNode.temperature_c != null) {
        liveMetrics.temp = cotempNode.temperature_c
        newLogEntries.push({
          st: 'ESP32-COTEMP',
          param: 'Ambient Temp',
          val: `${fmt(cotempNode.temperature_c, 1)} °C`,
          mKey: 'temp'
        })
      }
      if (cotempNode.humidity_pct != null) {
        liveMetrics.hum = cotempNode.humidity_pct
        newLogEntries.push({
          st: 'ESP32-COTEMP',
          param: 'Relative Humidity',
          val: `${fmt(cotempNode.humidity_pct, 1)} %`,
          mKey: 'hum'
        })
      }
      if (cotempNode.flame_detected !== undefined) {
        liveMetrics.flame = cotempNode.flame_detected ? 1 : 0
        newLogEntries.push({
          st: 'ESP32-COTEMP',
          param: 'Flame Sensor',
          val: cotempNode.flame_detected ? 'DETECTED / 1' : 'CLEAR / 0',
          mKey: 'flame'
        })
      }
    }

    // 3. Pollution Node (Dust Sensor PM2.5/PM10/PM1.0/OD + MQ-135 Toxic + MQ-4 Combustible)
    if (pollutionNode?.is_live_hw) {
      if (pollutionNode.smoke_aqi != null) {
        liveMetrics.pm25 = pollutionNode.smoke_aqi
        liveMetrics.pm10 = pollutionNode.pm10 || Math.round(pollutionNode.smoke_aqi * 1.35)
        liveMetrics.pm1 = pollutionNode.pm1 || Math.round(pollutionNode.smoke_aqi * 0.62)
        liveMetrics.od = pollutionNode.optical_density || pollutionNode.smoke_aqi
        newLogEntries.push({
          st: 'ESP32-POLLUTION',
          param: 'PM2.5 Density',
          val: `${fmt(pollutionNode.smoke_aqi, 0)} µg/m³`,
          mKey: 'pm25'
        })
      }
      if (pollutionNode.mq135_strength != null) {
        liveMetrics.mq135 = pollutionNode.mq135_strength
        newLogEntries.push({
          st: 'ESP32-POLLUTION',
          param: 'MQ-135 Toxic Gas',
          val: `${fmt(pollutionNode.mq135_strength, 1)} %`,
          mKey: 'mq135'
        })
      }
      if (pollutionNode.mq4_strength != null) {
        liveMetrics.mq4 = pollutionNode.mq4_strength
        newLogEntries.push({
          st: 'ESP32-POLLUTION',
          param: 'MQ-4 Combustible',
          val: `${fmt(pollutionNode.mq4_strength, 1)} %`,
          mKey: 'mq4'
        })
      }
    }

    // Immediately commit measured physical hardware numbers
    if (Object.keys(liveMetrics).length > 0) {
      setMetricValues((prev) => ({ ...prev, ...liveMetrics }))

      setLiveData((prevHist) => {
        const nextHist = { ...prevHist }
        Object.keys(liveMetrics).forEach((k) => {
          const curArr = prevHist[k] || []
          nextHist[k] = [...curArr.slice(1), { t: now, v: liveMetrics[k] }]
        })
        return nextHist
      })

      if (newLogEntries.length > 0) {
        const formattedRows = newLogEntries.map((entry, eIdx) => {
          const def = metricsDefMap[entry.mKey]
          const val = liveMetrics[entry.mKey]
          const tone = def ? getMetricTone(def, val) : 'ok'
          const lab = def ? getMetricLabel(def, val) : 'Normal'
          return {
            id: `${now}-${eIdx}-${Math.random()}`,
            t: now,
            st: entry.st,
            param: entry.param,
            val: entry.val,
            tone,
            lab,
            fresh: true
          }
        })
        setLogs((prevLogs) => [...formattedRows, ...prevLogs.map((l) => ({ ...l, fresh: false }))].slice(0, 80))
      }
    }
  }, [floodNode, cotempNode, pollutionNode, lastPhysicalPacketTime, metricsDefMap, getMetricTone, getMetricLabel])

  // ─── Continuous Real-Time Refresh Ticker ───────────────────────────────────
  // Locks live hardware nodes to their actual readings; provides smooth organic drift
  // only for non-connected/standby nodes or packet simulator mode.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      setMetricValues((prev) => {
        const next = { ...prev }

        const isFloodLive = Boolean(floodNode?.is_live_hw)
        const isCotempLive = Boolean(cotempNode?.is_live_hw)
        const isPollutionLive = Boolean(pollutionNode?.is_live_hw)

        const targets = {
          water: floodNode?.water_level_cm != null ? floodNode.water_level_cm : 45.0,
          soil: floodNode?.soil_moisture != null ? floodNode.soil_moisture : 69.4,
          co: cotempNode?.gas_ppm != null ? cotempNode.gas_ppm : 2.71,
          temp: cotempNode?.temperature_c != null ? cotempNode.temperature_c : 27.7,
          hum: cotempNode?.humidity_pct != null ? cotempNode.humidity_pct : 61.8,
          flame: cotempNode?.flame_detected ? 1 : 0,
          pm1: (pollutionNode?.smoke_aqi != null ? pollutionNode.smoke_aqi : 49.0) * 0.62,
          pm25: pollutionNode?.smoke_aqi != null ? pollutionNode.smoke_aqi : 49.0,
          pm10: pollutionNode?.pm10 != null ? pollutionNode.pm10 : 65.0,
          od: pollutionNode?.smoke_aqi != null ? pollutionNode.smoke_aqi : 49.0,
          mq135: pollutionNode?.mq135_strength != null ? pollutionNode.mq135_strength : 34.6,
          mq4: pollutionNode?.mq4_strength != null ? pollutionNode.mq4_strength : 15.6
        }

        const vol = isSimulating ? 2.8 : 1.0

        Object.keys(targets).forEach((key) => {
          const def = metricsDefMap[key]
          if (!def) return
          const isStationLive = def.station.id === 'flood' ? isFloodLive
            : def.station.id === 'co' ? isCotempLive
            : isPollutionLive

          if (isStationLive) {
            // Live Hardware: keep exact measured physical value without noise
            next[key] = targets[key]
          } else if (def.kind === 'binary') {
            next[key] = targets[key]
          } else {
            // Standby virtual nodes: gentle realistic wave
            const baseT = targets[key]
            const noise = (Math.random() - 0.5) * 2 * def.noise * vol
            const simSpike = isSimulating && def.station.id === 'air' && Math.random() < 0.15 ? Math.random() * 8 : 0
            const candidate = prev[key] + (baseT - prev[key]) * 0.15 + noise + simSpike
            next[key] = clamp(candidate, def.min, def.max)
          }
        })

        // Update live historical curves
        setLiveData((prevHist) => {
          const nextHist = { ...prevHist }
          Object.keys(next).forEach((key) => {
            const currentArr = prevHist[key] || []
            nextHist[key] = [...currentArr.slice(1), { t: now, v: next[key] }]
          })
          return nextHist
        })

        // Push standard heartbeat log if not flooded by physical packets
        const candidateKeys = ['pm25', 'mq135', 'co', 'temp', 'water', 'soil']
        const pickKey = candidateKeys[Math.floor(Math.random() * candidateKeys.length)]
        const pickDef = metricsDefMap[pickKey]
        if (pickDef) {
          const val = next[pickKey]
          const tone = getMetricTone(pickDef, val)
          const lab = getMetricLabel(pickDef, val)
          const formatted = pickDef.kind === 'binary'
            ? (val ? 'Detected' : 'Clear')
            : fmt(val, pickDef.dec) + (pickDef.unit ? ' ' + pickDef.unit : '')

          setLogs((prevLogs) => [
            {
              id: `${now}-${Math.random()}`,
              t: now,
              st: pickDef.station.node,
              param: pickDef.param,
              val: formatted,
              tone,
              lab,
              fresh: true
            },
            ...prevLogs.map((l) => ({ ...l, fresh: false }))
          ].slice(0, 80))
        }

        return next
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [floodNode, cotempNode, pollutionNode, isSimulating, metricsDefMap, getMetricTone, getMetricLabel])

  // Station overall worst tone
  const getStationWorstTone = useCallback((station) => {
    let worst = 'ok'
    station.metrics.forEach((m) => {
      const v = metricValues[m.id]
      const tone = getMetricTone(m, v)
      if (RANK[tone] > RANK[worst]) worst = tone
    })
    return worst
  }, [metricValues, getMetricTone])

  // Active alerts list derived from any metric with tone != 'ok'
  const activeAlerts = useMemo(() => {
    const list = []
    STATIONS_DEF.forEach((s) => {
      s.metrics.forEach((m) => {
        const v = metricValues[m.id]
        const tone = getMetricTone(m, v)
        if (RANK[tone] > 0) {
          const label = getMetricLabel(m, v)
          const valText = m.kind === 'binary'
            ? (v ? 'Detected' : 'Clear')
            : fmt(v, m.dec) + (m.unit ? ' ' + m.unit : '')
          list.push({
            mDef: m,
            station: s,
            tone,
            label,
            valText,
            alert: m.alert || { t: `${m.label} outside safe range`, x: 'Check the sensor and the surrounding area.' }
          })
        }
      })
    })
    return list.sort((a, b) => RANK[b.tone] - RANK[a.tone])
  }, [metricValues, getMetricTone, getMetricLabel])

  // Mesh stats
  const activeNodesCount = [floodNode, cotempNode, pollutionNode].filter((n) => Boolean(n && n.status === 'online')).length || 3
  const liveHwCount = [floodNode, cotempNode, pollutionNode].filter((n) => Boolean(n?.is_live_hw)).length
  const hazardScore = useMemo(() => {
    let sum = 0
    let count = 0
    STATIONS_DEF.forEach((s) => s.metrics.forEach((m) => {
      const t = getMetricTone(m, metricValues[m.id])
      sum += [0, 0.4, 0.7, 1.0][RANK[t]] || 0
      count++
    }))
    return Math.round((sum / Math.max(1, count)) * 100)
  }, [metricValues, getMetricTone])

  // Simulator toggle
  const toggleSimulator = () => {
    if (isSimulating) {
      webSerialService.stopSimulator()
      setIsSimulating(false)
      showToast('Packet simulator off.')
    } else {
      webSerialService.startSimulator(1200)
      setIsSimulating(true)
      showToast('Packet simulator on. Pollution readings will spike.')
    }
  }

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = logSearchQuery.trim().toLowerCase()
    return logs.filter((l) => {
      if (logStationFilter && l.st !== logStationFilter) return false
      if (q && !(l.param + ' ' + l.st + ' ' + l.lab).toLowerCase().includes(q)) return false
      return true
    }).slice(0, 8)
  }, [logs, logStationFilter, logSearchQuery])

  // Export CSV
  const handleExportCsv = () => {
    const q = logSearchQuery.trim().toLowerCase()
    const rows = logs.filter((l) => {
      if (logStationFilter && l.st !== logStationFilter) return false
      if (q && !(l.param + ' ' + l.st + ' ' + l.lab).toLowerCase().includes(q)) return false
      return true
    })
    const csv = ['Timestamp,Station,Parameter,Reading,State']
      .concat(rows.map((l) => [new Date(l.t).toISOString(), l.st, l.param, l.val, l.lab].map((x) => `"${x}"`).join(',')))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'code-vortex-telemetry.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast(`Exported ${rows.length} packets to CSV.`)
  }

  return (
    <div className="telemetry-page">
      {/* ─── Embedded SVG Sprite ────────────────────────────────────────── */}
      <svg width="0" height="0" style={{ position: 'absolute', display: 'none' }} aria-hidden="true">
        <symbol id="i-dash" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></symbol>
        <symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></symbol>
        <symbol id="i-map" viewBox="0 0 24 24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></symbol>
        <symbol id="i-spark" viewBox="0 0 24 24"><path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M19 3v4M17 5h4M19 17v4M17 19h4"/></symbol>
        <symbol id="i-alert" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></symbol>
        <symbol id="i-term" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></symbol>
        <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></symbol>
        <symbol id="i-radio" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/></symbol>
        <symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 2.7s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12z"/></symbol>
        <symbol id="i-flame" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></symbol>
        <symbol id="i-wind" viewBox="0 0 24 24"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></symbol>
        <symbol id="i-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></symbol>
        <symbol id="i-chev-r" viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></symbol>
      </svg>

      <main className="page" id="top">
        {/* ─── Hero Section ──────────────────────────────────────────────── */}
        <section className="hero">
          <div>
            <h1>Built for the next generation of real-time hazard detection.</h1>
            <p className="lead">
              Code Vortex reads environmental data from low-power ESP32 and LoRa sensor clusters.
              You get sub-second alerts, GIS heatmaps and predictive hazard analytics, with no cloud in the loop.
            </p>
            <div className="cta">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setUsbModalOpen(true)}
              >
                <svg className="i"><use href="#i-term" /></svg>
                <span>{usbConnected ? 'Gateway Connected' : 'Open serial gateway terminal'}</span>
                {usbConnected && <span className="pulse" style={{ color: '#86efac', marginLeft: '6px' }} />}
              </button>

              <Link to="/map" className="btn btn-ghost">
                <svg className="i"><use href="#i-map" /></svg>
                <span>Open tactical GIS map</span>
              </Link>

              <button
                type="button"
                className="btn btn-ghost"
                aria-pressed={isSimulating}
                onClick={toggleSimulator}
              >
                <svg className="i"><use href="#i-play" /></svg>
                <span>{isSimulating ? 'Stop packet simulator' : 'Test packet simulator'}</span>
              </button>
            </div>

            <ul className="specs">
              <li><b>Under 100 ms</b><span>Hazard detection</span></li>
              <li><b>99.8%</b><span>Packet reliability</span></li>
              <li><b>Up to 15 km</b><span>LoRa range</span></li>
            </ul>
          </div>

          {/* ─── Interactive Mesh Topology Card ─────────────────────────── */}
          <div className="mesh" aria-label="Live mesh network">
            <div className="mesh-head">
              <div>
                <h2>Cluster connectivity</h2>
                <p>{selectedRegion}</p>
              </div>
              <span className="glass-chip">
                <span className="pulse" />
                Active stream
              </span>
            </div>

            <svg className="viz" viewBox="0 0 480 290" role="img" aria-label="Three sensor nodes sending packets to gateway">
              <defs>
                <radialGradient id="gwg">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Gateway Glow Background */}
              <circle cx="250" cy="142" r="70" fill="url(#gwg)" />

              {/* Flow Dashed Connection Lines */}
              <line className="flow" x1="90" y1="58" x2="250" y2="142" />
              <line className="flow" x1="100" y1="200" x2="250" y2="142" />
              <line className="flow" x1="388" y1="96" x2="250" y2="142" />

              {/* Pulsing Gateway Radar Rings */}
              <circle className="gw-ring" cx="250" cy="142" r="34" />
              <circle className="gw-ring b" cx="250" cy="142" r="34" />

              {/* Traveling Packet Dots */}
              <circle r="3.4" fill="#fff">
                <animateMotion
                  path="M90,58 L250,142"
                  dur={isSimulating ? '1.1s' : '2.2s'}
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="3.4" fill="#fff">
                <animateMotion
                  path="M100,200 L250,142"
                  dur={isSimulating ? '1.25s' : '2.55s'}
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="3.4" fill="#fff">
                <animateMotion
                  path="M388,96 L250,142"
                  dur={isSimulating ? '1.4s' : '2.9s'}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Center Gateway Marker */}
              <circle cx="250" cy="142" r="27" fill="#fff" />
              <g className="nic" transform="translate(237, 129)">
                <use href="#i-radio" width="26" height="26" />
              </g>
              <text x="250" y="192" textAnchor="middle" fontSize="12.5" fontWeight="700">Gateway</text>

              {/* Node 1: Flood */}
              <circle
                cx="90"
                cy="58"
                r="27"
                fill="none"
                stroke={TONE_ON_BLUE[getStationWorstTone(STATIONS_DEF[0])]}
                strokeWidth="3"
              />
              <circle cx="90" cy="58" r="21" fill="#fff" />
              <g className="nic" transform="translate(79, 47)">
                <use href="#i-drop" width="22" height="22" />
              </g>
              <text x="90" y="104" textAnchor="middle" fontSize="12.5" fontWeight="700">Flood</text>
              <text x="90" y="120" textAnchor="middle" fontSize="12" opacity="0.85">
                {fmt(metricValues.water, 1)} cm
              </text>

              {/* Node 2: CO + thermal */}
              <circle
                cx="100"
                cy="200"
                r="27"
                fill="none"
                stroke={TONE_ON_BLUE[getStationWorstTone(STATIONS_DEF[1])]}
                strokeWidth="3"
              />
              <circle cx="100" cy="200" r="21" fill="#fff" />
              <g className="nic" transform="translate(89, 189)">
                <use href="#i-flame" width="22" height="22" />
              </g>
              <text x="100" y="246" textAnchor="middle" fontSize="12.5" fontWeight="700">CO + thermal</text>
              <text x="100" y="262" textAnchor="middle" fontSize="12" opacity="0.85">
                {fmt(metricValues.temp, 1)} °C
              </text>

              {/* Node 3: Air quality */}
              <circle
                cx="388"
                cy="96"
                r="27"
                fill="none"
                stroke={TONE_ON_BLUE[getStationWorstTone(STATIONS_DEF[2])]}
                strokeWidth="3"
              />
              <circle cx="388" cy="96" r="21" fill="#fff" />
              <g className="nic" transform="translate(377, 85)">
                <use href="#i-wind" width="22" height="22" />
              </g>
              <text x="388" y="142" textAnchor="middle" fontSize="12.5" fontWeight="700">Air quality</text>
              <text x="388" y="158" textAnchor="middle" fontSize="12" opacity="0.85">
                PM2.5 {fmt(metricValues.pm25, 0)}
              </text>
            </svg>

            {/* Mesh Stats */}
            <div className="mesh-stats">
              <div className="mstat">
                <span>Nodes online</span>
                <b>{liveHwCount > 0 ? `${liveHwCount} / 3 Live HW` : `${activeNodesCount} / 3 Online`}</b>
              </div>
              <div className="mstat">
                <span>Network latency</span>
                <b>{isSimulating ? '19 ms' : '12 ms'}</b>
              </div>
              <div className="mstat">
                <span>Combined hazard index</span>
                <b>
                  {hazardScore}%
                  <small style={{ marginLeft: '4px' }}>
                    {hazardScore < 15 ? 'Low' : hazardScore < 35 ? 'Elevated' : 'High'}
                  </small>
                </b>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Sensor Stations ────────────────────────────────────────────── */}
        <section className="section" id="stations">
          <div className="sec-head">
            <div>
              <h2>Sensor stations</h2>
              <p>Three ESP32 nodes report over the LoRa mesh. Readings refresh every 2 seconds.</p>
            </div>

            <div className="head-tools">
              <span className="hint">
                <span className="pulse" />
                {timeRange === 'live' ? 'Streaming live' : `Showing the last ${timeRange === '1h' ? 'hour' : timeRange === '6h' ? '6 hours' : timeRange === '24h' ? '24 hours' : '7 days'}`}
              </span>

              <div className="seg" role="group" aria-label="Chart time window">
                {['live', '1h', '6h', '24h', '7d'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={timeRange === w}
                    onClick={() => setTimeRange(w)}
                  >
                    {w === 'live' ? 'Live' : w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="stations">
            {STATIONS_DEF.map((station) => {
              const worstTone = getStationWorstTone(station)
              const colsClass = station.charts.length === 4 ? 'cols-2' : `cols-${station.charts.length}`

              return (
                <article key={station.id} className="card station" id={`st-${station.id}`}>
                  {/* Station Header */}
                  <div className="st-head">
                    <span className="st-ico" style={{ '--c': station.color }}>
                      <svg className="i"><use href={`#${station.icon}`} /></svg>
                    </span>

                    <div className="st-title">
                      <h3>{station.name}</h3>
                      <p>{station.loc}</p>
                      <div className="st-badges">
                        <span className="node-id">{station.node}</span>
                        {(() => {
                          const n = station.id === 'flood' ? floodNode : station.id === 'co' ? cotempNode : pollutionNode
                          return n?.is_live_hw ? (
                            <span className="hw">
                              <span className="pulse" />
                              Live hardware (Connected)
                            </span>
                          ) : (
                            <span className="hw" style={{ background: '#f1f5f9', color: '#64748b' }}>
                              <span className="pulse" style={{ color: '#94a3b8' }} />
                              Standby (Virtual Mesh)
                            </span>
                          )
                        })()}
                        <span className="coords">Lat {station.lat}, Lng {station.lng}</span>
                      </div>
                    </div>

                    <div className="st-state">
                      <span>Telemetry state</span>
                      <span className={`state-chip tone-${worstTone}`}>
                        {STATE_LBL[worstTone]}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="metrics">
                    {station.metrics.map((m) => {
                      const v = metricValues[m.id]
                      const tone = getMetricTone(m, v)
                      const lbl = getMetricLabel(m, v)
                      const isBinary = m.kind === 'binary'
                      const pct = clamp(((v - m.min) / Math.max(0.001, m.max - m.min)) * 100, 0, 100)

                      return (
                        <div key={m.id} className={`metric tone-${tone} ${isBinary ? 'binary' : ''}`} id={`m-${m.id}`}>
                          <div className="m-top">
                            <span className="m-label">{m.label}</span>
                            <span className="chip">{lbl}</span>
                          </div>
                          <div className="m-val">
                            <span className="m-num">
                              {isBinary ? (v ? 'DETECTED / 1' : 'CLEAR / 0') : fmt(v, m.dec)}
                            </span>
                            {m.unit && <small>{m.unit}</small>}
                          </div>
                          {!isBinary && (
                            <div className="gauge">
                              <i style={{ width: `${pct.toFixed(1)}%` }} />
                            </div>
                          )}
                          <p className="m-note">{m.note}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Charts Row */}
                  <div className={`charts ${colsClass}`}>
                    {station.charts.map((cDef, cIdx) => (
                      <SvgChart
                        key={`chart-${station.id}-${cIdx}`}
                        def={cDef}
                        stationId={station.id}
                        chartIndex={cIdx}
                        win={timeRange}
                        liveData={liveData}
                        metricValues={metricValues}
                        metricsDefMap={metricsDefMap}
                      />
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* ─── Active Hazard Alerts ───────────────────────────────────────── */}
        <section className="section" id="alerts" style={{ marginTop: '56px' }}>
          <div className="sec-head">
            <div>
              <h2>
                Active hazard alerts
                {activeAlerts.length > 0 && (
                  <span className="count-chip">
                    {activeAlerts.filter((a) => a.tone === 'bad').length > 0
                      ? `${activeAlerts.filter((a) => a.tone === 'bad').length} critical`
                      : `${activeAlerts.length} active`}
                  </span>
                )}
              </h2>
              <p>Raised automatically when a sensor leaves its safe range.</p>
            </div>

            <Link to="/alerts" className="link-btn">
              <span>View all alerts</span>
              <svg className="i"><use href="#i-chev-r" /></svg>
            </Link>
          </div>

          <div className="card alerts">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((al, idx) => (
                <div key={idx} className={`alert tone-${al.tone}`}>
                  <i className="rail" />
                  <div>
                    <div className="a-top">
                      <span className="sev">{SEV[al.tone]}</span>
                      <b>{al.alert.t}</b>
                    </div>
                    <p>{al.station.loc}. {al.alert.x}</p>
                  </div>
                  <div className="a-val">
                    <b>{al.valText}</b>
                    <span>Just now</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="all-clear">
                All sensors are inside their safe ranges.
              </div>
            )}
          </div>
        </section>

        {/* ─── Telemetry Sensor Logs ──────────────────────────────────────── */}
        <section className="section" id="logs" style={{ marginTop: '56px' }}>
          <div className="card logs">
            <div className="sec-head" style={{ marginBottom: 0 }}>
              <div>
                <h2>Telemetry sensor logs</h2>
                <p>Serial packets received straight from the field nodes.</p>
              </div>

              <div className="log-tools">
                <select
                  className="field"
                  value={logStationFilter}
                  onChange={(e) => setLogStationFilter(e.target.value)}
                  aria-label="Filter by station"
                >
                  <option value="">All stations</option>
                  {STATIONS_DEF.map((s) => (
                    <option key={s.node} value={s.node}>{s.node}</option>
                  ))}
                </select>

                <input
                  className="field"
                  type="search"
                  placeholder="Search parameter..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  aria-label="Search parameter"
                />

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleExportCsv}
                >
                  <svg className="i"><use href="#i-download" /></svg>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Packet timestamp</th>
                    <th>Origin station</th>
                    <th>Physical parameter</th>
                    <th>Real-time reading</th>
                    <th>Operational state</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((l) => {
                      const d = new Date(l.t)
                      const ts = `${d.toLocaleTimeString('en-GB')}.${String(d.getMilliseconds()).padStart(3, '0')}`
                      return (
                        <tr key={l.id} className={l.fresh ? 'fresh' : ''}>
                          <td className="ts">{ts}</td>
                          <td className="st">{l.st}</td>
                          <td>{l.param}</td>
                          <td className="rd">{l.val}</td>
                          <td>
                            <span className={`state-pill tone-${l.tone}`}>
                              {l.lab}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="5">
                        <div className="no-rows">No packets match this filter yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Feedback Toast ──────────────────────────────────────────────── */}
      <div className={`toast ${toastMsg ? 'show' : ''}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </div>
  )
}
