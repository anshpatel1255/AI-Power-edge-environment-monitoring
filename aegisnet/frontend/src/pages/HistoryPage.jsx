// pages/HistoryPage.jsx — Archival Telemetry & Immutable Logstore matching Photo 4

import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

export default function HistoryPage() {
  const [dateRange, setDateRange] = useState('Last 24 Hours [Oct 24 - Oct 25]')
  const [selectedSensor, setSelectedSensor] = useState('ALL SENSORS [148 Nodes]')
  const [selectedVector, setSelectedVector] = useState('ALL PARAMETERS [6 Active]')
  const [granularity, setGranularity] = useState('1M RAW')
  const [alertFilter, setAlertFilter] = useState('ALL SEVERITIES')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [logs] = useState([
    {
      timestamp: '2024-10-25 14:32:10 UTC',
      node: 'S-014 Catchment Zone 3',
      temp: '27.4',
      aqi: '62',
      waterLevel: '2.84',
      hazard: 'SURGE +42 cm/hr (Crit Threshold: 2.5m)',
      link: '98% / 4G-Mesh',
      status: 'CRITICAL',
      statusBadge: 'bg-error-container text-error border border-error/20 font-bold',
    },
    {
      timestamp: '2024-10-25 14:15:00 UTC',
      node: 'S-014 Catchment Zone 3',
      temp: '27.6',
      aqi: '58',
      waterLevel: '2.62',
      hazard: 'SURGE +38 cm/hr',
      link: '98% / 4G-Mesh',
      status: 'WARNING',
      statusBadge: 'bg-secondary-container text-secondary border border-secondary/20 font-bold',
    },
    {
      timestamp: '2024-10-25 14:00:22 UTC',
      node: 'S-007 Canopy Ridge East',
      temp: '31.2',
      aqi: '186',
      waterLevel: '0.40',
      hazard: 'PM2.5 120.4 µg/m³ (Smoke Detected)',
      link: '92% / LoRa-Hop',
      status: 'CRITICAL',
      statusBadge: 'bg-error-container text-error border border-error/20 font-bold',
    },
    {
      timestamp: '2024-10-25 13:45:11 UTC',
      node: 'S-007 Canopy Ridge East',
      temp: '29.8',
      aqi: '95',
      waterLevel: '0.40',
      hazard: 'PM2.5 48.1 µg/m³',
      link: '93% / LoRa-Hop',
      status: 'WARNING',
      statusBadge: 'bg-secondary-container text-secondary border border-secondary/20 font-bold',
    },
    {
      timestamp: '2024-10-25 13:30:00 UTC',
      node: 'S-014 Catchment Zone 3',
      temp: '28.0',
      aqi: '54',
      waterLevel: '1.78',
      hazard: 'Hydro Rise +12 cm/hr',
      link: '99% / 4G-Mesh',
      status: 'NORMAL',
      statusBadge: 'bg-primary-container text-primary border border-primary/20',
    },
    {
      timestamp: '2024-10-25 13:15:45 UTC',
      node: 'S-001 Headwaters Base Station',
      temp: '24.3',
      aqi: '32',
      waterLevel: '1.15',
      hazard: 'Steady State <0.01m delta',
      link: '100% / Fiber Link',
      status: 'NORMAL',
      statusBadge: 'bg-primary-container text-primary border border-primary/20',
    },
    {
      timestamp: '2024-10-25 13:00:00 UTC',
      node: 'S-014 Catchment Zone 3',
      temp: '28.2',
      aqi: '51',
      waterLevel: '1.22',
      hazard: 'Hydrologic Calm',
      link: '99% / 4G-Mesh',
      status: 'NORMAL',
      statusBadge: 'bg-primary-container text-primary border border-primary/20',
    },
    {
      timestamp: '2024-10-25 12:45:00 UTC',
      node: 'S-022 Wetland Perimeter South',
      temp: '25.9',
      aqi: '44',
      waterLevel: '0.88',
      hazard: 'Normal Tidal Influx',
      link: '84% / Solar LoRa',
      status: 'NORMAL',
      statusBadge: 'bg-primary-container text-primary border border-primary/20',
    },
    {
      timestamp: '2024-10-25 12:30:19 UTC',
      node: 'S-041 Timberline North',
      temp: '--',
      aqi: '--',
      waterLevel: '--',
      hazard: 'HEARTBEAT TIMEOUT [Mesh drop]',
      link: '12% / LOST SYN',
      status: 'OFFLINE',
      statusBadge: 'bg-surface-container-highest text-outline border border-[#1a261d]',
    },
  ])

  const filteredLogs = logs.filter(
    (item) =>
      item.node.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hazard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExportCSV = () => {
    const headers = 'Timestamp,Node,Temp,AQI,WaterLevel,Hazard,Link,Status\n'
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.timestamp}","${l.node}","${l.temp}","${l.aqi}","${l.waterLevel}","${l.hazard}","${l.link}","${l.status}"`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telemetry_export_${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg select-none">
      {/* 1. Header Bar: Archival Stream Retaining Seal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-low px-space-md py-2 rounded-xl border border-[#1a261d]">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
          <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm">
            <span className="font-semibold text-on-surface">ARCHIVAL TELEMETRY/AUDIT_LOG_STREAM</span>
            <span className="text-outline">:: SERIES-V2 IMMUTABLE LOGSTORE</span>
          </div>
        </div>
        <div className="flex items-center gap-space-md text-outline font-telemetry-sm text-telemetry-sm">
          <span>INDEX SYNC: 14:32:10 UTC</span>
          <span className="text-primary font-bold">24.8 GB DISK ALLOC</span>
        </div>
      </div>

      {/* 2. Four Metric Ribbon Cards (Photo 4 Top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Card 1 */}
        <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-[#1a261d]">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Active Stream Window</span>
            <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">14,820</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">frames logged</span>
          </div>
          <div className="mt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-outline border-t border-[#1a261d] pt-1.5">
            <span>Target Coverage</span>
            <span className="text-primary font-bold">99.98% valid</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-[#1a261d]">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Hydrological Peak Flag</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">water_drop</span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">2.84m</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">S-014 ZONE 3</span>
          </div>
          <div className="mt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-outline border-t border-[#1a261d] pt-1.5">
            <span>Surge delta rate</span>
            <span className="text-secondary font-bold">+42 cm/hr</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-[#1a261d]">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Air Index Max Variance</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">air</span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">186 AQI</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">S-007</span>
          </div>
          <div className="mt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-outline border-t border-[#1a261d] pt-1.5">
            <span>Particulate PM2.5</span>
            <span className="text-secondary font-bold">120.4 µg/m³</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-[#1a261d]">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Discrepancy Ingestion</span>
            <span className="material-symbols-outlined text-[18px] text-error">security</span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-telemetry-lg text-telemetry-lg text-error font-bold">14</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">anomalies quarantined</span>
          </div>
          <div className="mt-space-xs flex items-center justify-between font-telemetry-sm text-telemetry-sm text-outline border-t border-[#1a261d] pt-1.5">
            <span>Cryptographic Hash</span>
            <span className="text-primary font-bold">SHA-256 MATCH</span>
          </div>
        </div>
      </div>

      {/* 3. Telemetry Query Configuration Matrix (Filter Dock) */}
      <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm shadow-sm border border-[#1a261d]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-[#1a261d] pb-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
            <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-bold">
              Telemetry Query Configuration
            </span>
            <span className="text-outline font-telemetry-sm text-telemetry-sm">[QUERY-BUFFER #40291]</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-primary font-telemetry-sm text-telemetry-sm font-semibold flex items-center gap-1 border border-primary/20 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              EXPORT CSV STREAM
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-telemetry-sm text-telemetry-sm flex items-center gap-1 border border-[#1a261d] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              AUDIT REPORT (PDF)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm pt-1">
          {/* Dropdown 1 */}
          <div className="flex flex-col">
            <label className="font-label-caps text-label-caps text-outline uppercase mb-1">Sensor Deployment</label>
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="bg-surface-container-lowest border border-[#1a261d] rounded px-2.5 py-1.5 text-on-surface font-telemetry-sm text-telemetry-sm focus:outline-none focus:border-primary"
            >
              <option value="ALL SENSORS [148 Nodes]">ALL SENSORS [148 Nodes]</option>
              <option value="Zone 1 North Ridge">Zone 1 North Ridge (S-001)</option>
              <option value="Catchment Zone 3">Catchment Zone 3 (S-014)</option>
              <option value="Industrial Sector 4">Industrial Sector 4 (S-007)</option>
              <option value="Pine Valley Buffer">Pine Valley Buffer (S-022)</option>
            </select>
          </div>

          {/* Dropdown 2 */}
          <div className="flex flex-col">
            <label className="font-label-caps text-label-caps text-outline uppercase mb-1">Parameter Vector</label>
            <select
              value={selectedVector}
              onChange={(e) => setSelectedVector(e.target.value)}
              className="bg-surface-container-lowest border border-[#1a261d] rounded px-2.5 py-1.5 text-on-surface font-telemetry-sm text-telemetry-sm focus:outline-none focus:border-primary"
            >
              <option value="ALL PARAMETERS [6 Active]">ALL PARAMETERS [6 Active]</option>
              <option value="Water Level (m)">Water Level (m)</option>
              <option value="Air Quality (AQI)">Air Quality (AQI)</option>
              <option value="Temperature (°C)">Temperature (°C)</option>
              <option value="Fire / Thermal VOC">Fire / Thermal VOC</option>
            </select>
          </div>

          {/* Dropdown 3 */}
          <div className="flex flex-col">
            <label className="font-label-caps text-label-caps text-outline uppercase mb-1">Date Range UTC</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-surface-container-lowest border border-[#1a261d] rounded px-2.5 py-1.5 text-on-surface font-telemetry-sm text-telemetry-sm focus:outline-none focus:border-primary"
            >
              <option value="Last 24 Hours [Oct 24 - Oct 25]">Last 24 Hours [Oct 24 - Oct 25]</option>
              <option value="Last 6 Hours">Last 6 Hours (High Res)</option>
              <option value="Last 7 Days">Last 7 Days (Consolidated)</option>
              <option value="Custom Window">Custom Archival Window</option>
            </select>
          </div>

          {/* Dropdown 4 */}
          <div className="flex flex-col">
            <label className="font-label-caps text-label-caps text-outline uppercase mb-1">Temporal Granularity</label>
            <div className="flex items-center gap-1 bg-surface-container-lowest border border-[#1a261d] rounded p-0.5">
              {['1M RAW', '15M', '1H', 'DAY AVG'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={clsx(
                    'flex-1 py-1 rounded font-label-caps text-label-caps text-center transition-all',
                    granularity === g
                      ? 'bg-primary-container text-primary font-bold shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown 5 */}
          <div className="flex flex-col">
            <label className="font-label-caps text-label-caps text-outline uppercase mb-1">Alert Filter</label>
            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value)}
              className="bg-surface-container-lowest border border-[#1a261d] rounded px-2.5 py-1.5 text-on-surface font-telemetry-sm text-telemetry-sm focus:outline-none focus:border-primary"
            >
              <option value="ALL SEVERITIES">ALL SEVERITIES</option>
              <option value="CRITICAL ONLY">CRITICAL BREACH ONLY</option>
              <option value="WARNING">WARNING & ADVISORY</option>
              <option value="NORMAL">NORMAL / NOMINAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Streaming Telemetry Logs Table (Photo 4 Main) */}
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm border border-[#1a261d]">
        <div className="bg-surface-container-lowest px-space-md py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-[#1a261d]">
          <div className="flex items-center gap-space-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-caps text-label-caps text-on-surface font-bold uppercase tracking-wider">
              Streaming Telemetry Logs
            </span>
            <span className="text-outline font-telemetry-sm text-telemetry-sm">
              DISPLAYING EPOCH: 2024-10-25 13:45:00 UTC - 14:32:10 UTC
            </span>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-outline text-[16px]">search</span>
            <input
              type="text"
              placeholder="Regex / Node hash filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-surface-container border border-[#1a261d] rounded text-telemetry-sm text-on-surface focus:outline-none focus:border-primary w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-outline font-label-caps uppercase border-b border-[#1a261d]">
                <th className="py-2.5 px-space-sm">Timestamp (UTC)</th>
                <th className="py-2.5 px-space-sm">Sensor Node &amp; Zone</th>
                <th className="py-2.5 px-space-sm">Temp (°C)</th>
                <th className="py-2.5 px-space-sm">Air Quality (AQI)</th>
                <th className="py-2.5 px-space-sm">Water Level (m)</th>
                <th className="py-2.5 px-space-sm">Hazard Metric &amp; Rate</th>
                <th className="py-2.5 px-space-sm">Link / Battery</th>
                <th className="py-2.5 px-space-sm">Status</th>
                <th className="py-2.5 px-space-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a261d]/60">
              {filteredLogs.map((row, idx) => (
                <tr
                  key={idx}
                  className={clsx(
                    'hover:bg-surface-container-high/60 transition-colors',
                    row.status === 'CRITICAL' && 'bg-error-container/15'
                  )}
                >
                  <td className="py-2.5 px-space-sm font-telemetry-sm text-telemetry-sm text-on-surface">
                    {row.timestamp}
                  </td>
                  <td className="py-2.5 px-space-sm font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">
                    {row.node}
                  </td>
                  <td className="py-2.5 px-space-sm font-telemetry-sm text-telemetry-sm text-on-surface">
                    {row.temp}
                  </td>
                  <td className="py-2.5 px-space-sm font-telemetry-sm text-telemetry-sm">
                    <span className={clsx(
                      row.aqi > 100 ? 'text-secondary font-bold' : 'text-on-surface'
                    )}>
                      {row.aqi}
                    </span>
                  </td>
                  <td className="py-2.5 px-space-sm font-telemetry-sm text-telemetry-sm font-bold">
                    <span className={clsx(
                      parseFloat(row.waterLevel) > 2.0 ? 'text-error' : 'text-on-surface'
                    )}>
                      {row.waterLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-space-sm font-telemetry-sm text-telemetry-sm">
                    <span className={clsx(
                      row.status === 'CRITICAL' ? 'text-error font-semibold' :
                      row.status === 'WARNING' ? 'text-secondary font-semibold' : 'text-on-surface-variant'
                    )}>
                      {row.hazard}
                    </span>
                  </td>
                  <td className="py-2.5 px-space-sm font-telemetry-sm text-telemetry-sm text-outline">
                    {row.link}
                  </td>
                  <td className="py-2.5 px-space-sm">
                    <span className={clsx('px-2 py-0.5 rounded font-label-caps text-label-caps', row.statusBadge)}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-space-sm text-right font-telemetry-sm text-telemetry-sm text-outline">
                    <button className="hover:text-primary transition-colors p-1" title="Payload">
                      &lt;&gt;
                    </button>
                    <button className="hover:text-secondary transition-colors p-1" title="Flag">
                      🚩
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Aggregate Summary Footer Ribbon */}
        <div className="bg-surface-container-lowest px-space-md py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm border-t border-[#1a261d] font-telemetry-sm text-telemetry-sm">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-caps text-label-caps text-outline uppercase font-bold">Aggregate Query Summary</span>
            <span className="text-outline">Consolidated window metrics (24h Rolling Filter)</span>
          </div>

          <div className="flex flex-wrap items-center gap-space-md">
            <div>
              <span className="text-outline">AVG TEMP: </span>
              <strong className="text-on-surface">28.6°C</strong>
            </div>
            <div>
              <span className="text-outline">MAX WATER LEVEL: </span>
              <strong className="text-error">2.84m (S-014)</strong>
            </div>
            <div>
              <span className="text-outline">AVG AQI INDEX: </span>
              <strong className="text-secondary">84 AQI</strong>
            </div>
            <div>
              <span className="text-outline">ANOMALIES RECORDED: </span>
              <strong className="text-error">14 Events !</strong>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="bg-surface-container px-space-md py-2 flex items-center justify-between text-outline font-telemetry-sm text-telemetry-sm border-t border-[#1a261d]">
          <span>Showing 1 - 9 of 14,820 readings across 148 active sensors</span>
          <div className="flex items-center gap-2">
            <button className="hover:text-on-surface">FIRST</button>
            <button className="hover:text-on-surface">&lt;</button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={clsx(
                  'w-6 h-6 rounded flex items-center justify-center font-bold',
                  currentPage === p ? 'bg-primary text-black' : 'hover:bg-surface-container-high text-outline'
                )}
              >
                {p}
              </button>
            ))}
            <span>...</span>
            <button className="hover:text-on-surface">593</button>
            <button className="hover:text-on-surface">&gt;</button>
            <button className="hover:text-on-surface">LAST</button>
          </div>
        </div>
      </div>
    </div>
  )
}
