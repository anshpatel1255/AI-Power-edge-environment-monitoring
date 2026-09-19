// services/webSerialService.js — Direct Browser-to-ESP32 Web Serial Communication Service
// Connects to ESP32 Gateway via USB COM port, reads streamed JSON lines from 3 sensor ESP32s,
// and dynamically dispatches parsed telemetry to the global Zustand store.

import { useStore } from '../store/useStore'

class WebSerialService {
  constructor() {
    this.port = null
    this.reader = null
    this.readableStreamClosed = null
    this.keepReading = false
    this.baudRate = 115200
    this.packetCount = 0
    this.lastPacketTime = Date.now()
    this.packetRateTimer = null
    this.packetsThisSecond = 0
    this.simInterval = null
    this.isSimulating = false
    this.lastActiveNodeId = null
    this.initNodeBuffers()
  }

  initNodeBuffers() {
    this.nodeBuffers = {
      'ESP32-FLOOD': {
        node_id: 'ESP32-FLOOD',
        name: 'ESP32 Flood & Water Sentinel',
        category: 'flood',
        node_type: 'flood',
        sensor_type: 'Flood & Water Level',
        location: 'Sant Sarovar Dam, Sabarmati, Gandhinagar',
        latitude: 23.2385,
        longitude: 72.6710,
        water_level_cm: 35.4,
        soil_moisture: 42.1,
        battery_pct: 94,
        rssi: -62,
        solar_charging: true,
        risk_score: 18,
        severity: 'advisory',
        status: 'waiting',
        is_live_hw: false,
      },
      'ESP32-COTEMP': {
        node_id: 'ESP32-COTEMP',
        name: 'ESP32 Fire & CO-Thermal Sentinel',
        category: 'fire',
        node_type: 'fire',
        sensor_type: 'Fire & Thermal IR',
        location: 'Indroda Nature Park Perimeter, Gandhinagar',
        latitude: 23.1950,
        longitude: 72.6520,
        temperature_c: 29.5,
        humidity_pct: 83.2,
        gas_ppm: 1.00,
        flame_detected: false,
        battery_pct: 95,
        rssi: -65,
        solar_charging: true,
        risk_score: 22,
        severity: 'advisory',
        status: 'waiting',
        is_live_hw: false,
      },
      'ESP32-POLLUTION': {
        node_id: 'ESP32-POLLUTION',
        name: 'ESP32 Air Quality & Toxic Gas Sentinel',
        category: 'air',
        node_type: 'air',
        sensor_type: 'Air Quality (AQI)',
        location: 'Narol-Vatva GIDC Industrial Corridor, Ahmedabad',
        latitude: 22.9734,
        longitude: 72.5898,
        smoke_aqi: 73,
        pm10: 118,
        mq135_strength: 82.0,
        mq4_strength: 35.0,
        battery_pct: 92,
        rssi: -58,
        solar_charging: true,
        risk_score: 75,
        severity: 'warning',
        status: 'waiting',
        is_live_hw: false,
      }
    }
  }

  // Check if browser supports Web Serial API
  isSupported() {
    return typeof navigator !== 'undefined' && 'serial' in navigator
  }

  // Set baud rate (default 115200)
  setBaudRate(rate) {
    this.baudRate = Number(rate) || 115200
    useStore.getState().setUsbBaudRate(this.baudRate)
  }

  // Request port and connect
  async connect(baudRate = null) {
    if (baudRate) this.baudRate = Number(baudRate)
    const store = useStore.getState()

    if (!this.isSupported()) {
      const errorMsg = 'Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera.'
      store.addUsbLog('SYSTEM', errorMsg, 'error')
      throw new Error(errorMsg)
    }

    try {
      store.addUsbLog('SYSTEM', 'Requesting serial port picker...', 'info')
      // Prompt user to select COM port
      this.port = await navigator.serial.requestPort()
      
      const portInfo = this.port.getInfo()
      const portDesc = portInfo.usbVendorId 
        ? `VID:${portInfo.usbVendorId.toString(16).padStart(4, '0')} PID:${portInfo.usbProductId ? portInfo.usbProductId.toString(16).padStart(4, '0') : '?'}`
        : 'ESP32 USB Device'

      store.addUsbLog('SYSTEM', `Opening ${portDesc} at ${this.baudRate} baud...`, 'info')
      
      await this.port.open({ baudRate: this.baudRate })
      this.keepReading = true

      // Update store connection status
      store.setUsbConnected(true, portDesc, this.baudRate)
      store.addUsbLog('SYSTEM', `✓ Connected to ESP32 Gateway on ${portDesc} @ ${this.baudRate} baud`, 'success')

      // Start calculating packets/sec
      this.packetRateTimer = setInterval(() => {
        useStore.getState().setUsbPacketsPerSec(this.packetsThisSecond)
        this.packetsThisSecond = 0
      }, 1000)

      // Start serial reader loop
      this.readSerialStream()
      return true
    } catch (err) {
      if (err.name === 'NotFoundError') {
        store.addUsbLog('SYSTEM', 'Port selection was cancelled by user.', 'warn')
      } else {
        store.addUsbLog('SYSTEM', `Connection failed: ${err.message}`, 'error')
      }
      this.cleanup()
      throw err
    }
  }

  // Continuous stream reading with line buffer
  async readSerialStream() {
    let lineBuffer = ''
    const textDecoder = new TextDecoderStream()
    this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable)
    this.reader = textDecoder.readable.getReader()

    const store = useStore.getState()

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read()
        if (done) {
          break
        }
        if (value) {
          lineBuffer += value
          const lines = lineBuffer.split(/\r?\n/)
          // Keep whatever incomplete fragment is left in lineBuffer
          lineBuffer = lines.pop()

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed) {
              this.handleIncomingLine(trimmed)
            }
          }
        }
      }
    } catch (error) {
      if (this.keepReading) {
        store.addUsbLog('SYSTEM', `Serial read error: ${error.message}`, 'error')
      }
    } finally {
      this.disconnect()
    }
  }

  // Process a complete line received from USB serial
  handleIncomingLine(line) {
    const store = useStore.getState()
    this.packetCount++
    this.packetsThisSecond++
    store.incrementUsbPacketCount()

    // Add raw line to serial log (type: rx)
    store.addUsbLog('RX', line, 'rx')

    // 1. Try parsing as full JSON first
    let data = null
    try {
      data = JSON.parse(line)
    } catch {
      // 2. Try extracting JSON object substring if surrounded by brackets or prefixes
      const jsonMatch = line.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try { data = JSON.parse(jsonMatch[0]) } catch {}
      }
    }

    if (data && (data.node_id || data.id || data.node)) {
      this.processSensorPacket(data)
      return
    }

    // 3. Fallback: parse Key-Value or CSV format (e.g. NODE:ESP32-FLOOD,WATER:34.2,SOIL:65)
    data = this.parseKeyValueFallback(line)
    if (data && (data.node_id || data.id || data.node)) {
      this.processSensorPacket(data)
      return
    }

    // 4. Intelligent Smart Human-Readable Serial Stream Parser
    // Handles lines like:
    // "Pollution Status : !!! ALERT !!!"
    // "Dispatched Pollution Packet -> PM2.5: 85 AQI | MQ-135: 45.2 % | MQ-4: 12.0 %"
    // "Dispatched CO/Temp Packet -> CO: 1.20 ppm | Temp: 29.5 C | Flame: NO"
    // "🌡 Temperature: 29.5 °C"
    // "💧 Humidity: 83.2 %"
    // "🟢 Gas (raw): 1200 | Voltage: 0.96 V"
    // "[TX Node node_002] Water: 35.4cm (Risk: 15), Fire Risk: 20, Poll: 45 -> Alert: 0"
    this.parseHumanTextStream(line)
  }

  // Fallback parser for non-JSON serial outputs
  parseKeyValueFallback(line) {
    try {
      const result = {}
      const pairs = line.split(/[,;\t|]/)
      for (const pair of pairs) {
        const [k, v] = pair.split(/[:=]/)
        if (k && v !== undefined) {
          const key = k.trim().toLowerCase()
          const val = v.trim()
          const num = Number(val)
          result[key] = isNaN(num) ? val : num
        }
      }
      if (result.node && !result.node_id) result.node_id = result.node
      if (result.id && !result.node_id) result.node_id = result.id
      return Object.keys(result).length > 1 ? result : null
    } catch {
      return null
    }
  }

  // Parse human text prints, Arduino logs, and alert strings from ESP32 nodes
  parseHumanTextStream(line) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('===') || trimmed === 'ESP32 READY') {
      return
    }

    const lower = trimmed.toLowerCase()

    // Detect target node type from context or keywords
    const isPollution = (
      lower.includes('pollution') ||
      lower.includes('pm2.5') ||
      lower.includes('pm10') ||
      lower.includes('mq-135') ||
      lower.includes('mq135') ||
      lower.includes('mq-4') ||
      lower.includes('mq4') ||
      lower.includes('dust') ||
      lower.includes('aqi')
    )

    const isFireCo = (
      lower.includes('cotemp') ||
      lower.includes('temperature') ||
      lower.includes('temp') ||
      lower.includes('humidity') ||
      lower.includes('dht') ||
      lower.includes('mq-7') ||
      lower.includes('mq7') ||
      lower.includes('co gas') ||
      lower.includes('co:') ||
      lower.includes('flame')
    )

    const isFlood = (
      lower.includes('flood') ||
      lower.includes('water') ||
      lower.includes('soil') ||
      lower.includes('moisture') ||
      lower.includes('ultrasonic') ||
      lower.includes('hcsr04')
    )

    // Resolve target node ID
    let targetNodeId = null
    if (isPollution) {
      targetNodeId = 'ESP32-POLLUTION'
    } else if (isFireCo) {
      targetNodeId = 'ESP32-COTEMP'
    } else if (isFlood) {
      targetNodeId = 'ESP32-FLOOD'
    } else if (lower.includes('node_002')) {
      targetNodeId = 'ESP32-FLOOD'
    } else if (lower.includes('node_001') || lower.includes('node_003')) {
      targetNodeId = 'ESP32-POLLUTION'
    }

    // If no explicit node keyword, but an ALERT/DANGER keyword is detected:
    if (!targetNodeId) {
      if (lower.includes('alert') || lower.includes('danger') || lower.includes('critical')) {
        targetNodeId = this.lastActiveNodeId || 'ESP32-POLLUTION'
      } else {
        return
      }
    }

    this.lastActiveNodeId = targetNodeId

    if (!this.nodeBuffers) {
      this.initNodeBuffers()
    }

    const buf = this.nodeBuffers[targetNodeId]
    if (!buf) return

    buf.status = 'online'
    buf.is_live_hw = true
    buf.last_update = 'Just now'

    const isAlert = (
      lower.includes('alert') ||
      lower.includes('danger') ||
      lower.includes('critical') ||
      lower.includes('warning') ||
      lower.includes('high gas')
    )

    // Regex extraction
    // Temperature
    const tempMatch = trimmed.match(/(?:temp|temperature)[^\d-]*(-?\d+(?:\.\d+)?)/i)
    if (tempMatch) buf.temperature_c = parseFloat(tempMatch[1])

    // Humidity
    const humMatch = trimmed.match(/(?:humidity|hum)[^\d]*(\d+(?:\.\d+)?)/i)
    if (humMatch) buf.humidity_pct = parseFloat(humMatch[1])

    // CO Gas / MQ-7
    const coMatch = trimmed.match(/(?:co\s*(?:gas)?|mq-?7)[^\d]*(\d+(?:\.\d+)?)/i)
    if (coMatch) buf.gas_ppm = parseFloat(coMatch[1])

    // Raw Gas ADC
    const gasRawMatch = trimmed.match(/(?:gas\s*\(raw\)|gas)[^\d]*(\d+)/i)
    if (gasRawMatch) {
      const rawVal = parseInt(gasRawMatch[1])
      if (targetNodeId === 'ESP32-COTEMP') {
        buf.gas_ppm = parseFloat(((rawVal / 4095) * 15).toFixed(2))
      } else if (targetNodeId === 'ESP32-POLLUTION') {
        buf.mq135_strength = parseFloat(((rawVal / 4095) * 100).toFixed(1))
      }
    }

    // Flame sensor
    if (lower.includes('flame')) {
      if (lower.includes('yes') || lower.includes('true') || lower.includes('detected') || lower.includes('high') || lower.includes('1')) {
        buf.flame_detected = true
      } else if (lower.includes('no') || lower.includes('false') || lower.includes('clear') || lower.includes('0')) {
        buf.flame_detected = false
      }
    }

    // PM2.5 / Smoke AQI
    const pm25Match = trimmed.match(/(?:pm2\.?5|smoke_aqi|aqi|dust)[^\d]*(\d+(?:\.\d+)?)/i)
    if (pm25Match) {
      buf.smoke_aqi = Math.round(parseFloat(pm25Match[1]))
      buf.pm10 = Math.round(buf.smoke_aqi * 1.35)
    }

    // PM10
    const pm10Match = trimmed.match(/pm10[^\d]*(\d+(?:\.\d+)?)/i)
    if (pm10Match) buf.pm10 = Math.round(parseFloat(pm10Match[1]))

    // MQ-135
    const mq135Match = trimmed.match(/mq-?135[^\d]*(\d+(?:\.\d+)?)/i)
    if (mq135Match) buf.mq135_strength = parseFloat(mq135Match[1])

    // MQ-4
    const mq4Match = trimmed.match(/mq-?4[^\d]*(\d+(?:\.\d+)?)/i)
    if (mq4Match) buf.mq4_strength = parseFloat(mq4Match[1])

    // PM1.0
    const pm1Match = trimmed.match(/(?:pm1(?:\.0)?|ultrafine)[^\d]*(\d+(?:\.\d+)?)/i)
    if (pm1Match) buf.pm1 = parseFloat(pm1Match[1])
    else if (buf.smoke_aqi) buf.pm1 = Math.round(buf.smoke_aqi * 0.62)

    // Optical density / Raw OD
    const odMatch = trimmed.match(/(?:optical(?:\s*density)?|od)[^\d]*(\d+(?:\.\d+)?)/i)
    if (odMatch) buf.optical_density = parseFloat(odMatch[1])
    else if (buf.smoke_aqi) buf.optical_density = buf.smoke_aqi

    // Water level / distance
    const waterMatch = trimmed.match(/(?:water(?:\s*distance|\s*level)?)[^\d]*(\d+(?:\.\d+)?)/i)
    if (waterMatch) buf.water_level_cm = parseFloat(waterMatch[1])

    // Soil moisture
    const soilMatch = trimmed.match(/(?:soil(?:\s*moisture)?)[^\d]*(\d+(?:\.\d+)?)/i)
    if (soilMatch) buf.soil_moisture = parseFloat(soilMatch[1])

    // If explicit ALERT was flagged in text (like "Pollution Status : !!! ALERT !!!")
    if (isAlert) {
      buf.severity = 'emergency'
      buf.risk_score = 92
      if (targetNodeId === 'ESP32-POLLUTION') {
        if (!buf.smoke_aqi || buf.smoke_aqi < 80) buf.smoke_aqi = 145
        if (!buf.mq135_strength || buf.mq135_strength < 60) buf.mq135_strength = 82.0
      } else if (targetNodeId === 'ESP32-COTEMP') {
        if (!buf.gas_ppm || buf.gas_ppm < 5) buf.gas_ppm = 8.6
      } else if (targetNodeId === 'ESP32-FLOOD') {
        if (!buf.water_level_cm || buf.water_level_cm > 30) buf.water_level_cm = 24.2
      }
    } else if (trimmed.toLowerCase().includes('normal') || trimmed.toLowerCase().includes('clear')) {
      buf.severity = 'advisory'
      buf.risk_score = 22
    }

    // Process and dispatch to store
    this.processSensorPacket({ ...buf })
  }

  // Normalize incoming packet from one of the 3 ESP32 sensor nodes and update store
  processSensorPacket(raw) {
    const store = useStore.getState()
    const rawId = String(raw.node_id || raw.id || 'ESP32-NODE').toUpperCase()

    // Identify node type
    let nodeType = 'flood'
    let name = 'ESP32 Flood & Water Sentinel'
    let category = 'flood'
    let defaultLat = 23.2385
    let defaultLng = 72.6710
    let location = 'Sant Sarovar Dam, Sabarmati, Gandhinagar'

    if (rawId.includes('COTEMP') || rawId.includes('FIRE') || raw.flame_detected !== undefined || raw.gas_ppm !== undefined) {
      nodeType = 'fire'
      category = 'fire'
      name = 'ESP32 Fire & CO-Thermal Sentinel'
      defaultLat = 23.1950
      defaultLng = 72.6520
      location = 'Indroda Nature Park Perimeter, Gandhinagar'
    } else if (rawId.includes('POLLUTION') || rawId.includes('AIR') || raw.smoke_aqi !== undefined || raw.pm25 !== undefined || raw.mq135_strength !== undefined) {
      nodeType = 'air'
      category = 'air'
      name = 'ESP32 Air Quality & Toxic Gas Sentinel'
      defaultLat = 22.9734
      defaultLng = 72.5898
      location = 'Narol-Vatva GIDC Industrial Corridor, Ahmedabad'
    }

    // Extract standardized metrics
    const water_level_cm = raw.water_level_cm != null ? Number(raw.water_level_cm) : (raw.water != null ? Number(raw.water) : (raw.distance != null ? Number(raw.distance) : null))
    const soil_moisture  = raw.soil_moisture  != null ? Number(raw.soil_moisture)  : (raw.soil != null ? Number(raw.soil) : (raw.moisture != null ? Number(raw.moisture) : null))
    const temperature_c  = raw.temperature_c  != null ? Number(raw.temperature_c)  : (raw.temp != null ? Number(raw.temp) : (raw.temperature != null ? Number(raw.temperature) : null))
    const humidity_pct   = raw.humidity_pct   != null ? Number(raw.humidity_pct)   : (raw.humidity != null ? Number(raw.humidity) : (raw.hum != null ? Number(raw.hum) : null))
    const gas_ppm        = raw.gas_ppm        != null ? Number(raw.gas_ppm)        : (raw.co != null ? Number(raw.co) : (raw.mq7 != null ? Number(raw.mq7) : (raw.gas != null ? Number(raw.gas) : null)))
    const flame_detected = Boolean(raw.flame_detected || raw.flame || raw.fire)
    const smoke_aqi      = raw.smoke_aqi      != null ? Number(raw.smoke_aqi)      : (raw.pm25 != null ? Number(raw.pm25) : (raw.aqi != null ? Number(raw.aqi) : (raw.dust != null ? Number(raw.dust) : null)))
    const pm10           = raw.pm10           != null ? Number(raw.pm10)           : (smoke_aqi != null ? Math.round(smoke_aqi * 1.35) : null)
    const pm1            = raw.pm1            != null ? Number(raw.pm1)            : (raw.pm1_0 != null ? Number(raw.pm1_0) : (smoke_aqi != null ? Math.round(smoke_aqi * 0.62) : null))
    const optical_density = raw.optical_density != null ? Number(raw.optical_density) : (raw.od != null ? Number(raw.od) : smoke_aqi)
    const mq135_strength = raw.mq135_strength != null ? Number(raw.mq135_strength) : (raw.mq135 != null ? Number(raw.mq135) : (raw.toxic != null ? Number(raw.toxic) : null))
    const mq4_strength   = raw.mq4_strength   != null ? Number(raw.mq4_strength)   : (raw.mq4 != null ? Number(raw.mq4) : (raw.methane != null ? Number(raw.methane) : null))
    const battery_pct    = raw.battery_pct    != null ? Number(raw.battery_pct)    : (raw.battery != null ? Number(raw.battery) : 98)
    const rssi           = raw.rssi           != null ? Number(raw.rssi)           : -64

    // Calculate dynamic risk scores
    let riskScore = 15
    let severity = 'advisory'
    let alertTrigger = null

    if (nodeType === 'flood') {
      // Lower distance means higher water level
      if (water_level_cm != null) {
        if (water_level_cm < 30) {
          riskScore = 92
          severity = 'emergency'
          alertTrigger = `CRITICAL WATER SURGE: Level at ${water_level_cm.toFixed(1)} cm! Sabarmati basin threshold breached.`
        } else if (water_level_cm < 60) {
          riskScore = 65
          severity = 'warning'
          alertTrigger = `ELEVATED WATER LEVEL: Depth at ${water_level_cm.toFixed(1)} cm. Rising rate detected.`
        } else {
          riskScore = Math.max(10, Math.min(45, Math.round(100 - water_level_cm)))
        }
      }
      if (soil_moisture != null && soil_moisture > 85) {
        riskScore = Math.max(riskScore, 75)
        severity = riskScore >= 80 ? 'emergency' : 'warning'
      }
    } else if (nodeType === 'fire') {
      if (flame_detected) {
        riskScore = 96
        severity = 'emergency'
        alertTrigger = `ACTIVE FLAME DETECTED at ${location}! Immediate fire station dispatch recommended.`
      } else if (gas_ppm != null && gas_ppm > 8) {
        riskScore = 85
        severity = 'emergency'
        alertTrigger = `TOXIC CO SPIKE: Carbon Monoxide reading ${gas_ppm.toFixed(1)} ppm!`
      } else if (temperature_c != null && temperature_c > 42) {
        riskScore = 78
        severity = 'warning'
        alertTrigger = `THERMAL ANOMALY: Extreme ambient temperature ${temperature_c.toFixed(1)}°C.`
      } else {
        riskScore = Math.min(45, Math.round((gas_ppm || 1) * 4 + ((temperature_c || 28) - 25) * 2))
      }
    } else if (nodeType === 'air') {
      if (smoke_aqi != null && smoke_aqi > 120) {
        riskScore = 88
        severity = 'emergency'
        alertTrigger = `HAZARDOUS AIR POLLUTION: PM2.5 AQI at ${smoke_aqi}! Vatva industrial corridor health hazard.`
      } else if (smoke_aqi != null && smoke_aqi > 65) {
        riskScore = 62
        severity = 'warning'
        alertTrigger = `POOR AIR QUALITY: PM2.5 AQI at ${smoke_aqi}. Sensitive groups advised to stay indoors.`
      } else if (mq135_strength != null && mq135_strength > 60) {
        riskScore = 72
        severity = 'warning'
        alertTrigger = `CHEMICAL VAPOR DETECTED: Ammonia/VOC concentration elevated (${mq135_strength.toFixed(0)}%).`
      } else {
        riskScore = Math.min(45, Math.round((smoke_aqi || 30) * 0.4))
      }
    }

    const cleanNode = {
      node_id: rawId,
      name: raw.name || name,
      category,
      node_type: nodeType,
      sensor_type: nodeType === 'flood' ? 'Flood & Water Level' : nodeType === 'fire' ? 'Fire & Thermal IR' : 'Air Quality (AQI)',
      location,
      latitude: raw.lat || defaultLat,
      longitude: raw.lng || defaultLng,
      status: 'online',
      is_live_hw: raw.is_live_hw !== undefined ? raw.is_live_hw : true,
      connectivity: `USB Serial (ESP-NOW Mesh)`,
      battery_pct,
      rssi,
      solar_charging: true,
      water_level_cm,
      soil_moisture,
      temperature_c,
      humidity_pct,
      gas_ppm,
      flame_detected,
      smoke_aqi,
      pm10,
      pm1,
      optical_density,
      mq135_strength,
      mq135_status: (mq135_strength && mq135_strength > 40) ? 'DETECTED' : 'NORMAL',
      mq4_strength,
      mq4_status: (mq4_strength && mq4_strength > 40) ? 'DETECTED' : 'NORMAL',
      risk_score: riskScore,
      severity,
      last_update: 'Just now',
    }

    // Push into Zustand store
    store.upsertEsp32Node(cleanNode)

    // Trigger real alert if threshold exceeded
    if (alertTrigger) {
      store.addRealAlert({
        id: `USB-${Date.now()}`,
        node_id: rawId,
        hazard: category,
        risk_score: riskScore,
        message: alertTrigger,
      })
    }
  }

  // Disconnect cleanly
  async disconnect() {
    this.keepReading = false
    if (this.packetRateTimer) {
      clearInterval(this.packetRateTimer)
      this.packetRateTimer = null
    }

    try {
      if (this.reader) {
        await this.reader.cancel()
        this.reader.releaseLock()
        this.reader = null
      }
      if (this.readableStreamClosed) {
        await this.readableStreamClosed.catch(() => {})
        this.readableStreamClosed = null
      }
      if (this.port) {
        await this.port.close()
        this.port = null
      }
    } catch (e) {
      console.warn('[WebSerial] Disconnect error:', e)
    }

    this.cleanup()
  }

  cleanup() {
    this.keepReading = false
    this.port = null
    this.reader = null
    const store = useStore.getState()
    store.setUsbConnected(false, null)
    store.addUsbLog('SYSTEM', 'Serial port closed / disconnected.', 'info')
  }

  // ─── Test Packet Stream Simulator ──────────────────────────────────────────
  // Simulates realistic continuous ESP32 packets from all 3 sensor nodes
  startSimulator(intervalMs = 1500) {
    if (this.isSimulating) return
    this.isSimulating = true
    const store = useStore.getState()
    store.setUsbConnected(true, 'SIMULATOR (Virtual COM3)', 115200)
    store.addUsbLog('SYSTEM', '▶ ESP32 Multi-Sensor Packet Simulator STARTED', 'success')

    let cycle = 0
    this.simInterval = setInterval(() => {
      cycle++
      
      // Node 1: Flood
      const floodDistance = Math.max(18, Math.min(85, 48 + Math.sin(cycle * 0.4) * 22 + (Math.random() * 4 - 2)))
      const soilMoist = Math.min(95, 60 + Math.sin(cycle * 0.3) * 25)
      const floodPacket = {
        node_id: 'ESP32-FLOOD',
        water_level_cm: parseFloat(floodDistance.toFixed(1)),
        soil_moisture: parseFloat(soilMoist.toFixed(1)),
        battery_pct: 96,
        rssi: -58,
      }
      this.handleIncomingLine(JSON.stringify(floodPacket))

      // Node 2: CO & Temp
      const temp = 28.5 + Math.sin(cycle * 0.2) * 6 + (Math.random() * 1.5)
      const coPpm = Math.max(1.2, 3.4 + Math.sin(cycle * 0.5) * 3.5)
      const firePacket = {
        node_id: 'ESP32-COTEMP',
        temperature_c: parseFloat(temp.toFixed(1)),
        humidity_pct: parseFloat((55 + Math.cos(cycle * 0.3) * 15).toFixed(1)),
        gas_ppm: parseFloat(coPpm.toFixed(2)),
        flame_detected: cycle % 12 === 0,
        battery_pct: 94,
        rssi: -64,
      }
      setTimeout(() => {
        if (this.isSimulating) this.handleIncomingLine(JSON.stringify(firePacket))
      }, 400)

      // Node 3: Pollution
      const aqi = Math.max(25, Math.min(135, Math.round(45 + Math.sin(cycle * 0.35) * 40 + Math.random() * 10)))
      const pollutionPacket = {
        node_id: 'ESP32-POLLUTION',
        smoke_aqi: aqi,
        pm10: Math.round(aqi * 1.3),
        mq135_strength: parseFloat((25 + Math.sin(cycle * 0.4) * 22).toFixed(1)),
        mq4_strength: parseFloat((12 + Math.cos(cycle * 0.25) * 10).toFixed(1)),
        battery_pct: 92,
        rssi: -71,
      }
      setTimeout(() => {
        if (this.isSimulating) this.handleIncomingLine(JSON.stringify(pollutionPacket))
      }, 800)

    }, intervalMs)
  }

  stopSimulator() {
    if (!this.isSimulating) return
    this.isSimulating = false
    if (this.simInterval) {
      clearInterval(this.simInterval)
      this.simInterval = null
    }
    const store = useStore.getState()
    store.setUsbConnected(false, null)
    store.addUsbLog('SYSTEM', '■ ESP32 Packet Simulator STOPPED', 'info')
  }

  // Auto-fill any sensor nodes not physically connected so all screens are fully functional
  fillMissingNodes() {
    const store = useStore.getState()
    const esp32Nodes = store.esp32Nodes
    const hasFlood = esp32Nodes.some((n) => n.node_id?.includes('FLOOD'))
    const hasCotemp = esp32Nodes.some((n) => n.node_id?.includes('COTEMP'))
    const hasPollution = esp32Nodes.some((n) => n.node_id?.includes('POLLUTION'))

    if (!hasFlood) {
      this.processSensorPacket({
        ...this.nodeBuffers['ESP32-FLOOD'],
        is_live_hw: false,
        status: 'online',
        water_level_cm: 35.4,
        soil_moisture: 42.1,
      })
    }
    if (!hasCotemp) {
      this.processSensorPacket({
        ...this.nodeBuffers['ESP32-COTEMP'],
        is_live_hw: false,
        status: 'online',
        temperature_c: 29.5,
        humidity_pct: 83.2,
        gas_ppm: 1.00,
        flame_detected: false,
      })
    }
    if (!hasPollution) {
      this.processSensorPacket({
        ...this.nodeBuffers['ESP32-POLLUTION'],
        is_live_hw: false,
        status: 'online',
        smoke_aqi: 73,
        pm10: 118,
        mq135_strength: 82.0,
        mq4_strength: 35.0,
      })
    }
    store.addUsbLog('SYSTEM', '✓ Synced 3-node telemetry view for complete display', 'success')
  }

  // ─── Automatic Background COM7 Bridge Listener ────────────────────────────
  // Connects to local Python/Node serial bridge at http://localhost:4001/api/stream
  startBridgeListener() {
    if (typeof window === 'undefined') return
    try {
      const eventSource = new EventSource('http://localhost:4001/api/stream')

      eventSource.onopen = () => {
        const store = useStore.getState()
        store.setUsbConnected(true, 'COM7 (Hardware Bridge)', 115200)
        store.addUsbLog('BRIDGE', '✓ Connected to local COM7 Bridge server on port 4001', 'success')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data && (data.node_id || data.id)) {
            this.packetCount++
            this.packetsThisSecond++
            useStore.getState().incrementUsbPacketCount()
            useStore.getState().addUsbLog('COM7', JSON.stringify(data), 'rx')
            this.processSensorPacket(data)
          }
        } catch {
          // ignore
        }
      }

      eventSource.onerror = () => {
        // Bridge may not be started yet — will retry silently in background
      }
    } catch {
      // ignore
    }
  }
}

export const webSerialService = new WebSerialService()

// Auto-start bridge listener in browser
if (typeof window !== 'undefined') {
  setTimeout(() => webSerialService.startBridgeListener(), 1000)
}

