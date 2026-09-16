// pages/HistoryPage.jsx — Historical Environmental Telemetry & Data Export

import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

export default function HistoryPage() {
  const history = useStore((s) => s.history)
  const nodes = useStore((s) => s.nodes)

  const [sensorFilter, setSensorFilter] = useState('All')
  const [paramFilter, setParamFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filteredHistory = useMemo(() => {
    return history.filter((row) => {
      if (sensorFilter !== 'All' && !row.sensor.includes(sensorFilter)) return false
      if (statusFilter !== 'All' && row.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      if (search && !JSON.stringify(row).toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [history, sensorFilter, statusFilter, search])

  // Functional CSV Export
  const handleExportCSV = () => {
    const headers = ['Time', 'Date', 'Sensor', 'Location', 'Temperature(C)', 'AQI', 'WaterLevel', 'Status', 'AlertType']
    const csvRows = [headers.join(',')]

    filteredHistory.forEach((row) => {
      const values = [
        row.time,
        row.date,
        `"${row.sensor}"`,
        `"${row.location}"`,
        row.temperature,
        row.aqi,
        `"${row.water_level}"`,
        row.status,
        `"${row.alert_type}"`,
      ]
      csvRows.push(values.join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ecomonitor-sensor-history-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Functional Print / PDF Report
  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-[#141A16] text-[#EDEDE9] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1F2921] border border-[#2D3B2F] p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <h1 className="text-2xl font-bold text-[#EDEDE9]">
              Sensor Reading <span className="text-[#D97706]">History</span>
            </h1>
          </div>
          <p className="text-xs text-[#6B7280] font-mono mt-1">
            Query time-series sensor logs, environmental incidents, and download reports
          </p>
        </div>

        {/* Action buttons: Export CSV & PDF */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="text-xs bg-[#14532D] hover:bg-[#0B3820] text-[#EDEDE9] hover:text-[#D97706] font-bold px-3.5 py-2 rounded-lg border border-[#2D3B2F] transition-colors font-mono flex items-center gap-1.5 shadow-sm"
          >
            <span>📥</span> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="text-xs bg-[#0B3820] hover:bg-[#14532D] text-[#D97706] font-bold px-3.5 py-2 rounded-lg border border-[#D97706]/40 transition-colors font-mono flex items-center gap-1.5 shadow-sm"
          >
            <span>🖨️</span> Export PDF / Print
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl p-4 shadow-sm font-mono text-xs space-y-3">
        <div className="text-[#D97706] font-bold uppercase tracking-wider text-[11px]">
          Filter Telemetry Logs
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Sensor Filter */}
          <div>
            <label className="text-[#6B7280] block mb-1">Sensor</label>
            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-2 text-[#EDEDE9] focus:outline-none focus:border-[#D97706]"
            >
              <option value="All">All Sensors</option>
              <option value="S-001">S-001 (Air Sentinel)</option>
              <option value="S-002">S-002 (Water Sentinel)</option>
              <option value="S-003">S-003 (Forest Sentinel)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[#6B7280] block mb-1">Status / Severity</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-2 text-[#EDEDE9] focus:outline-none focus:border-[#D97706]"
            >
              <option value="All">All Statuses</option>
              <option value="Normal">Normal 🟢</option>
              <option value="Warning">Warning 🟡</option>
              <option value="Critical">Critical 🔴</option>
            </select>
          </div>

          {/* Search Keyword */}
          <div className="sm:col-span-2">
            <label className="text-[#6B7280] block mb-1">Search Parameters / Location</label>
            <input
              type="text"
              placeholder="Search by zone, time, or hazard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141A16] border border-[#2D3B2F] rounded-lg p-2 text-[#EDEDE9] placeholder-[#6B7280] focus:outline-none focus:border-[#D97706]"
            />
          </div>
        </div>
      </div>

      {/* History Table per user specification */}
      <div className="bg-[#1F2921] border border-[#2D3B2F] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#141A16] text-[#6B7280] border-b border-[#2D3B2F]">
              <tr>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Sensor</th>
                <th className="p-3.5">Temperature</th>
                <th className="p-3.5">AQI</th>
                <th className="p-3.5">Water Level</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Alert Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3B2F]/60">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-[#141A16]/50 transition-colors">
                  <td className="p-3.5 text-[#EDEDE9] font-bold">{row.time}</td>
                  <td className="p-3.5 text-[#6B7280]">{row.date}</td>
                  <td className="p-3.5 font-medium text-[#EDEDE9]">{row.sensor}</td>
                  <td className="p-3.5 text-[#D97706] font-bold">{row.temperature}°C</td>
                  <td className="p-3.5 text-[#8B5CF6] font-bold">{row.aqi}</td>
                  <td className="p-3.5 text-[#0D9488] font-bold">{row.water_level}</td>
                  <td className="p-3.5">
                    <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded uppercase', {
                      'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40': row.status === 'Normal',
                      'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40': row.status === 'Warning',
                      'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40': row.status === 'Critical',
                    })}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#6B7280]">{row.alert_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
