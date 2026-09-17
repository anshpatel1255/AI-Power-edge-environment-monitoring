// pages/AnalysisPage.jsx — Tactical AI Predictive Hazard & Dispersion (Photo 5)

import { useState } from 'react'
import clsx from 'clsx'

export default function AnalysisPage() {
  const [protocolExecuted, setProtocolExecuted] = useState(false)
  const [activeDiagnosticFilter, setActiveDiagnosticFilter] = useState('flagged') // 'flagged' | 'nominal'
  const [diagnostics, setDiagnostics] = useState([
    {
      id: 'S-009',
      zone: 'Zone 1 - Ridge North',
      subsystem: 'Capacitive Humidity',
      variance: '+8.4% Variance',
      varianceColor: 'text-error font-semibold',
      tendency: 'Positive creep',
      tendencyIcon: 'north_east',
      tendencyColor: 'text-error',
      diagnosis: 'Hydrophobic membrane particulate coating suspected.',
      action: 'Auto-Offset',
      actionType: 'button',
      isFlagged: true,
      done: false,
    },
    {
      id: 'S-014',
      zone: 'Zone 3 - Catchment Weir',
      subsystem: 'Piezo Pressure Transducer',
      variance: '-3.1% Variance',
      varianceColor: 'text-secondary font-semibold',
      tendency: 'Negative pulse',
      tendencyIcon: 'south',
      tendencyColor: 'text-secondary',
      diagnosis: 'Silt accumulation near base intake chamber.',
      action: 'Purge Cycle',
      actionType: 'button',
      isFlagged: true,
      done: false,
    },
    {
      id: 'S-042',
      zone: 'Zone 4 - Industrial Perimeter',
      subsystem: 'Laser Scattering Optical',
      variance: '+11.2% Drift',
      varianceColor: 'text-error font-semibold',
      tendency: 'Rapid bias',
      tendencyIcon: 'arrow_upward',
      tendencyColor: 'text-error',
      diagnosis: 'Optic chamber fogging; thermal dew-point mismatch.',
      action: 'Cycle Heater',
      actionType: 'primary-button',
      isFlagged: true,
      done: false,
    },
    {
      id: 'S-027',
      zone: 'Zone 2 - Forest Canopy Base',
      subsystem: 'Electrochemical CO Sensor',
      variance: '0.0% [Nominal]',
      varianceColor: 'text-primary font-semibold',
      tendency: 'Steady State',
      tendencyIcon: 'horizontal_rule',
      tendencyColor: 'text-primary',
      diagnosis: 'Telemetry valid; self-test passed at 14:00 UTC.',
      action: 'VERIFIED',
      actionType: 'badge',
      isFlagged: false,
      done: true,
    },
  ])

  const handleAction = (id) => {
    setDiagnostics((prev) =>
      prev.map((d) => (d.id === id ? { ...d, done: true } : d))
    )
  }

  const displayedDiagnostics = diagnostics.filter((d) =>
    activeDiagnosticFilter === 'flagged' ? d.isFlagged : !d.isFlagged
  )

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg select-none">
      {/* ─── 1. Top Predictive Hazard Classification & AI Prescriptive Response ── */}
      <div className="w-full bg-surface-container rounded-xl p-space-lg border border-[#1a261d] shadow-md">
        <div className="flex flex-col xl:flex-row gap-space-lg">
          {/* Left Column: Primary Predictive Alert */}
          <div className="xl:w-4/12 flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-[#1a261d] pb-space-md xl:pb-0 xl:pr-space-lg">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                  Predictive Hazard Classification
                </span>
                <span className="px-space-xs py-0.5 rounded bg-secondary-container/20 text-secondary font-label-caps text-label-caps font-bold">
                  ELEVATED FORECAST
                </span>
              </div>
              <div className="flex items-baseline gap-space-sm mb-space-xs">
                <span className="material-symbols-outlined text-[32px] text-secondary">warning_amber</span>
                <h2 className="font-headline-lg text-headline-lg text-secondary font-bold">
                  WARNING: TIER-2 SURGE
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Next 6–12 Hours Projection: Neural hydrological cascade points to rapid catchment saturation in District 3.
              </p>
            </div>

            <div className="mt-space-lg pt-space-md bg-surface-container-lowest/60 p-space-sm rounded border border-[#1a261d]">
              <div className="flex justify-between font-label-caps text-label-caps text-outline mb-1">
                <span>SURGE PROBABILITY ENVELOPE</span>
                <span className="text-secondary font-telemetry-sm font-bold">84.2% [High Risk]</span>
              </div>
              <div className="w-full h-2 rounded bg-[#1a261d] overflow-hidden">
                <div className="h-full bg-secondary transition-all duration-1000" style={{ width: '84.2%' }}></div>
              </div>
              <div className="flex justify-between font-telemetry-sm text-telemetry-sm text-on-surface-variant mt-1.5">
                <span>Window: 16:00 UTC</span>
                <span className="text-error font-bold">Peak: 17:30 UTC</span>
                <span>Subside: 22:00 UTC</span>
              </div>
            </div>
          </div>

          {/* Middle Column: Synoptic Narrative & Field Telemetry */}
          <div className="xl:w-5/12 flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-[#1a261d] pb-space-md xl:pb-0 xl:pr-space-lg">
            <div>
              <div className="flex items-center gap-space-xs font-label-caps text-label-caps text-primary uppercase mb-space-xs font-bold tracking-wider">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                <span>Synthesized Inference Log</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-space-md">
                Flash flood probability <strong className="text-secondary">84% in Zone 3 Catchment</strong> between{' '}
                <span className="font-telemetry-sm text-on-surface bg-surface-container-high px-1 py-0.5 rounded">16:00</span> and{' '}
                <span className="font-telemetry-sm text-on-surface bg-surface-container-high px-1 py-0.5 rounded">19:00 UTC</span>. Runoff momentum compounded by saturated soil layers (89% matric suction breakdown) and 42mm/h continuous precipitation over Northern Ridges.
              </p>
            </div>

            {/* Field Telemetry Gauge Pills */}
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="bg-surface-container-high p-space-sm rounded border border-[#1a261d]">
                <span className="font-label-caps text-label-caps text-outline block">RUNOFF VELOCITY</span>
                <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">
                  3.8 <span className="font-body-sm text-body-sm text-outline font-normal">m/s</span>
                </span>
                <span className="font-telemetry-sm text-telemetry-sm text-error flex items-center gap-0.5 mt-0.5 font-bold">
                  <span className="material-symbols-outlined text-[12px]">north</span> +1.2 m/s
                </span>
              </div>

              <div className="bg-surface-container-high p-space-sm rounded border border-[#1a261d]">
                <span className="font-label-caps text-label-caps text-outline block">BASIN LOAD</span>
                <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">
                  92.4 <span className="font-body-sm text-body-sm text-outline font-normal">%</span>
                </span>
                <span className="font-telemetry-sm text-telemetry-sm text-secondary flex items-center gap-0.5 mt-0.5 font-bold">
                  <span className="material-symbols-outlined text-[12px]">trending_up</span> Critical band
                </span>
              </div>

              <div className="bg-surface-container-high p-space-sm rounded border border-[#1a261d]">
                <span className="font-label-caps text-label-caps text-outline block">TIME TO CREST</span>
                <span className="font-telemetry-lg text-telemetry-lg text-tertiary font-bold">
                  02:48 <span className="font-body-sm text-body-sm text-outline font-normal">hr</span>
                </span>
                <span className="font-telemetry-sm text-telemetry-sm text-primary flex items-center gap-0.5 mt-0.5 font-bold">
                  <span className="material-symbols-outlined text-[12px]">timer</span> Synchronized
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Prescriptive Response */}
          <div className="xl:w-3/12 flex flex-col justify-between bg-surface-container-highest/70 p-space-md rounded-lg border border-[#1a261d]">
            <div>
              <div className="flex items-center gap-space-xs font-label-caps text-label-caps text-primary uppercase mb-space-sm font-bold tracking-wider">
                <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                <span>AI Prescriptive Response</span>
              </div>
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-start gap-space-sm p-space-xs rounded bg-surface-container-low border border-[#1a261d]">
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary font-label-caps text-label-caps font-bold">
                    1
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">Trigger Secondary Spillway Gate</span>
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                      Gate B & D discharge to reduce Zone 3 head by 0.6m
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm p-space-xs rounded bg-surface-container-low border border-[#1a261d]">
                  <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary-fixed font-label-caps text-label-caps font-bold">
                    2
                  </span>
                  <div className="flex flex-col">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">District 3 Warning Dispatch</span>
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                      Broadcast geo-targeted civil alert (18,400 endpoints)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-space-md flex gap-space-sm">
              <button
                onClick={() => setProtocolExecuted(!protocolExecuted)}
                className={clsx(
                  'flex-1 py-space-xs px-space-sm rounded font-label-caps text-label-caps uppercase transition-colors flex items-center justify-center gap-1 font-bold',
                  protocolExecuted
                    ? 'bg-primary text-on-primary-fixed'
                    : 'bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-secondary'
                )}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {protocolExecuted ? 'check' : 'send'}
                </span>
                <span>{protocolExecuted ? 'Protocol Active' : 'Execute Protocol'}</span>
              </button>
              <button
                className="p-space-xs rounded bg-surface-container hover:bg-surface-bright text-outline hover:text-on-surface transition-colors"
                title="Review protocol matrix"
              >
                <span className="material-symbols-outlined text-[16px]">more_vert</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Analytical Trend Visualizations Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Hydrograph Water-Level Dynamic Trend (Span 7) */}
        <div className="lg:col-span-7 flex flex-col p-space-md bg-surface-container-low rounded-xl shadow-md border border-[#1a261d]">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-1.5 rounded bg-surface-container text-tertiary">
                <span className="material-symbols-outlined text-[18px]">tsunami</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
                  Water-Level Dynamic Hydrograph
                </h3>
                <span className="font-label-caps text-label-caps text-outline uppercase">
                  Zone 3 Catchment Sensor Array S-014 / S-018
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm font-telemetry-sm text-telemetry-sm">
              <span className="flex items-center gap-1 text-tertiary font-medium">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span> Observed
              </span>
              <span className="flex items-center gap-1 text-secondary font-medium">
                <span className="w-2 h-2 rounded-full bg-secondary border-dashed"></span> AI Projection
              </span>
              <span className="flex items-center gap-1 text-error font-medium">
                <span className="w-2 h-0.5 bg-error"></span> Breach Line (2.5m)
              </span>
            </div>
          </div>

          {/* Hydrograph SVG Graphic */}
          <div className="relative w-full h-56 bg-surface-container-lowest/80 rounded-lg p-space-sm flex flex-col justify-between overflow-hidden border border-[#1a261d]">
            {/* Y-Axis Ticks */}
            <div className="absolute inset-y-2 left-2 flex flex-col justify-between font-telemetry-sm text-telemetry-sm text-outline select-none pointer-events-none z-10">
              <span>4.0m</span>
              <span className="text-error font-bold">2.5m [CRIT]</span>
              <span>1.5m</span>
              <span>0.0m</span>
            </div>

            {/* Metric Critical Flag Callout */}
            <div className="absolute right-4 top-4 bg-surface-container/90 backdrop-blur px-space-sm py-1 rounded text-right z-10 border border-[#1a261d]">
              <span className="font-label-caps text-label-caps text-outline uppercase block">PROJECTED APEX</span>
              <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">
                3.12m <span className="font-label-caps text-label-caps text-error">@ 17:30 UTC</span>
              </span>
            </div>

            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
              <defs>
                <linearGradient id="hydroFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6bd8cb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6bd8cb" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="projectedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffb77d" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffb77d" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grids */}
              <line x1="40" y1="20" x2="590" y2="20" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" className="text-surface-variant/50" />
              <line x1="40" y1="75" x2="590" y2="75" stroke="#ffb4ab" strokeDasharray="4 2" strokeWidth="1.5" />
              <line x1="40" y1="130" x2="590" y2="130" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" className="text-surface-variant/50" />
              <line x1="40" y1="185" x2="590" y2="185" stroke="currentColor" strokeWidth="1" className="text-surface-variant" />

              {/* Observed Curve */}
              <path d="M 45 170 Q 120 165, 180 150 T 260 110 T 310 85 L 340 75 L 340 185 L 45 185 Z" fill="url(#hydroFill)" />
              <path d="M 45 170 Q 120 165, 180 150 T 260 110 T 310 85 L 340 75" fill="none" stroke="#6bd8cb" strokeWidth="2.5" strokeLinecap="round" />

              {/* Breach Point */}
              <circle cx="340" cy="75" r="4" fill="#ffb4ab" className="animate-ping" />
              <circle cx="340" cy="75" r="3.5" fill="#dee4dd" />

              {/* Projected Curve */}
              <path d="M 340 75 Q 390 50, 440 45 T 510 90 T 580 140 L 580 185 L 340 185 Z" fill="url(#projectedFill)" />
              <path d="M 340 75 Q 390 50, 440 45 T 510 90 T 580 140" fill="none" stroke="#ffb77d" strokeWidth="2.5" strokeDasharray="5 3" />
              <circle cx="440" cy="45" r="4" fill="#ffb77d" />
            </svg>

            {/* X-Axis timeline labels */}
            <div className="flex justify-between pl-10 pr-2 font-telemetry-sm text-telemetry-sm text-outline">
              <span>08:00</span>
              <span>11:00</span>
              <span>14:00 (NOW)</span>
              <span className="text-secondary font-bold">17:30 (Peak)</span>
              <span>20:00</span>
              <span>23:00 UTC</span>
            </div>
          </div>

          <div className="mt-space-sm flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant px-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-error">notification_important</span>
              Threshold breach verified at 14:15 (+0.12m/15min ramp).
            </span>
            <span className="font-telemetry-sm text-telemetry-sm text-outline">Sensor telemetry frequency: 60s</span>
          </div>
        </div>

        {/* 48h Diurnal Thermal Model (Span 5) */}
        <div className="lg:col-span-5 flex flex-col p-space-md bg-surface-container-low rounded-xl shadow-md border border-[#1a261d]">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-1.5 rounded bg-surface-container text-primary">
                <span className="material-symbols-outlined text-[18px]">thermostat</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
                  48h Diurnal Thermal Model
                </h3>
                <span className="font-label-caps text-label-caps text-outline uppercase">Surface Canopy Sensors</span>
              </div>
            </div>
            <span className="font-telemetry-sm text-telemetry-sm text-secondary bg-surface-container px-2 py-0.5 rounded font-semibold border border-[#1a261d]">
              +3.2°C Projected Spike
            </span>
          </div>

          <div className="relative w-full h-56 bg-surface-container-lowest/80 rounded-lg p-space-sm flex flex-col justify-between border border-[#1a261d]">
            <div className="flex items-center justify-between font-telemetry-sm text-telemetry-sm text-outline">
              <span>36°C</span>
              <span className="text-primary font-bold">Current: 28.4°C</span>
              <span>16°C</span>
            </div>

            <svg className="w-full h-36" preserveAspectRatio="none" viewBox="0 0 400 120">
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#96d5a3" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#96d5a3" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="10" y1="25" x2="390" y2="25" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.8" className="text-surface-variant/40" />
              <line x1="10" y1="65" x2="390" y2="65" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.8" className="text-surface-variant/40" />
              <line x1="10" y1="105" x2="390" y2="105" stroke="currentColor" strokeWidth="0.8" className="text-surface-variant" />

              <path d="M 10 70 Q 55 20, 100 65 T 190 70 T 280 20 T 390 40 L 390 115 L 10 115 Z" fill="url(#tempGradient)" />
              <path d="M 10 70 Q 55 20, 100 65 T 190 70" fill="none" stroke="#96d5a3" strokeWidth="2" />
              <path d="M 190 70 T 280 20 T 390 40" fill="none" stroke="#ffb77d" strokeWidth="2" strokeDasharray="4 2" />

              <circle cx="280" cy="20" r="3.5" fill="#ffb77d" />
              <line x1="280" y1="20" x2="280" y2="105" stroke="#ffb77d" strokeDasharray="2 2" strokeWidth="1" />
            </svg>

            <div className="flex justify-between font-telemetry-sm text-telemetry-sm text-outline">
              <span>-24h</span>
              <span>-12h</span>
              <span className="text-on-surface font-bold">T-0</span>
              <span className="text-secondary font-bold">+12h (31.6°C)</span>
              <span>+24h</span>
            </div>
          </div>

          <div className="mt-space-sm flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
            <span>Diurnal Inversion: <strong className="text-on-surface">Expected 03:00 UTC</strong></span>
            <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">Confidence: 94.1%</span>
          </div>
        </div>

        {/* AQI & Particulates (Span 4) */}
        <div className="lg:col-span-4 flex flex-col p-space-md bg-surface-container-low rounded-xl shadow-md border border-[#1a261d]">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-1.5 rounded bg-surface-container text-tertiary">
                <span className="material-symbols-outlined text-[18px]">air</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
                  AQI & Particulates
                </h3>
                <span className="font-label-caps text-label-caps text-outline uppercase">Sector 4 Industrial Shift</span>
              </div>
            </div>
            <span className="px-space-xs py-0.5 rounded bg-surface-container-highest font-label-caps text-label-caps text-on-surface font-semibold">
              PM2.5 / PM10
            </span>
          </div>

          <div className="h-48 bg-surface-container-lowest/80 rounded-lg p-space-sm flex flex-col justify-between border border-[#1a261d]">
            <div className="flex justify-between items-center font-telemetry-sm text-telemetry-sm text-outline">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-tertiary"></span> PM2.5 (Fine)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-outline"></span> PM10 (Coarse)</span>
            </div>

            <div className="flex items-end justify-between gap-space-xs h-32 pt-2 px-space-xs">
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center h-full">
                  <div className="w-2.5 bg-outline rounded-t" style={{ height: '35%' }}></div>
                  <div className="w-2.5 bg-tertiary rounded-t" style={{ height: '22%' }}></div>
                </div>
                <span className="font-telemetry-sm text-telemetry-sm text-outline">06h</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center h-full">
                  <div className="w-2.5 bg-outline rounded-t" style={{ height: '48%' }}></div>
                  <div className="w-2.5 bg-tertiary rounded-t" style={{ height: '38%' }}></div>
                </div>
                <span className="font-telemetry-sm text-telemetry-sm text-outline">08h</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center h-full">
                  <div className="w-2.5 bg-outline rounded-t" style={{ height: '70%' }}></div>
                  <div className="w-2.5 bg-tertiary rounded-t" style={{ height: '65%' }}></div>
                </div>
                <span className="font-telemetry-sm text-telemetry-sm text-secondary font-bold">10h</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center h-full">
                  <div className="w-2.5 bg-outline rounded-t" style={{ height: '85%' }}></div>
                  <div className="w-2.5 bg-tertiary rounded-t" style={{ height: '78%' }}></div>
                </div>
                <span className="font-telemetry-sm text-telemetry-sm text-error font-bold">12h</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex gap-0.5 items-end justify-center h-full">
                  <div className="w-2.5 bg-outline rounded-t" style={{ height: '94%' }}></div>
                  <div className="w-2.5 bg-tertiary rounded-t" style={{ height: '91%' }}></div>
                </div>
                <span className="font-telemetry-sm text-telemetry-sm text-error font-bold">14h</span>
              </div>
            </div>

            <div className="font-telemetry-sm text-telemetry-sm text-outline flex justify-between">
              <span>Baseload: 18 µg/m³</span>
              <span className="text-error font-semibold">Peak: 142 µg/m³ (Shift Change)</span>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm">
            Correlation coefficient <strong className="text-on-surface">r = 0.89</strong> against industrial furnace venting at Plant 4B.
          </p>
        </div>

        {/* Fire-Risk & Fuel Matrix (Span 4) */}
        <div className="lg:col-span-4 flex flex-col p-space-md bg-surface-container-low rounded-xl shadow-md border border-[#1a261d]">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-1.5 rounded bg-surface-container text-secondary">
                <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
                  Fire-Risk & Fuel Matrix
                </h3>
                <span className="font-label-caps text-label-caps text-outline uppercase">VPD vs Moisture Deficit</span>
              </div>
            </div>
            <span className="px-space-xs py-0.5 rounded bg-primary-container text-primary font-label-caps text-label-caps font-bold">
              MODERATE
            </span>
          </div>

          <div className="h-48 bg-surface-container-lowest/80 rounded-lg p-space-sm flex flex-col justify-between border border-[#1a261d]">
            <div className="flex justify-between items-center font-telemetry-sm text-telemetry-sm text-outline">
              <span>Canopy Fuel Matrix</span>
              <span className="text-secondary font-telemetry-sm font-bold">VPD: 2.1 kPa</span>
            </div>

            {/* 12 Grid Cells */}
            <div className="grid grid-cols-4 gap-1.5 py-1">
              <div className="h-6 rounded bg-surface-container flex items-center justify-center font-label-caps text-label-caps text-outline">Z-1</div>
              <div className="h-6 rounded bg-primary-container/60 flex items-center justify-center font-label-caps text-label-caps text-primary">Z-2</div>
              <div className="h-6 rounded bg-secondary-container/80 flex items-center justify-center font-label-caps text-label-caps text-on-secondary-container font-bold">Z-3</div>
              <div className="h-6 rounded bg-primary-container/40 flex items-center justify-center font-label-caps text-label-caps text-primary">Z-4</div>
              <div className="h-6 rounded bg-surface-container flex items-center justify-center font-label-caps text-label-caps text-outline">Z-5</div>
              <div className="h-6 rounded bg-surface-container flex items-center justify-center font-label-caps text-label-caps text-outline">Z-6</div>
              <div className="h-6 rounded bg-secondary-container flex items-center justify-center font-label-caps text-label-caps text-on-secondary-container font-bold">Z-7</div>
              <div className="h-6 rounded bg-primary-container flex items-center justify-center font-label-caps text-label-caps text-primary">Z-8</div>
              <div className="h-6 rounded bg-primary-container/50 flex items-center justify-center font-label-caps text-label-caps text-primary">Z-9</div>
              <div className="h-6 rounded bg-secondary flex items-center justify-center font-label-caps text-label-caps text-secondary font-bold">Z-10</div>
              <div className="h-6 rounded bg-surface-container flex items-center justify-center font-label-caps text-label-caps text-outline">Z-11</div>
              <div className="h-6 rounded bg-surface-container flex items-center justify-center font-label-caps text-label-caps text-outline">Z-12</div>
            </div>

            <div className="flex justify-between items-center font-telemetry-sm text-telemetry-sm">
              <span className="text-on-surface-variant">Fuel Moisture: <strong className="text-on-surface">11.4%</strong></span>
              <span className="text-secondary font-semibold">Keetch-Byram Index: 482</span>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm">
            Low vulnerability in lowland zones; ridge slopes exhibit elevated dry-brush ignition sensitivity.
          </p>
        </div>

        {/* Dispersion Simulation (Span 4) */}
        <div className="lg:col-span-4 flex flex-col p-space-md bg-surface-container-low rounded-xl shadow-md border border-[#1a261d]">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="p-1.5 rounded bg-surface-container text-tertiary">
                <span className="material-symbols-outlined text-[18px]">cyclone</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
                  Dispersion Simulation
                </h3>
                <span className="font-label-caps text-label-caps text-outline uppercase">Gaussian Plume Vectoring</span>
              </div>
            </div>
            <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant font-mono">SSW @ 14kt</span>
          </div>

          <div className="h-48 bg-surface-container-lowest/80 rounded-lg p-space-sm relative overflow-hidden flex flex-col justify-between border border-[#1a261d]">
            <div className="absolute inset-0 opacity-15 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-36 rounded-full border border-outline"></div>
              <div className="w-24 h-24 rounded-full border border-outline absolute"></div>
            </div>

            <div className="flex justify-between items-center font-label-caps text-label-caps text-outline z-10">
              <span>PLUME VELOCITY: 22 KM/H</span>
              <span className="text-tertiary font-bold">AZIMUTH: 215°</span>
            </div>

            <div className="relative w-full h-24 flex items-center justify-center z-10">
              <svg className="w-full h-full" viewBox="0 0 200 80">
                <circle cx="50" cy="40" r="6" fill="#6bd8cb" className="animate-pulse" />
                <path d="M 50 40 L 160 15 L 180 40 L 160 65 Z" fill="#6bd8cb" fillOpacity="0.18" />
                <path d="M 50 40 L 140 25 L 155 40 L 140 55 Z" fill="#6bd8cb" fillOpacity="0.25" />
                <line x1="50" y1="40" x2="160" y2="40" stroke="#6bd8cb" strokeDasharray="4 2" strokeWidth="2" />
                <polygon points="165,40 155,36 155,44" fill="#6bd8cb" />
              </svg>
            </div>

            <div className="flex justify-between items-center font-telemetry-sm text-telemetry-sm z-10 text-on-surface-variant">
              <span>Downwind Impact: <span className="text-on-surface font-semibold">2.4 km</span></span>
              <span className="text-tertiary font-semibold">Dilution: 1:450</span>
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm">
            Plume drift is tracking away from urban residential corridors toward western nature reserve.
          </p>
        </div>
      </div>

      {/* ─── 3. AI Anomaly Detection & Sensor Health Diagnostics ────────────── */}
      <div className="flex flex-col p-space-md bg-surface-container rounded-xl shadow-md border border-[#1a261d]">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-space-md gap-space-sm border-b border-[#1a261d]">
          <div className="flex items-center gap-space-sm">
            <div className="p-2 rounded bg-surface-container-high text-primary">
              <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Sensor Health Diagnostics & Anomaly Detection
              </h3>
              <span className="font-label-caps text-label-caps text-outline uppercase">
                Automated Continuous Bayesian Calibration Audit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm">
            <span className="font-label-caps text-label-caps text-outline">FILTER STATE:</span>
            <button
              onClick={() => setActiveDiagnosticFilter('flagged')}
              className={clsx(
                'px-space-sm py-1 rounded font-telemetry-sm text-telemetry-sm transition-colors',
                activeDiagnosticFilter === 'flagged'
                  ? 'bg-surface-container-high text-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant'
              )}
            >
              3 Flagged
            </button>
            <button
              onClick={() => setActiveDiagnosticFilter('nominal')}
              className={clsx(
                'px-space-sm py-1 rounded font-telemetry-sm text-telemetry-sm transition-colors',
                activeDiagnosticFilter === 'nominal'
                  ? 'bg-surface-container-high text-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant'
              )}
            >
              118 Nominal
            </button>
          </div>
        </div>

        {/* Diagnostic Table */}
        <div className="w-full overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="font-label-caps text-label-caps text-outline bg-surface-container-low border-b border-[#1a261d]">
                <th className="py-2.5 px-space-md font-semibold">DEVICE SERIAL</th>
                <th className="py-2.5 px-space-md font-semibold">ZONE / LOCAL</th>
                <th className="py-2.5 px-space-md font-semibold">SUBSYSTEM SENSOR</th>
                <th className="py-2.5 px-space-md font-semibold">CALIBRATION DRIFT</th>
                <th className="py-2.5 px-space-md font-semibold">DRIFT TENDENCY</th>
                <th className="py-2.5 px-space-md font-semibold">AI DIAGNOSIS</th>
                <th className="py-2.5 px-space-md font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="font-telemetry-sm text-telemetry-sm text-on-surface divide-y divide-[#1a261d]">
              {displayedDiagnostics.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-high transition-colors">
                  <td className="py-2.5 px-space-md font-bold text-primary">{item.id}</td>
                  <td className="py-2.5 px-space-md text-on-surface">{item.zone}</td>
                  <td className="py-2.5 px-space-md text-on-surface-variant">{item.subsystem}</td>
                  <td className="py-2.5 px-space-md">
                    <span className={item.varianceColor}>{item.variance}</span>
                  </td>
                  <td className="py-2.5 px-space-md">
                    <span className={clsx('flex items-center gap-1 font-medium', item.tendencyColor)}>
                      <span className="material-symbols-outlined text-[14px]">{item.tendencyIcon}</span>
                      {item.tendency}
                    </span>
                  </td>
                  <td className="py-2.5 px-space-md font-body-sm text-body-sm text-on-surface-variant">
                    {item.diagnosis}
                  </td>
                  <td className="py-2.5 px-space-md text-right whitespace-nowrap">
                    {item.actionType === 'badge' ? (
                      <span className="font-label-caps text-label-caps text-primary bg-primary-container/40 px-space-sm py-1 rounded uppercase font-bold">
                        {item.action}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAction(item.id)}
                        disabled={item.done}
                        className={clsx(
                          'px-space-sm py-1 rounded font-label-caps text-label-caps uppercase transition-colors font-bold',
                          item.done
                            ? 'bg-surface-container-highest text-outline cursor-default'
                            : item.actionType === 'primary-button'
                            ? 'bg-primary-container hover:bg-primary text-primary hover:text-on-primary-fixed'
                            : 'bg-surface-container-highest hover:bg-surface-bright text-on-surface'
                        )}
                      >
                        {item.done ? '✓ Completed' : item.action}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Diagnostic Meta Footer */}
        <div className="mt-space-md pt-space-sm flex flex-wrap items-center justify-between font-telemetry-sm text-telemetry-sm text-outline border-t border-[#1a261d] gap-space-sm">
          <div className="flex items-center gap-space-md">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Mesh nodes responding: 121 / 121
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              Kalman Filtering: Converged
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span>Active Model Weight Checksum:</span>
            <span className="font-telemetry-sm text-on-surface bg-surface-container-high px-1.5 py-0.5 rounded border border-[#1a261d] font-mono">
              0x8F9A-41C2
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
