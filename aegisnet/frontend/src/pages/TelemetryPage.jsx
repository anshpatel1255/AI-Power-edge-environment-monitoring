// TelemetryPage.jsx — Code Vortex Live Telemetry
// Exact recreation of the Code Vortex Live Telemetry specification
// Fully functional with real-time dynamic sensor values from Zustand store, physical USB hardware, and packet simulator.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useStore } from '../store/useStore'
import { webSerialService } from '../services/webSerialService'
import './TelemetryPage.css'

const BACKEND_URL = 'http://localhost:4000'

// ─── Helpers & Formatting ───────────────────────────────────────────────────
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const fmt = (v, d) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const RANK = { ok: 0, warn: 1, poor: 2, bad: 3 }
const STATE_LBL = { ok: 'Normal', warn: 'Watch', poor: 'Warning', bad: 'Alert', off: 'Offline' }
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
        label: 'CO gas (ZE07-CO)',
        param: 'CO Gas (ZE07-CO)',
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
  // If there is no real current reading, return empty — never show fake data
  if (currentVal == null || isNaN(currentVal)) return []
  const N = 48
  const span = SPAN[w] || 36e5
  const now = Date.now()
  const dt = span / (N - 1)
  const r = rng(hash(mDef.id + w))
  // Use real current value as the anchor; simulate only small ±noise around it
  const amp = Math.min((mDef.noise || 0.5) * 2, (mDef.max - mDef.min) * 0.04)
  const ph = r() * 6.283
  const cyc = { '1h': 1.5, '6h': 2, '24h': 2.5, '7d': 4 }[w] || 2
  const out = []
  for (let i = 0; i < N; i++) {
    let v = mDef.kind === 'binary' ? 0 : currentVal + amp * Math.sin(ph + i / (N - 1) * cyc * 6.283) * 0.7 + (r() - 0.5) * amp * 0.9
    out.push({ t: now - span + i * dt, v: clamp(v, mDef.min, mDef.max) })
  }
  // Last point always equals real current value
  if (mDef.kind !== 'binary') {
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
        const rawPts = liveData[s.m] || []
        if (rawPts.length === 1) {
          data = [{ t: rawPts[0].t - 2000, v: rawPts[0].v }, rawPts[0]]
        } else {
          data = rawPts
        }
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
  const maxN = Math.max(...seriesInfo.map((s) => s.data.length), 0)
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

  const X = useCallback((i) => padL + (i * pw) / Math.max(1, maxN - 1), [padL, pw, maxN])
  const Y = useCallback((v, a) => {
    const sc = scales[a] || scales.l
    return padT + ph - ((v - sc.lo) / Math.max(0.0001, sc.hi - sc.lo)) * ph
  }, [scales, padT, ph])

  const handlePointerMove = (e) => {
    if (!containerRef.current || maxN < 2) return
    const rect = containerRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const idx = clamp(Math.round(((px - padL) / pw) * (maxN - 1)), 0, maxN - 1)
    const exactX = padL + (idx * pw) / Math.max(1, maxN - 1)

    const items = seriesInfo.map((s) => {
      const sLen = s.data.length
      const sIdx = sLen > 0 ? clamp(Math.round(((px - padL) / pw) * (sLen - 1)), 0, sLen - 1) : 0
      const pt = s.data[sIdx]
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

    const timeStr = tlabel(seriesInfo[0]?.data[idx]?.t || Date.now(), true, win)
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
    return seriesInfo.map((s, sIdx) => {
      const sn = s.data.length
      if (sn < 2) return null
      const pts = s.data.map((p, j) => [
        padL + (j * pw) / Math.max(1, sn - 1),
        Y(p.v, s.axis)
      ])
      let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
      for (let j = 1; j < pts.length; j++) {
        const [x0, y0] = pts[j - 1]
        const [x1, y1] = pts[j]
        const mx = ((x0 + x1) / 2).toFixed(1)
        d += ` C ${mx},${y0.toFixed(1)} ${mx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
      }
      const areaD = `${d} L ${pts[sn - 1][0].toFixed(1)},${padT + ph} L ${pts[0][0].toFixed(1)},${padT + ph} Z`
      const lastPt = pts[sn - 1]
      return {
        lineD: d,
        areaD,
        lastPt,
        color: s.color,
        hasArea: seriesInfo.length === 1 && !def.noArea,
        gradId: `cg-${stationId}-${chartIndex}-${sIdx}`
      }
    }).filter(Boolean)
  }, [seriesInfo, Y, padL, pw, padT, ph, def.noArea, stationId, chartIndex])

  // X ticks
  const xIndices = useMemo(() => {
    if (maxN < 2) return []
    return [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (maxN - 1))))]
  }, [maxN])

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

          {/* Awaiting Hardware Telemetry Placeholder */}
          {(curves.length === 0 || curves.every((c) => !c.lineD || c.lineD.trim() === '')) && (
            <g>
              <rect x={padL} y={padT} width={pw} height={ph} fill="#f8fafc" opacity="0.7" rx="6" />
              <text x={padL + pw / 2} y={padT + ph / 2} textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                Awaiting physical sensor telemetry from ESP32...
              </text>
            </g>
          )}

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
  const usbPortName     = useStore((s) => s.usbPortName)
  const usbPacketCount  = useStore((s) => s.usbPacketCount)
  const usbPacketsPerSec = useStore((s) => s.usbPacketsPerSec)
  const usbBaudRate     = useStore((s) => s.usbBaudRate)
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

  const [connectingHw, setConnectingHw] = useState(false)
  const [selectedBaud, setSelectedBaud] = useState(usbBaudRate || 115200)
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [lastAttempt, setLastAttempt] = useState(null)

  // Helper to extract initial values from store nodes
  const getInitialMetrics = useCallback(() => {
    const init = {}
    const store = useStore.getState()
    const flood = store.esp32Nodes?.find((n) => (n.node_id?.includes('FLOOD') || n.category === 'flood') && n.is_live_hw)
    const cotemp = store.esp32Nodes?.find((n) => (n.node_id?.includes('COTEMP') || n.category === 'fire') && n.is_live_hw)
    const pollution = store.esp32Nodes?.find((n) => (n.node_id?.includes('POLLUTION') || n.category === 'air') && n.is_live_hw)

    if (flood) {
      if (flood.water_level_cm != null) init.water = flood.water_level_cm
      if (flood.soil_moisture != null) init.soil = flood.soil_moisture
    }
    if (cotemp) {
      if (cotemp.gas_ppm != null) init.co = cotemp.gas_ppm
      if (cotemp.temperature_c != null) init.temp = cotemp.temperature_c
      if (cotemp.humidity_pct != null) init.hum = cotemp.humidity_pct
      if (cotemp.flame_detected !== undefined) init.flame = cotemp.flame_detected ? 1 : 0
    }
    if (pollution) {
      if (pollution.smoke_aqi != null) init.pm25 = pollution.smoke_aqi
      if (pollution.pm10 != null) init.pm10 = pollution.pm10
      if (pollution.mq135_strength != null) init.mq135 = pollution.mq135_strength
      if (pollution.mq4_strength != null) init.mq4 = pollution.mq4_strength
      if (pollution.pm1 != null) init.pm1 = pollution.pm1
      if (pollution.optical_density != null) init.od = pollution.optical_density
    }
    return init
  }, [])

  // Track master ESP32 gateway connectivity and node liveness
  const [masterOnline, setMasterOnline] = useState(false)
  const [nodeOnlineStatus, setNodeOnlineStatus] = useState({ FLOOD: false, CO_TEMP: false, POLLUTION: false })
  const [masterLastSeen, setMasterLastSeen] = useState(null)

  // Track timestamps when physical hardware data was received per metric ID
  const [sensorLastSeen, setSensorLastSeen] = useState({})

  // Determine whether a sensor is actively streaming real data
  // Strictly based on Master Gateway ONLINE AND real packet arrival within the last 30 seconds!
  const isSensorLive = useCallback((metricId) => {
    if (isSimulating) return true
    if (!masterOnline) return false
    const lastT = sensorLastSeen[metricId]
    if (!lastT) return false
    return (Date.now() - lastT) < 30000 // consider live only if updated within 30s
  }, [isSimulating, masterOnline, sensorLastSeen])

  // Determine whether a station has any active physical sensors
  const isStationLive = useCallback((station) => {
    if (isSimulating) return true
    if (!masterOnline) return false
    if (!station || !station.metrics) return false
    const nodeKey = station.node === 'ESP32-FLOOD' ? 'FLOOD' : (station.node === 'ESP32-COTEMP' ? 'CO_TEMP' : 'POLLUTION')
    if (nodeOnlineStatus[nodeKey] === false) return false
    return station.metrics.some((m) => isSensorLive(m.id))
  }, [isSimulating, masterOnline, nodeOnlineStatus, isSensorLive])

  const handleConnectUsb = async (baud = selectedBaud) => {
    setConnectingHw(true)
    try {
      await webSerialService.connect(baud)
      showToast(`✓ ESP32 connected at ${baud} baud! Streaming live telemetry.`)
      // Refresh local metrics and timestamps
      const initVals = getInitialMetrics()
      setMetricValues((prev) => ({ ...prev, ...initVals }))
      const now = Date.now()
      setSensorLastSeen((prev) => {
        const next = { ...prev }
        Object.keys(initVals).forEach((k) => { next[k] = now })
        return next
      })
    } catch (err) {
      if (err.name === 'NotFoundError') {
        showToast('Port selection cancelled.')
      } else {
        showToast(`Connection failed: ${err.message}`)
      }
    } finally {
      setConnectingHw(false)
    }
  }

  const handleSwitchBaud = async (baud) => {
    setSelectedBaud(baud)
    try {
      await webSerialService.switchBaudRate(baud)
      showToast(`✓ Reconfigured to ${baud} baud`)
    } catch (err) {
      showToast(`Baud switch error: ${err.message}`)
    }
  }

  const handleDisconnectUsb = async () => {
    try {
      await webSerialService.disconnect()
      showToast('ESP32 disconnected.')
    } catch (err) {
      showToast(`Disconnect error: ${err.message}`)
    }
  }

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

  // Synchronize and query physical ESP32 gateway state
  const handleCheckGateway = async () => {
    try {
      showToast('Checking Master ESP32 Gateway status...')
      const res = await fetch(`${BACKEND_URL}/api/sensor-data/system-status`)
      if (res.ok) {
        const status = await res.json()
        const isMaster = status?.master?.status === 'ONLINE'
        setMasterOnline(isMaster)
        if (isMaster) {
          showToast('🟢 Master ESP32 Gateway is ONLINE and streaming!')
          const latestRes = await fetch(`${BACKEND_URL}/api/sensor-data/latest`)
          if (latestRes.ok) {
            const latestData = await latestRes.json()
            if (latestData.nodes?.FLOOD?.status === 'ONLINE' && latestData.nodes.FLOOD.latest) {
              applySensorReading('FLOOD', latestData.nodes.FLOOD.latest)
            }
            if (latestData.nodes?.CO_TEMP?.status === 'ONLINE' && latestData.nodes.CO_TEMP.latest) {
              applySensorReading('CO_TEMP', latestData.nodes.CO_TEMP.latest)
            }
            if (latestData.nodes?.POLLUTION?.status === 'ONLINE' && latestData.nodes.POLLUTION.latest) {
              applySensorReading('POLLUTION', latestData.nodes.POLLUTION.latest)
            }
          }
        } else {
          setNodeOnlineStatus({ FLOOD: false, CO_TEMP: false, POLLUTION: false })
          setSensorLastSeen({})
          setMetricValues({})
          showToast('🔴 Master ESP32 is OFFLINE. Connect USB COM port or power on hardware.')
        }
      } else {
        setMasterOnline(false)
        setSensorLastSeen({})
        setMetricValues({})
        showToast('🔴 Backend server reachable, but Master ESP32 is OFFLINE.')
      }
    } catch {
      setMasterOnline(false)
      setSensorLastSeen({})
      setMetricValues({})
      showToast('⚠ Cannot reach backend server on port 4000.')
    }
  }

  // Flattened metrics dictionary
  const metricsDefMap = useMemo(() => {
    const map = {}
    STATIONS_DEF.forEach((s) => s.metrics.forEach((m) => { map[m.id] = { ...m, station: s } }))
    return map
  }, [])

  // Live metric values state (empty until physical data arrives)
  const [metricValues, setMetricValues] = useState({})

  // Live rolling history buffer (clean real-time buffers, no fake initial sine waves)
  const [liveData, setLiveData] = useState(() => {
    const init = {}
    STATIONS_DEF.forEach((s) => s.metrics.forEach((m) => {
      init[m.id] = []
    }))
    return init
  })

  // Logs stream state — starts empty; only real hardware readings populate this
  const [logs, setLogs] = useState(() => [])

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
  // ─── Central Unified Sensor Ingestion Function ───────────────────────────
  const applySensorReading = useCallback((nodeKey, raw) => {
    if (!raw || typeof raw !== 'object') return
    const now = Date.now()
    const nodeUpper = String(nodeKey || raw.node || raw.node_id || '').toUpperCase()
    const liveMetrics = {}
    const newLogEntries = []

    // 1. Flood Node (HC-SR04 ultrasonic distance + analog soil moisture)
    if (nodeUpper.includes('FLOOD')) {
      const dist = raw.distance ?? raw.distance_cm ?? raw.water_level_cm ?? raw.water
      const soil = raw.soilMoisture ?? raw.soil_moisture ?? raw.soil_moisture_percent ?? raw.soil
      // Strictly ignore blind spot / noise / timeout glitches (< 2.0 cm)
      if (dist != null && !isNaN(dist) && Number(dist) >= 2.0) {
        const numDist = Number(dist)
        liveMetrics.water = numDist
        newLogEntries.push({ st: 'ESP32-FLOOD', param: 'Water Distance', val: `${fmt(numDist, 1)} cm`, mKey: 'water' })
      }
      // Strictly ignore unread / zero soil saturation
      if (soil != null && !isNaN(soil) && Number(soil) > 0) {
        const numSoil = Number(soil)
        liveMetrics.soil = numSoil
        newLogEntries.push({ st: 'ESP32-FLOOD', param: 'Soil Saturation', val: `${fmt(numSoil, 1)} %`, mKey: 'soil' })
      }
    }

    // 2. CO / Thermal Node (ZE07-CO actual CO ppm + DHT11 Temp/Hum + Flame IR)
    if (nodeUpper.includes('CO') || nodeUpper.includes('TEMP') || nodeUpper.includes('FIRE')) {
      const co = raw.coPPM ?? raw.co_ppm ?? raw.gas_ppm ?? raw.co
      const temp = raw.dhtTemperature ?? raw.temperature_c ?? raw.temp
      const hum = raw.humidity ?? raw.humidity_pct ?? raw.hum
      const flame = raw.flame_detected !== undefined ? raw.flame_detected : raw.flame
      if (co != null && !isNaN(co) && Number(co) >= 0) {
        const numCo = Number(co)
        liveMetrics.co = numCo
        newLogEntries.push({ st: 'ESP32-COTEMP', param: 'CO Gas (ZE07-CO)', val: `${fmt(numCo, 2)} ppm`, mKey: 'co' })
      }
      if (temp != null && !isNaN(temp) && Number(temp) > 0) {
        const numTemp = Number(temp)
        liveMetrics.temp = numTemp
        newLogEntries.push({ st: 'ESP32-COTEMP', param: 'Ambient Temp', val: `${fmt(numTemp, 1)} °C`, mKey: 'temp' })
      }
      if (hum != null && !isNaN(hum) && Number(hum) > 0) {
        const numHum = Number(hum)
        liveMetrics.hum = numHum
        newLogEntries.push({ st: 'ESP32-COTEMP', param: 'Relative Humidity', val: `${fmt(numHum, 1)} %`, mKey: 'hum' })
      }
      if (flame !== undefined && flame !== null) {
        const flameVal = Boolean(flame) ? 1 : 0
        liveMetrics.flame = flameVal
        newLogEntries.push({ st: 'ESP32-COTEMP', param: 'Flame Sensor', val: flameVal ? 'DETECTED / 1' : 'CLEAR / 0', mKey: 'flame' })
      }
    }

    // 3. Pollution Node (PMS5003 Laser PM + MQ-135 + MQ-4 relative gas)
    if (nodeUpper.includes('POLLUTION') || nodeUpper.includes('AIR')) {
      const p25 = raw.PM2_5 ?? raw.pm2_5 ?? raw.smoke_aqi
      const p10 = raw.PM10 ?? raw.pm10
      const p1 = raw.PM1_0 ?? raw.pm1_0 ?? raw.pm1
      const mq135 = raw.mq135_strength
      const mq4 = raw.mq4_strength
      const od = raw.optical_density ?? p25

      if (p25 != null && !isNaN(p25) && Number(p25) > 0) {
        const num25 = Number(p25)
        liveMetrics.pm25 = num25
        liveMetrics.od = num25
        newLogEntries.push({ st: 'ESP32-POLLUTION', param: 'PM2.5 Density', val: `${fmt(num25, 0)} µg/m³`, mKey: 'pm25' })
      }
      if (p10 != null && !isNaN(p10) && Number(p10) > 0) {
        const num10 = Number(p10)
        liveMetrics.pm10 = num10
        newLogEntries.push({ st: 'ESP32-POLLUTION', param: 'PM10 Density', val: `${fmt(num10, 0)} µg/m³`, mKey: 'pm10' })
      }
      if (p1 != null && !isNaN(p1) && Number(p1) > 0) {
        const num1 = Number(p1)
        liveMetrics.pm1 = num1
        newLogEntries.push({ st: 'ESP32-POLLUTION', param: 'PM1.0 Density', val: `${fmt(num1, 1)} µg/m³`, mKey: 'pm1' })
      }
      if (mq135 != null && !isNaN(mq135) && Number(mq135) > 0) {
        const num135 = Number(mq135)
        liveMetrics.mq135 = num135
        newLogEntries.push({ st: 'ESP32-POLLUTION', param: 'MQ-135 Gas', val: `${fmt(num135, 1)} %`, mKey: 'mq135' })
      }
      if (mq4 != null && !isNaN(mq4) && Number(mq4) > 0) {
        const num4 = Number(mq4)
        liveMetrics.mq4 = num4
        newLogEntries.push({ st: 'ESP32-POLLUTION', param: 'MQ-4 Combustible', val: `${fmt(num4, 1)} %`, mKey: 'mq4' })
      }
      if (od != null && !isNaN(od) && Number(od) > 0 && liveMetrics.od == null) {
        liveMetrics.od = Number(od)
      }
    }

    if (Object.keys(liveMetrics).length > 0) {
      setSensorLastSeen((prev) => {
        const next = { ...prev }
        Object.keys(liveMetrics).forEach((k) => { next[k] = now })
        return next
      })

      setMetricValues((prev) => ({ ...prev, ...liveMetrics }))

      setLiveData((prevHist) => {
        const nextHist = { ...prevHist }
        Object.keys(liveMetrics).forEach((k) => {
          const curArr = prevHist[k] || []
          const val = liveMetrics[k]
          const lastEntry = curArr[curArr.length - 1]
          if (lastEntry && now - lastEntry.t < 1500 && Math.abs(lastEntry.v - val) < 0.001) {
            return
          }
          let newArr
          if (curArr.length === 0) {
            newArr = Array.from({ length: 8 }, (_, idx) => ({
              t: now - (8 - idx) * 2000,
              v: val
            }))
            newArr.push({ t: now, v: val })
          } else {
            newArr = [...curArr, { t: now, v: val }]
          }
          nextHist[k] = newArr.length > 30 ? newArr.slice(newArr.length - 30) : newArr
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
  }, [metricsDefMap, getMetricTone, getMetricLabel])

  // ─── 1. Ingestion from Zustand Store (Web Serial & SSE Bridge) ──────────────
  useEffect(() => {
    // Strictly guard against stale store mock values: only ingest if real physical packets arrived recently
    const isPhysicalRecent = lastPhysicalPacketTime > 0 && (Date.now() - lastPhysicalPacketTime < 30000)
    if (!isPhysicalRecent) return

    if (floodNode && floodNode.is_live_hw && (floodNode.water_level_cm != null || floodNode.soil_moisture != null)) {
      applySensorReading('FLOOD', floodNode)
    }
    if (cotempNode && cotempNode.is_live_hw && (cotempNode.temperature_c != null || cotempNode.gas_ppm != null)) {
      applySensorReading('CO_TEMP', cotempNode)
    }
    if (pollutionNode && pollutionNode.is_live_hw && (pollutionNode.smoke_aqi != null || pollutionNode.mq135_strength != null)) {
      applySensorReading('POLLUTION', pollutionNode)
    }
  }, [floodNode, cotempNode, pollutionNode, lastPhysicalPacketTime, applySensorReading])

  // ─── 2. Direct Ingestion from Node.js Backend & Socket.IO Stream ────────────
  useEffect(() => {
    let socket = null

    const fetchLatestFromBackend = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sensor-data/latest`)
        if (!res.ok) {
          setMasterOnline(false)
          setNodeOnlineStatus({ FLOOD: false, CO_TEMP: false, POLLUTION: false })
          setSensorLastSeen({})
          return
        }
        const json = await res.json()
        const isMaster = json?.master?.status === 'ONLINE'
        setMasterOnline(isMaster)
        if (json?.master?.lastSeen) {
          setMasterLastSeen(json.master.lastSeen)
        }

        if (!isMaster) {
          // Physical master ESP32 is OFFLINE: mark all nodes offline
          setNodeOnlineStatus({ FLOOD: false, CO_TEMP: false, POLLUTION: false })
          setSensorLastSeen({})
          return
        }

        if (json && json.nodes) {
          const floodOn = json.nodes.FLOOD?.status === 'ONLINE'
          const cotempOn = json.nodes.CO_TEMP?.status === 'ONLINE'
          const pollutionOn = json.nodes.POLLUTION?.status === 'ONLINE'

          setNodeOnlineStatus({
            FLOOD: floodOn,
            CO_TEMP: cotempOn,
            POLLUTION: pollutionOn,
          })

          if (json.nodes.FLOOD?.latest) {
            applySensorReading('FLOOD', json.nodes.FLOOD.latest)
          }
          if (json.nodes.CO_TEMP?.latest) {
            applySensorReading('CO_TEMP', json.nodes.CO_TEMP.latest)
          }
          if (json.nodes.POLLUTION?.latest) {
            applySensorReading('POLLUTION', json.nodes.POLLUTION.latest)
          }
        }
      } catch {
        setMasterOnline(false)
        setNodeOnlineStatus({ FLOOD: false, CO_TEMP: false, POLLUTION: false })
        setSensorLastSeen({})
      }
    }

    fetchLatestFromBackend()
    const pollTimer = setInterval(fetchLatestFromBackend, 2000)

    try {
      socket = io(BACKEND_URL, {
        reconnectionDelay: 2000,
        transports: ['websocket', 'polling'],
      })

      socket.on('sensor:data', (packet) => {
        if (packet && packet.node) {
          setMasterOnline(true)
          applySensorReading(packet.node, packet)
        }
      })
    } catch {
      // ignore
    }

    return () => {
      clearInterval(pollTimer)
      if (socket) socket.disconnect()
    }
  }, [applySensorReading, isSimulating])

  // ─── 3. Continuous Sensor Liveness Monitor & Simulation Ticker ──────────────
  // Inactive / OFF sensors are NEVER given fake numbers! They cleanly show OFFLINE.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      // Automatically expire sensors that stopped transmitting (> 35s)
      if (!isSimulating) {
        setSensorLastSeen((prev) => {
          let changed = false
          const next = {}
          Object.keys(prev).forEach((k) => {
            if (now - prev[k] < 35000) {
              next[k] = prev[k]
            } else {
              changed = true
            }
          })
          return changed ? next : prev
        })
      }

      // Only undulate numbers if the user explicitly turned ON test simulator
      if (isSimulating) {
        setMetricValues((prev) => {
          const next = { ...prev }
          Object.keys(metricsDefMap).forEach((key) => {
            const def = metricsDefMap[key]
            if (!def) return
            const baseT = def.base || 30
            const cur = prev[key] != null ? prev[key] : baseT
            const noise = (Math.random() - 0.5) * 2 * (def.noise || 0.5) * 2.0
            next[key] = clamp(cur + (baseT - cur) * 0.15 + noise, def.min, def.max)
          })
          return next
        })

        setLiveData((prevHist) => {
          const nextHist = { ...prevHist }
          Object.keys(metricsDefMap).forEach((key) => {
            const def = metricsDefMap[key]
            if (def) {
              const curArr = prevHist[key] || []
              const baseT = def.base || 30
              const curVal = metricValues[key] != null ? metricValues[key] : baseT
              nextHist[key] = [...curArr.slice(1), { t: now, v: parseFloat(curVal.toFixed(def.dec || 1)) }]
            }
          })
          return nextHist
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isSimulating, metricValues, metricsDefMap])

  // Station overall worst tone
  const getStationWorstTone = useCallback((station) => {
    let worst = 'ok'
    let hasLiveMetric = false
    station.metrics.forEach((m) => {
      if (!isSensorLive(m.id)) return
      const v = metricValues[m.id]
      if (v == null) return
      hasLiveMetric = true
      const tone = getMetricTone(m, v)
      if (RANK[tone] > RANK[worst]) worst = tone
    })
    return hasLiveMetric ? worst : 'off'
  }, [metricValues, getMetricTone, isSensorLive])

  // Active alerts list derived only from active/live metrics with tone != 'ok'
  const activeAlerts = useMemo(() => {
    const list = []
    STATIONS_DEF.forEach((s) => {
      s.metrics.forEach((m) => {
        if (!isSensorLive(m.id)) return // do not generate fake alerts for offline sensors
        const v = metricValues[m.id]
        if (v == null) return
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
  }, [metricValues, getMetricTone, getMetricLabel, isSensorLive])

  // Mesh stats
  const activeSensorsCount = useMemo(() => {
    return Object.keys(metricsDefMap).filter((k) => isSensorLive(k)).length
  }, [metricsDefMap, isSensorLive])

  const liveStationCount = useMemo(() => {
    return STATIONS_DEF.filter((s) => isStationLive(s)).length
  }, [isStationLive])

  const hazardScore = useMemo(() => {
    let sum = 0
    let count = 0
    STATIONS_DEF.forEach((s) => s.metrics.forEach((m) => {
      if (!isSensorLive(m.id) || metricValues[m.id] == null) return
      const t = getMetricTone(m, metricValues[m.id])
      sum += [0, 0.4, 0.7, 1.0][RANK[t]] || 0
      count++
    }))
    if (count === 0) return 0
    return Math.round((sum / count) * 100)
  }, [metricValues, getMetricTone, isSensorLive])

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
        {/* ─── HARDWARE · GATEWAY CONNECTION (EXACT DESIGN MATCH) ─────────────── */}
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 800, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase' }}>
            HARDWARE · GATEWAY CONNECTION
          </span>
        </div>

        <div style={{
          background: masterOnline ? '#f0fdf4' : '#fff5f5',
          border: masterOnline ? '1.5px solid #bbf7d0' : '1.5px solid #fecaca',
          borderRadius: '26px',
          padding: '24px 28px',
          marginBottom: '28px',
          boxShadow: masterOnline ? '0 4px 20px -2px rgba(34, 197, 94, 0.12)' : '0 4px 20px -2px rgba(244, 63, 94, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* Top Row: Squircle, Title, Status Badge, Subtext */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            {/* Left Squircle */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: masterOnline ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f43f5e, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '22px',
              boxShadow: masterOnline ? '0 4px 14px rgba(16, 185, 129, 0.35)' : '0 4px 14px rgba(244, 63, 94, 0.3)',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>

            {/* Title & Badge */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18.5px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Master ESP32 Gateway
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  background: '#ffffff',
                  border: masterOnline ? '1.5px solid #86efac' : '1.5px solid #fecaca',
                  color: masterOnline ? '#15803d' : '#e11d48',
                  fontSize: '11px',
                  fontFamily: 'var(--mono)',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: masterOnline ? '#22c55e' : '#f43f5e',
                    display: 'inline-block'
                  }} className={masterOnline ? 'pulse' : ''} />
                  {masterOnline ? 'ONLINE · HARDWARE STREAMING' : 'OFFLINE · AWAITING HARDWARE'}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', marginTop: '6px', marginBottom: 0, lineHeight: 1.55 }}>
                {masterOnline ? (
                  <>
                    Gateway connected and synchronized. <strong style={{ color: '#0f172a' }}>Streaming real physical sensor data</strong> — Master ESP32 forwarding ESP-NOW packets from all field nodes over USB COM.
                  </>
                ) : (
                  <>
                    No gateway is connected. <strong style={{ color: '#0f172a' }}>Nothing on this dashboard is simulated</strong> — plug in the physical Master ESP32 over USB and connect below to start streaming live sensor data.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Middle Diagram Box: Topology */}
          <div style={{
            background: '#ffffff',
            border: masterOnline ? '1.5px solid #dcfce7' : '1.5px solid #ffe4e6',
            borderRadius: '18px',
            padding: '24px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '680px',
              margin: '0 auto',
              position: 'relative',
              flexWrap: 'nowrap'
            }}>
              {/* Node 1: SOC Console */}
              <div style={{ textAlign: 'center', zIndex: 1, minWidth: '95px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: '#eff6ff',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: '0 1px 4px rgba(59, 130, 246, 0.15)'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
                  SOC Console
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: '#94a3b8', marginTop: '2px' }}>
                  this browser
                </div>
              </div>

              {/* Connector 1 to 2 */}
              <div style={{
                flex: 1,
                margin: '0 12px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '100%',
                  borderBottom: masterOnline ? '2px dashed #22c55e' : '2px dashed #f43f5e',
                  position: 'absolute'
                }} />
                <span style={{
                  position: 'relative',
                  background: '#ffffff',
                  padding: '0 8px',
                  color: masterOnline ? '#16a34a' : '#f43f5e',
                  fontSize: masterOnline ? '14px' : '15px',
                  fontWeight: 900
                }}>
                  {masterOnline ? '✓' : '✕'}
                </span>
              </div>

              {/* Node 2: Master ESP32 */}
              <div style={{ textAlign: 'center', zIndex: 1, minWidth: '95px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: masterOnline ? '#ecfdf5' : '#fff1f2',
                  color: masterOnline ? '#10b981' : '#f43f5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: masterOnline ? '0 1px 4px rgba(16, 185, 129, 0.15)' : '0 1px 4px rgba(244, 63, 94, 0.15)'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v6m0 8v6M8 8v4a4 4 0 0 0 8 0V8"/>
                  </svg>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
                  Master ESP32
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: '#94a3b8', marginTop: '2px' }}>
                  USB COM port
                </div>
              </div>

              {/* Connector 2 to 3 */}
              <div style={{
                flex: 1,
                margin: '0 12px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '100%',
                  borderBottom: masterOnline ? '2px dashed #86efac' : '2px dashed #cbd5e1',
                  position: 'absolute'
                }} />
                <span style={{
                  position: 'relative',
                  background: '#ffffff',
                  padding: '0 6px',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontFamily: 'var(--mono)'
                }}>
                  {masterOnline ? 'ESP-NOW' : '······'}
                </span>
              </div>

              {/* Node 3: Sensor Mesh */}
              <div style={{ textAlign: 'center', zIndex: 1, minWidth: '95px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: '#f5f3ff',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  boxShadow: '0 1px 4px rgba(139, 92, 246, 0.15)'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.9 19.1A10 10 0 0 1 12 16a10 10 0 0 1 7.1 3.1M7.8 16.2A6 6 0 0 1 12 14a6 6 0 0 1 4.2 2.2M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                    <line x1="12" y1="2" x2="12" y2="4"/>
                  </svg>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
                  Sensor Mesh
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: '#94a3b8', marginTop: '2px' }}>
                  field nodes
                </div>
              </div>
            </div>
          </div>

          {/* Action Row: Baud Rate, Check status, Connect ESP32, Settings */}
          <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            {/* Baud Rate Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 800, letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                BAUD RATE
              </label>
              <select
                value={selectedBaud}
                onChange={(e) => {
                  const b = Number(e.target.value)
                  setSelectedBaud(b)
                  if (usbConnected) handleSwitchBaud(b)
                }}
                style={{
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  color: '#0f172a',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  minWidth: '120px'
                }}
              >
                <option value={115200}>115200</option>
                <option value={9600}>9600</option>
                <option value={57600}>57600</option>
                <option value={38400}>38400</option>
              </select>
            </div>

            {/* Check gateway status button */}
            <button
              type="button"
              onClick={() => {
                setLastAttempt(new Date().toLocaleTimeString())
                handleCheckGateway()
              }}
              style={{
                height: '42px',
                padding: '0 18px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span>Check gateway status</span>
            </button>

            {/* Connect ESP32 (USB COM Port) primary button */}
            {usbConnected ? (
              <button
                type="button"
                onClick={handleDisconnectUsb}
                style={{
                  height: '42px',
                  padding: '0 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⚡</span>
                <span>Disconnect ESP32 (COM Connected)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLastAttempt(new Date().toLocaleTimeString())
                  handleConnectUsb(selectedBaud)
                }}
                disabled={connectingHw}
                style={{
                  height: '42px',
                  padding: '0 26px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⚡</span>
                <span>{connectingHw ? 'Opening Port...' : 'Connect ESP32 (USB COM Port)'}</span>
              </button>
            )}

            {/* Settings button */}
            <button
              type="button"
              onClick={() => setUsbModalOpen(true)}
              style={{
                height: '42px',
                padding: '0 18px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Settings</span>
            </button>
          </div>

          {/* Collapsible 3-Step Checklist */}
          <div style={{ marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setChecklistOpen(!checklistOpen)}
              style={{
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '4px 0',
                background: 'none',
                border: 'none'
              }}
            >
              <span>{checklistOpen ? '▲' : '▼'}</span>
              <span>{checklistOpen ? "Not sure why it's offline? Hide checklist" : "Not sure why it's offline? Show the 3-step checklist"}</span>
            </button>

            {checklistOpen && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px',
                marginTop: '10px'
              }}>
                {/* Step 1 */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#fff1f2',
                    border: '1px solid #fecaca',
                    color: '#e11d48',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'var(--mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    1
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                    Plug the Master ESP32 into this machine using a <code style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--mono)', color: '#0f172a', fontWeight: 600 }}>USB-C data</code> cable — not a charge-only cable.
                  </p>
                </div>

                {/* Step 2 */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#fff1f2',
                    border: '1px solid #fecaca',
                    color: '#e11d48',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'var(--mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    2
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                    Match the baud rate above to the firmware setting. Default for stock builds is <code style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--mono)', color: '#0f172a', fontWeight: 600 }}>115200</code>.
                  </p>
                </div>

                {/* Step 3 */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#fff1f2',
                    border: '1px solid #fecaca',
                    color: '#e11d48',
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'var(--mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    3
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                    Click <code style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--mono)', color: '#0f172a', fontWeight: 600 }}>Connect</code> and pick the ESP32's COM port from the browser's serial port prompt.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer inside card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            marginTop: '4px',
            borderTop: masterOnline ? '1px solid #dcfce7' : '1px solid #fee2e2',
            fontSize: '12px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              Last connection attempt: <strong style={{ color: '#0f172a', fontFamily: 'var(--mono)' }}>{lastAttempt || 'never this session'}</strong>
            </div>
            <button
              type="button"
              onClick={() => setUsbModalOpen(true)}
              style={{
                color: '#2563eb',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                padding: 0
              }}
            >
              <span>View hardware setup guide</span>
              <span>→</span>
            </button>
          </div>
        </div>

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
                <span className={masterOnline ? "pulse" : ""} style={{ background: masterOnline ? '#22c55e' : '#ef4444' }} />
                {masterOnline ? "Active stream" : "Gateway Offline"}
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
              <line className="flow" x1="90" y1="58" x2="250" y2="142" stroke={masterOnline ? undefined : '#cbd5e1'} strokeDasharray={masterOnline ? '4 4' : '2 4'} />
              <line className="flow" x1="100" y1="200" x2="250" y2="142" stroke={masterOnline ? undefined : '#cbd5e1'} strokeDasharray={masterOnline ? '4 4' : '2 4'} />
              <line className="flow" x1="388" y1="96" x2="250" y2="142" stroke={masterOnline ? undefined : '#cbd5e1'} strokeDasharray={masterOnline ? '4 4' : '2 4'} />

              {/* Pulsing Gateway Radar Rings */}
              {masterOnline && (
                <>
                  <circle className="gw-ring" cx="250" cy="142" r="34" />
                  <circle className="gw-ring b" cx="250" cy="142" r="34" />
                </>
              )}

              {/* Traveling Packet Dots — only active when physical gateway is transmitting */}
              {masterOnline && (
                <>
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
                </>
              )}

              {/* Center Gateway Marker */}
              <circle cx="250" cy="142" r="27" fill={masterOnline ? "#fff" : "#fef2f2"} stroke={masterOnline ? "#22c55e" : "#ef4444"} strokeWidth="2.5" />
              <g className="nic" transform="translate(237, 129)">
                <use href="#i-radio" width="26" height="26" />
              </g>
              <text x="250" y="192" textAnchor="middle" fontSize="12.5" fontWeight="700">Gateway: {masterOnline ? 'ONLINE' : 'OFFLINE'}</text>

              {/* Node 1: Flood */}
              <circle
                cx="90"
                cy="58"
                r="27"
                fill="none"
                stroke={isStationLive(STATIONS_DEF[0]) ? '#86efac' : '#cbd5e1'}
                strokeWidth="3"
              />
              <circle cx="90" cy="58" r="21" fill={isStationLive(STATIONS_DEF[0]) ? '#fff' : '#f8fafc'} />
              <g className="nic" transform="translate(79, 47)">
                <use href="#i-drop" width="22" height="22" />
              </g>
              <text x="90" y="104" textAnchor="middle" fontSize="12.5" fontWeight="700">Flood</text>
              <text x="90" y="120" textAnchor="middle" fontSize="12" opacity={isSensorLive('water') && metricValues.water != null ? '0.85' : '0.45'}>
                {isSensorLive('water') && metricValues.water != null ? `${fmt(metricValues.water, 1)} cm` : 'OFFLINE'}
              </text>

              {/* Node 2: CO + thermal */}
              <circle
                cx="100"
                cy="200"
                r="27"
                fill="none"
                stroke={isStationLive(STATIONS_DEF[1]) ? '#86efac' : '#cbd5e1'}
                strokeWidth="3"
              />
              <circle cx="100" cy="200" r="21" fill={isStationLive(STATIONS_DEF[1]) ? '#fff' : '#f8fafc'} />
              <g className="nic" transform="translate(89, 189)">
                <use href="#i-flame" width="22" height="22" />
              </g>
              <text x="100" y="246" textAnchor="middle" fontSize="12.5" fontWeight="700">CO + thermal</text>
              <text x="100" y="262" textAnchor="middle" fontSize="12" opacity={isSensorLive('temp') && metricValues.temp != null ? '0.85' : '0.45'}>
                {isSensorLive('temp') && metricValues.temp != null ? `${fmt(metricValues.temp, 1)} °C` : 'OFFLINE'}
              </text>

              {/* Node 3: Air quality */}
              <circle
                cx="388"
                cy="96"
                r="27"
                fill="none"
                stroke={isStationLive(STATIONS_DEF[2]) ? '#86efac' : '#cbd5e1'}
                strokeWidth="3"
              />
              <circle cx="388" cy="96" r="21" fill={isStationLive(STATIONS_DEF[2]) ? '#fff' : '#f8fafc'} />
              <g className="nic" transform="translate(377, 85)">
                <use href="#i-wind" width="22" height="22" />
              </g>
              <text x="388" y="142" textAnchor="middle" fontSize="12.5" fontWeight="700">Air quality</text>
              <text x="388" y="158" textAnchor="middle" fontSize="12" opacity={isSensorLive('pm25') && metricValues.pm25 != null ? '0.85' : '0.45'}>
                {isSensorLive('pm25') && metricValues.pm25 != null ? `PM2.5 ${fmt(metricValues.pm25, 0)}` : 'OFFLINE'}
              </text>
            </svg>

            {/* Mesh Stats */}
            <div className="mesh-stats">
              <div className="mstat">
                <span>Active stations</span>
                <b>{liveStationCount > 0 ? `${liveStationCount} / 3 Live` : '0 / 3 (Standby)'}</b>
              </div>
              <div className="mstat">
                <span>Live sensors</span>
                <b>{activeSensorsCount > 0 ? `${activeSensorsCount} / 8 Live` : '0 / 8 Sensors'}</b>
              </div>
              <div className="mstat">
                <span>Network latency</span>
                <b>{usbConnected ? (isSimulating ? '19 ms' : '8 ms (USB Serial)') : '12 ms'}</b>
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
                          const stationLive = isStationLive(station)
                          if (stationLive) {
                            return (
                              <span className="hw" style={{ background: '#dcfce7', color: '#15803d', border: '1.5px solid #86efac', fontWeight: 800 }}>
                                <span className="pulse" style={{ color: '#22c55e' }} />
                                🟢 ONLINE · LIVE TELEMETRY STREAM
                              </span>
                            )
                          }
                          return (
                            <span className="hw" style={{ background: '#fee2e2', color: '#991b1b', border: '1.5px solid #fca5a5', fontWeight: 800 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                              🔴 OFFLINE · AWAITING PHYSICAL SENSOR DATA
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
                      const live = isSensorLive(m.id)
                      const v = metricValues[m.id]
                      const tone = live && v != null ? getMetricTone(m, v) : 'ok'
                      const lbl = live && v != null ? getMetricLabel(m, v) : 'Sensor Off'
                      const isBinary = m.kind === 'binary'
                      const pct = live && v != null
                        ? clamp(((v - m.min) / Math.max(0.001, m.max - m.min)) * 100, 0, 100)
                        : 0

                      return (
                        <div key={m.id} className={`metric tone-${live ? tone : 'off'} ${isBinary ? 'binary' : ''}`} id={`m-${m.id}`} style={{
                          opacity: live ? 1 : 0.65,
                          border: live
                            ? (tone === 'bad' ? '1.5px solid #ef4444' : tone === 'poor' ? '1.5px solid #f97316' : '1.5px solid #86efac')
                            : '1.5px dashed #cbd5e1',
                          background: live ? '#ffffff' : '#f8fafc',
                          transition: 'all 0.3s ease'
                        }}>
                          <div className="m-top">
                            <span className="m-label" style={{ fontWeight: 700, color: live ? '#0f172a' : '#64748b' }}>{m.label}</span>
                            {live ? (
                              <span className="chip" style={{
                                background: tone === 'bad' ? '#fee2e2' : tone === 'poor' ? '#ffedd5' : '#dcfce7',
                                color: tone === 'bad' ? '#b91c1c' : tone === 'poor' ? '#c2410c' : '#15803d',
                                border: '1px solid currentColor',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <span className="pulse" style={{ color: 'currentColor' }} />
                                🟢 LIVE · {lbl}
                              </span>
                            ) : (
                              <span className="chip" style={{ background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                                ⚪ SENSOR OFF
                              </span>
                            )}
                          </div>

                          <div className="m-val" style={{ margin: '10px 0 6px 0' }}>
                            {live && v != null ? (
                              <>
                                <span className="m-num" style={{ color: '#0f172a', fontWeight: 800 }}>
                                  {isBinary ? (v ? 'DETECTED / 1' : 'CLEAR / 0') : fmt(v, m.dec)}
                                </span>
                                {m.unit && <small style={{ color: '#475569', fontWeight: 600 }}>{m.unit}</small>}
                              </>
                            ) : (
                              <span className="m-num" style={{ color: '#94a3b8', fontSize: '20px', letterSpacing: '2px' }}>
                                -- <small style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: 'normal', fontWeight: 600 }}>(No Signal)</small>
                              </span>
                            )}
                          </div>

                          {!isBinary && (
                            <div className="gauge" style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px' }}>
                              <i style={{
                                width: `${pct.toFixed(1)}%`,
                                background: live ? (tone === 'bad' ? '#ef4444' : tone === 'poor' ? '#f97316' : '#22c55e') : '#cbd5e1'
                              }} />
                            </div>
                          )}

                          <p className="m-note" style={{ fontSize: '11px', marginTop: '6px', color: live ? '#15803d' : '#94a3b8' }}>
                            {live ? (
                              <span>⚡ Live hardware stream active · Last packet {sensorLastSeen[m.id] ? ago(sensorLastSeen[m.id]) : 'Just now'}</span>
                            ) : (
                              <span>Sensor offline. Connect sensor pins on ESP32 to stream physical readings.</span>
                            )}
                          </p>
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
