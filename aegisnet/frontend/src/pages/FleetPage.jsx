// pages/FleetPage.jsx — Node Fleet Management & Hardware Provisioning Wizard
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore, SENSOR_CATEGORIES, REGIONS } from '../store/useStore'
import clsx from 'clsx'

export default function FleetPage() {
  const nodes = useStore((s) => s.nodes)
  const addNode = useStore((s) => s.addNode)
  const muteNode = useStore((s) => s.muteNode)
  const addAuditLog = useStore((s) => s.addAuditLog)

  const [search, setSearch] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [bulkOtaSuccess, setBulkOtaSuccess] = useState(false)

  // Add Node Modal Form State
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeRegion, setNewNodeRegion] = useState('gandhinagar')
  const [newNodeCategory, setNewNodeCategory] = useState('flood')
  const [newNodeLocation, setNewNodeLocation] = useState('')
  const [newNodeLat, setNewNodeLat] = useState('23.2385')
  const [newNodeLng, setNewNodeLng] = useState('72.6710')
  const [newNodeConn, setNewNodeConn] = useState('WiFi 6 + LoRa Mesh')

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (filterRegion !== 'all' && n.region !== filterRegion) return false
      if (filterStatus !== 'all' && n.status !== filterStatus) return false
      if (search && !JSON.stringify(n).toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [nodes, filterRegion, filterStatus, search])

  // Fleet health calculations
  const totalNodes = nodes.length
  const onlineCount = nodes.filter((n) => n.status === 'online').length
  const degradedCount = nodes.filter((n) => n.status === 'degraded' || n.status === 'muted').length
  const offlineCount = totalNodes - onlineCount - degradedCount
  const avgBattery = Math.round(nodes.reduce((acc, n) => acc + (n.battery_pct || 80), 0) / totalNodes)

  const handleAddNodeSubmit = (e) => {
    e.preventDefault()
    addNode({
      name: newNodeName || `Sentinel Node (${newNodeLocation || 'Gujarat'})`,
      region: newNodeRegion,
      category: newNodeCategory,
      sensor_type: SENSOR_CATEGORIES.find((c) => c.id === newNodeCategory)?.name || 'Multi-Sensor',
      location: newNodeLocation || 'Custom Deployment Site',
      latitude: parseFloat(newNodeLat) || 23.0,
      longitude: parseFloat(newNodeLng) || 72.5,
      connectivity: newNodeConn,
      battery_pct: 100,
    })
    setShowAddModal(false)
    setNewNodeName('')
    setNewNodeLocation('')
  }

  const handleBulkOTA = () => {
    setBulkOtaSuccess(true)
    addAuditLog('Simulated OTA Push', 'System Admin', `Broadcasted firmware v2.4.2-edge to ${nodes.length} nodes`)
    setTimeout(() => setBulkOtaSuccess(false), 3000)
  }

  const handleExportCSV = () => {
    const headers = ['NodeID', 'Name', 'Region', 'Category', 'Location', 'Latitude', 'Longitude', 'Battery', 'Status', 'Firmware']
    const rows = filteredNodes.map((n) => [
      n.node_id,
      `"${n.name}"`,
      n.region,
      n.category,
      `"${n.location}"`,
      n.latitude,
      n.longitude,
      n.battery_pct,
      n.status,
      n.firmware_version,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `aegisnet-fleet-inventory-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">
      {/* ─── 1. Header Strip ─────────────────────────────────────────────── */}
      <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#E8F5E9] text-[#0B6E4F] flex items-center justify-center text-2xl font-bold">
            🛰️
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Hardware Fleet & <span className="text-[#0B6E4F]">Provisioning</span>
            </h1>
            <p className="text-xs text-[#475569] font-mono">
              Qualcomm Edge-AI Sentinel Grid • Gujarat State Deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0B6E4F] hover:bg-[#08573F] text-white text-xs font-bold font-mono px-3.5 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>+</span> Provision New Node
          </button>
          <button
            onClick={handleBulkOTA}
            className="bg-white hover:bg-[#F7F9FB] border border-[#CBD5E1] text-[#0F172A] text-xs font-bold font-mono px-3 py-2 rounded-xl transition-colors shadow-xs"
          >
            {bulkOtaSuccess ? '✓ OTA Deployed' : 'OTA Firmware Push'}
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-[#F7F9FB] border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] text-xs font-mono px-3 py-2 rounded-xl transition-colors shadow-xs"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ─── 2. Fleet Health KPI Strip ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-[#475569] font-mono">Total Deployed</div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">{totalNodes}</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-[#2E7D32] font-mono">Online Primary</div>
          <div className="text-2xl font-bold text-[#2E7D32] font-mono">{onlineCount}</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-[#B58900] font-mono">LoRa Mesh Fallback</div>
          <div className="text-2xl font-bold text-[#B58900] font-mono">{degradedCount}</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-[#94A3B8] font-mono">Offline / Maintenance</div>
          <div className="text-2xl font-bold text-[#475569] font-mono">{offlineCount}</div>
        </div>
        <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] text-[#0B84C9] font-mono">Fleet Avg Battery</div>
          <div className="text-2xl font-bold text-[#0B84C9] font-mono">{avgBattery}%</div>
        </div>
      </div>

      {/* ─── 3. Filter Bar ──────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E3E8EF] rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Region filter */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] font-mono"
          >
            <option value="all">All Regions</option>
            {REGIONS.filter((r) => r.id !== 'all').map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#0F172A] font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="degraded">Degraded</option>
            <option value="muted">Muted</option>
          </select>
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by node ID, location, or firmware..."
          className="w-full md:w-64 bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0B6E4F]"
        />
      </div>

      {/* ─── 4. Fleet Data Grid ─────────────────────────────────────────── */}
      <div className="bg-white border border-[#E3E8EF] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F7F9FB] text-[#475569] font-mono uppercase text-[10px] border-b border-[#E3E8EF]">
              <tr>
                <th className="p-3">Node ID</th>
                <th className="p-3">Category & Sensor</th>
                <th className="p-3">Location & Landmark</th>
                <th className="p-3">Connectivity</th>
                <th className="p-3">Battery / Power</th>
                <th className="p-3">Firmware</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8EF]">
              {filteredNodes.map((node) => {
                const isOnline = node.status === 'online'
                const isMuted = node.status === 'muted'

                return (
                  <tr key={node.node_id} className="hover:bg-[#F7F9FB] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0F172A]">
                      <Link to={`/nodes/${node.node_id}`} className="hover:text-[#0B6E4F] underline">
                        {node.node_id}
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-[#0F172A]">{node.sensor_type}</div>
                      <div className="text-[10px] text-[#475569] font-mono uppercase">{node.category}</div>
                    </td>
                    <td className="p-3 truncate max-w-xs text-[#475569]">
                      <div className="text-[#0F172A] font-medium">{node.location}</div>
                      <div className="text-[10px] font-mono text-[#94A3B8]">
                        {node.latitude.toFixed(4)}°N, {node.longitude.toFixed(4)}°E
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#0F172A]">
                      {node.connectivity}
                    </td>
                    <td className="p-3 font-mono">
                      <span className={clsx(node.battery_pct < 40 ? 'text-[#C62828] font-bold' : 'text-[#2E7D32]')}>
                        {node.battery_pct}%
                      </span>
                      <span className="text-[10px] text-[#475569] ml-1">
                        {node.solar_charging ? '☀️ Solar' : '🔋 Li-Ion'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#475569]">
                      {node.firmware_version}
                    </td>
                    <td className="p-3">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold inline-block',
                          isMuted
                            ? 'bg-[#EEF2F6] text-[#475569]'
                            : isOnline
                            ? 'bg-[#E8F5E9] text-[#2E7D32]'
                            : 'bg-[#FDECEC] text-[#C62828]'
                        )}
                      >
                        {isMuted ? 'Muted' : isOnline ? 'Online' : 'Degraded'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => muteNode(node.node_id)}
                          className="text-[11px] text-[#475569] hover:text-[#0F172A] underline font-mono"
                        >
                          {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                        <Link
                          to={`/nodes/${node.node_id}`}
                          className="text-[11px] text-[#0B6E4F] hover:underline font-mono font-bold"
                        >
                          Telemetry →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Node Provisioning Modal ─────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3E8EF] pb-3">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <span>🛰️</span> Provision Qualcomm Edge-AI Node
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#475569]">✕</button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[#475569] font-mono block mb-1 font-bold">Node Display Name</label>
                <input
                  type="text"
                  required
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="e.g. Sabarmati Vasna Barrage Sensor"
                  className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#475569] font-mono block mb-1 font-bold">Gujarat Region</label>
                  <select
                    value={newNodeRegion}
                    onChange={(e) => setNewNodeRegion(e.target.value)}
                    className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
                  >
                    {REGIONS.filter((r) => r.id !== 'all').map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#475569] font-mono block mb-1 font-bold">Sensor Bay Category</label>
                  <select
                    value={newNodeCategory}
                    onChange={(e) => setNewNodeCategory(e.target.value)}
                    className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
                  >
                    {SENSOR_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#475569] font-mono block mb-1 font-bold">Location Description / Landmark</label>
                <input
                  type="text"
                  required
                  value={newNodeLocation}
                  onChange={(e) => setNewNodeLocation(e.target.value)}
                  placeholder="e.g. Near Vasna Barrage Sluice Gate 14"
                  className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#475569] font-mono block mb-1 font-bold">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newNodeLat}
                    onChange={(e) => setNewNodeLat(e.target.value)}
                    className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="text-[#475569] font-mono block mb-1 font-bold">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newNodeLng}
                    onChange={(e) => setNewNodeLng(e.target.value)}
                    className="w-full bg-[#F7F9FB] border border-[#CBD5E1] rounded-lg p-2 text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#0B6E4F] hover:bg-[#08573F] text-white font-bold py-2 rounded-xl font-mono transition-colors shadow-xs"
                >
                  Register Node to Mesh
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 bg-[#F7F9FB] hover:bg-[#EEF2F6] text-[#475569] rounded-xl font-mono border border-[#CBD5E1]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
