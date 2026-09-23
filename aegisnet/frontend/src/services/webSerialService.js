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
    this.floodBuf = {}
    this.cotempBuf = {}
    this.polBuf = {}
    this.currentSection = null
    this.bridgeEventSource = null
    this.userDisconnected = typeof localStorage !== 'undefined' && localStorage.getItem('esp32_user_disconnected') === 'true'
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
        water_level_cm: null,
        soil_moisture: null,
        battery_pct: 98,
        rssi: -58,
        solar_charging: true,
        risk_score: 0,
        severity: 'advisory',
        status: 'offline',
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
        temperature_c: null,
        humidity_pct: null,
        gas_ppm: null,
        flame_detected: false,
        battery_pct: 95,
        rssi: -64,
        solar_charging: true,
        risk_score: 0,
        severity: 'advisory',
        status: 'offline',
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
        smoke_aqi: null,
        pm10: null,
        mq135_strength: null,
        mq4_strength: null,
        battery_pct: 92,
        rssi: -71,
        solar_charging: true,
        risk_score: 0,
        severity: 'advisory',
        status: 'offline',
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
    this.userDisconnected = false
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('esp32_user_disconnected')
    }
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
      let portDesc = 'ESP32 USB Device'
      if (portInfo.usbVendorId) {
        const vid = portInfo.usbVendorId.toString(16).padStart(4, '0').toLowerCase()
        const pid = (portInfo.usbProductId || 0).toString(16).padStart(4, '0').toLowerCase()
        let chipName = 'ESP32 Serial'
        if (vid === '10c4') chipName = 'ESP32 (CP210x UART)'
        else if (vid === '1a86') chipName = 'ESP32 (CH340/CH341)'
        else if (vid === '0403') chipName = 'ESP32 (FTDI)'
        else if (vid === '303a') chipName = 'ESP32-S3/C3 (Espressif USB)'
        else if (vid === '2341') chipName = 'ESP32 (Arduino CDC)'
        portDesc = `${chipName} [VID:${vid} PID:${pid}]`
      }

      store.addUsbLog('SYSTEM', `Opening ${portDesc} at ${this.baudRate} baud...`, 'info')
      
      await this.port.open({ baudRate: this.baudRate })
      this.keepReading = true

      // Update store connection status
      store.setUsbConnected(true, portDesc, this.baudRate)
      store.addUsbLog('SYSTEM', `✓ Connected to ESP32 Gateway on ${portDesc} @ ${this.baudRate} baud`, 'success')

      // Immediately sync all 3 nodes online matching ESP32 firmware specs
      this.syncAllEsp32Nodes()

      // Start calculating packets/sec
      if (this.packetRateTimer) clearInterval(this.packetRateTimer)
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

  // Switch baud rate without re-prompting if port is already open
  async switchBaudRate(newBaud) {
    if (!this.port) return
    const portRef = this.port
    const targetBaud = Number(newBaud)
    const store = useStore.getState()
    store.addUsbLog('SYSTEM', `Reconfiguring port to ${targetBaud} baud...`, 'info')

    this.keepReading = false
    try {
      if (this.reader) {
        await this.reader.cancel().catch(() => {})
        this.reader.releaseLock()
        this.reader = null
      }
      await portRef.close().catch(() => {})
    } catch {}

    this.port = portRef
    this.baudRate = targetBaud
    await this.port.open({ baudRate: this.baudRate })
    this.keepReading = true
    store.setUsbConnected(true, store.usbPortName, this.baudRate)
    store.addUsbLog('SYSTEM', `✓ Port re-opened at ${this.baudRate} baud`, 'success')
    this.readSerialStream()
  }

  // Continuous stream reading with native TextDecoder (no pipeTo lock)
  async readSerialStream() {
    let lineBuffer = ''
    const textDecoder = new TextDecoder()
    const store = useStore.getState()

    try {
      this.reader = this.port.readable.getReader()
      store.addUsbLog('SYSTEM', `Serial reader listening at ${this.baudRate} baud. Waiting for ESP32 packets...`, 'info')

      while (this.keepReading) {
        const { value, done } = await this.reader.read()
        if (done) {
          break
        }
        if (value && value.length > 0) {
          // Immediately record that physical bytes arrived from the COM port!
          this.packetsThisSecond++
          this.packetCount++
          store.incrementUsbPacketCount()

          const chunk = textDecoder.decode(value, { stream: true })
          lineBuffer += chunk

          // Split incoming stream by newlines
          const lines = lineBuffer.split(/\r?\n/)
          // Keep whatever incomplete fragment is left at the end
          lineBuffer = lines.pop()

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed) {
              this.handleIncomingLine(trimmed)
            }
          }

          // Safety: if buffer gets long without a newline (> 120 chars), process it directly
          if (lineBuffer.length > 120) {
            this.handleIncomingLine(lineBuffer.trim())
            lineBuffer = ''
          }
        }
      }
    } catch (error) {
      if (this.keepReading) {
        store.addUsbLog('SYSTEM', `Serial read error: ${error.message}`, 'error')
      }
    } finally {
      if (this.reader) {
        try { this.reader.releaseLock() } catch {}
        this.reader = null
      }
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

    if (data && typeof data === 'object') {
      this.processSensorPacket(data)
      return
    }

    // 3. Fallback: parse Key-Value format (e.g. WATER:34.2,TEMP:28.5 or distance:35,soil:60)
    data = this.parseKeyValueFallback(line)
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      this.processSensorPacket(data)
      return
    }

    // 3.5 Fallback: pure CSV numbers, e.g. "34.5, 68.2" or "27.8, 62.1, 1.2"
    const numberParts = line.split(/[,;\t|]/).map((p) => p.trim()).filter(Boolean)
    if (numberParts.length >= 2 && numberParts.every((p) => !isNaN(Number(p)))) {
      const nums = numberParts.map(Number)
      if (nums.length === 2) {
        if (nums[0] < 50 && nums[1] > 20) {
          // Temperature and Humidity (e.g., 28.5, 65.2)
          this.processSensorPacket({ temperature_c: nums[0], humidity_pct: nums[1] })
          return
        } else {
          // Water distance and Soil moisture (e.g., 42.0, 70.5)
          this.processSensorPacket({ water_level_cm: nums[0], soil_moisture: nums[1] })
          return
        }
      } else if (nums.length >= 3) {
        if (nums[0] > 10 && nums[0] < 120 && nums[1] > 15 && nums[1] < 50) {
          // Water distance, Temperature, Humidity
          this.processSensorPacket({
            water_level_cm: nums[0],
            temperature_c: nums[1],
            humidity_pct: nums[2]
          })
          return
        } else {
          this.processSensorPacket({
            temperature_c: nums[0],
            humidity_pct: nums[1],
            gas_ppm: nums[2]
          })
          return
        }
      }
    }

    // 4. Intelligent Smart Human-Readable Serial Stream Parser
    this.parseHumanTextStream(line)
  }

  // Fallback parser for non-JSON serial outputs (key:value pairs)
  parseKeyValueFallback(line) {
    try {
      const result = {}
      const pairs = line.split(/[,;\t|]/)
      for (const pair of pairs) {
        const [k, v] = pair.split(/[:=]/)
        if (k && v !== undefined) {
          const key = k.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
          const val = v.trim()
          const num = Number(val)
          result[key] = isNaN(num) ? val : num
        }
      }
      if (result.node && !result.node_id) result.node_id = result.node
      if (result.id && !result.node_id) result.node_id = result.id
      return Object.keys(result).length > 0 ? result : null
    } catch {
      return null
    }
  }

  flushFlood(status = 'online') {
    if (!this.floodBuf) return
    const w = this.floodBuf.water_level_cm
    const s = this.floodBuf.soil_moisture
    if (w == null && s == null && status === 'online') return
    const pkt = {
      node_id: 'ESP32-FLOOD',
      status,
      ...this.floodBuf,
    }
    this.floodBuf = {}
    this.processSensorPacket(pkt)
  }

  flushCotemp(status = 'online') {
    if (!this.cotempBuf) return
    if (Object.keys(this.cotempBuf).length === 0 && status === 'online') return
    const pkt = {
      node_id: 'ESP32-COTEMP',
      status,
      ...this.cotempBuf,
    }
    this.cotempBuf = {}
    this.processSensorPacket(pkt)
  }

  flushPollution(status = 'online') {
    if (!this.polBuf) return
    if (Object.keys(this.polBuf).length === 0 && status === 'online') return
    const pkt = {
      node_id: 'ESP32-POLLUTION',
      status,
      ...this.polBuf,
    }
    this.polBuf = {}
    this.processSensorPacket(pkt)
  }

  // Parse human text prints, Arduino logs, and alert strings from ESP32 nodes
  parseHumanTextStream(line) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === 'ESP32 READY') {
      return
    }

    const lower = trimmed.toLowerCase()

    // Section transitions
    if (lower.includes('mq-135')) {
      this.currentSection = 'MQ135'
      return
    } else if (lower.includes('mq-4')) {
      this.currentSection = 'MQ4'
      return
    } else if (lower.includes('mq-7')) {
      this.currentSection = 'MQ7'
      return
    } else if (lower.includes('pms5003') || lower.includes('particulate')) {
      this.currentSection = 'PMS5003'
      return
    } else if (lower.includes('final node status')) {
      this.currentSection = 'FINAL_STATUS'
      return
    } else if (lower.includes('co + temperature') || lower.includes('cotemp')) {
      if (this.currentSection !== 'FINAL_STATUS') {
        this.currentSection = 'CO_TEMP'
        return
      }
    } else if (lower.includes('flood') && (lower.includes('node') || lower.includes('monitoring') || lower.includes('corridor'))) {
      if (this.currentSection !== 'FINAL_STATUS') {
        this.currentSection = 'FLOOD'
        return
      }
    }

    // Flush on section dividers
    if (trimmed.includes('===') || trimmed.includes('###')) {
      if (['PMS5003', 'MQ135', 'MQ4', 'MQ7'].includes(this.currentSection)) {
        this.flushPollution('online')
      } else if (this.currentSection === 'FLOOD') {
        this.flushFlood('online')
      } else if (this.currentSection === 'CO_TEMP') {
        this.flushCotemp('online')
      }
      return
    }

    // 1. Water level / Ultrasonic distance
    const waterMatch = trimmed.match(/(?:water(?:\s*distance|\s*level)?|distance|dist|water_dist|level|depth|hcsr04|ultrasonic)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
      || trimmed.match(/(\d+(?:\.\d+)?)\s*cm\b/i)
    if (waterMatch) {
      const val = parseFloat(waterMatch[1])
      if (val >= 2.0) {
        this.floodBuf.water_level_cm = val
        this.floodBuf.distance = val
      }
    }

    // 2. Soil moisture
    const soilMatch = trimmed.match(/(?:soil(?:\s*moisture)?|moisture)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    if (soilMatch) {
      const val = parseFloat(soilMatch[1])
      if (val > 0) {
        this.floodBuf.soil_moisture = val
        this.floodBuf.soilMoisture = val
      }
    }

    // 3. Ambient Temperature (DHT11 or DS18B20)
    const tempMatch = trimmed.match(/(?:dht(?:11)?(?:\s*temp(?:erature)?)?|ambient(?:\s*temp)?)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i)
      || trimmed.match(/(?:temp(?:erature)?|ambient|t)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i)
      || trimmed.match(/(-?\d+(?:\.\d+)?)\s*(?:°c|\*c|deg\s*c)/i)
    if (tempMatch) {
      const val = parseFloat(tempMatch[1])
      if (val > 0) {
        this.cotempBuf.temperature_c = val
        this.cotempBuf.dhtTemperature = val
      }
    }

    const dsMatch = trimmed.match(/(?:ds18b20(?:\s*temp(?:erature)?)?|pipe(?:\s*temp)?)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i)
    if (dsMatch) {
      const val = parseFloat(dsMatch[1])
      if (val > 0) {
        this.cotempBuf.ds18b20Temperature = val
      }
    }

    // 4. Relative Humidity
    const humMatch = trimmed.match(/(?:humidity|hum|rh)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
      || (this.cotempBuf.temperature_c != null && trimmed.match(/(\d+(?:\.\d+)?)\s*%/i))
    if (humMatch) {
      const val = parseFloat(humMatch[1])
      if (val > 0) {
        this.cotempBuf.humidity_pct = val
        this.cotempBuf.humidity = val
      }
    }

    // 5. CO Gas (ZE07-CO ppm)
    const coMatch = trimmed.match(/(?:co(?:\s*gas)?(?:\s*\([^)]+\))?|ze07(?:-co)?)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    if (coMatch) {
      const val = parseFloat(coMatch[1])
      if (val >= 0) {
        this.cotempBuf.gas_ppm = val
        this.cotempBuf.coPPM = val
        this.cotempBuf.co_ppm = val
      }
    }

    // 6. Flame sensor
    if (lower.includes('flame')) {
      this.cotempBuf.flame_detected = ['yes', 'true', 'detected', 'high', '1'].some((w) => lower.includes(w))
    }

    // 7. PMS5003 Laser Particulate Matter (PM1.0, PM2.5, PM10 in µg/m³)
    const pm1Match = trimmed.match(/pm1[\._]0\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    if (pm1Match) {
      const val = parseFloat(pm1Match[1])
      if (val > 0) {
        this.polBuf.PM1_0 = val
        this.polBuf.pm1 = val
      }
    }

    const pm25Match = trimmed.match(/pm2[\._]5\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
      || trimmed.match(/(?:smoke_aqi|aqi|dust)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    if (pm25Match) {
      const val = parseFloat(pm25Match[1])
      if (val > 0) {
        this.polBuf.PM2_5 = val
        this.polBuf.smoke_aqi = Math.round(val)
      }
    }

    const pm10Match = trimmed.match(/pm10\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    if (pm10Match) {
      const val = parseFloat(pm10Match[1])
      if (val > 0) {
        this.polBuf.PM10 = val
        this.polBuf.pm10 = val
      }
    }

    // 8. MQ Sensors: Strength %, Raw ADC, Voltage, Digital Alarm
    const strMatch = trimmed.match(/strength\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    if (strMatch) {
      const val = parseFloat(strMatch[1])
      if (this.currentSection === 'MQ135') this.polBuf.mq135_strength = val
      else if (this.currentSection === 'MQ4') this.polBuf.mq4_strength = val
      else if (this.currentSection === 'MQ7') this.polBuf.mq7_strength = val
    }

    const adcMatch = trimmed.match(/adc\s*[:=]?\s*(\d+)/i)
    if (adcMatch) {
      const val = parseInt(adcMatch[1])
      if (this.currentSection === 'MQ135') this.polBuf.mq135_raw = val
      else if (this.currentSection === 'MQ4') this.polBuf.mq4_raw = val
      else if (this.currentSection === 'MQ7') this.polBuf.mq7_raw = val
    }

    const voltMatch = trimmed.match(/voltage\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    if (voltMatch) {
      const val = parseFloat(voltMatch[1])
      if (this.currentSection === 'MQ135') this.polBuf.mq135_voltage = val
      else if (this.currentSection === 'MQ4') this.polBuf.mq4_voltage = val
      else if (this.currentSection === 'MQ7') this.polBuf.mq7_voltage = val
    }

    const alarmMatch = trimmed.match(/digital alarm\s*[:=]?\s*(\w+)/i)
    if (alarmMatch) {
      const isAlarm = ['detected', 'alarm', 'high', '1', 'true'].includes(alarmMatch[1].toLowerCase())
      if (this.currentSection === 'MQ135') this.polBuf.mq135_alarm = isAlarm
      else if (this.currentSection === 'MQ4') this.polBuf.mq4_alarm = isAlarm
      else if (this.currentSection === 'MQ7') this.polBuf.mq7_alarm = isAlarm
    }

    // 9. Node Status reports in stream
    const floodStMatch = trimmed.match(/flood node\s*[:=]\s*(online|offline)/i)
    if (floodStMatch) {
      const isOnline = floodStMatch[1].toLowerCase() === 'online'
      if (isOnline) {
        this.flushFlood('online')
      } else {
        this.updateNodeStatus('ESP32-FLOOD', 'offline')
      }
      return
    }

    const coStMatch = trimmed.match(/co\s*\+\s*temperature\s*[:=]\s*(online|offline)/i)
    if (coStMatch) {
      const isOnline = coStMatch[1].toLowerCase() === 'online'
      if (isOnline) {
        this.flushCotemp('online')
      } else {
        this.updateNodeStatus('ESP32-COTEMP', 'offline')
      }
      return
    }

    const polStMatch = trimmed.match(/pollution node\s*[:=]\s*(online|offline)/i)
    if (polStMatch) {
      const isOnline = polStMatch[1].toLowerCase() === 'online'
      if (isOnline) {
        this.flushPollution('online')
      } else {
        this.updateNodeStatus('ESP32-POLLUTION', 'offline')
      }
      return
    }

    // 10. Master ESP32 Gateway & Network status detection
    if (lower.includes('aegisnet master') || lower.includes('environmental monitoring network')) {
      const store = useStore.getState()
      const baud = store.usbBaudRate || 115200
      store.setUsbConnected(true, store.usbPortName || 'ESP32 COM8 Gateway', baud)
      store.addUsbLog('SYSTEM', '✓ AegisNet Master ESP32 Gateway Active on COM Port', 'success')
      this.syncAllEsp32Nodes()
      return
    }
  }

  // Normalize incoming packet from ESP32 sensor node(s) and update store.
  processSensorPacket(raw) {
    if (!raw || typeof raw !== 'object') return
    const store = useStore.getState()
    const rawId = String(raw.node_id || raw.id || raw.node || '').toUpperCase()

    // Standardized metric extraction across all common aliases
    const water_level_cm = raw.water_level_cm != null ? Number(raw.water_level_cm)
      : (raw.distance_cm != null ? Number(raw.distance_cm)
      : (raw.distance != null ? Number(raw.distance)
      : (raw.water != null ? Number(raw.water)
      : (raw.dist != null ? Number(raw.dist)
      : (raw.level != null ? Number(raw.level)
      : (raw.depth != null ? Number(raw.depth) : null))))))

    const soil_moisture = raw.soil_moisture != null ? Number(raw.soil_moisture)
      : (raw.soilMoisture != null ? Number(raw.soilMoisture)
      : (raw.soil_moisture_percent != null ? Number(raw.soil_moisture_percent)
      : (raw.soil != null ? Number(raw.soil)
      : (raw.moisture != null ? Number(raw.moisture) : null))))

    const temperature_c = raw.temperature_c != null ? Number(raw.temperature_c)
      : (raw.dhtTemperature != null ? Number(raw.dhtTemperature)
      : (raw.temp != null ? Number(raw.temp)
      : (raw.temperature != null ? Number(raw.temperature)
      : (raw.t != null ? Number(raw.t)
      : (raw.ambient != null ? Number(raw.ambient) : null)))))

    const humidity_pct = raw.humidity_pct != null ? Number(raw.humidity_pct)
      : (raw.humidity != null ? Number(raw.humidity)
      : (raw.hum != null ? Number(raw.hum)
      : (raw.rh != null ? Number(raw.rh) : null)))

    const gas_ppm = raw.gas_ppm != null ? Number(raw.gas_ppm)
      : (raw.coPPM != null ? Number(raw.coPPM)
      : (raw.co_ppm != null ? Number(raw.co_ppm)
      : (raw.co != null ? Number(raw.co)
      : (raw.mq7 != null ? Number(raw.mq7)
      : (raw.gas != null ? Number(raw.gas) : null)))))

    const flame_detected = raw.flame_detected !== undefined ? Boolean(raw.flame_detected)
      : (raw.flame !== undefined ? Boolean(raw.flame)
      : (raw.fire !== undefined ? Boolean(raw.fire) : undefined))

    const smoke_aqi = raw.smoke_aqi != null ? Number(raw.smoke_aqi)
      : (raw.PM2_5 != null ? Number(raw.PM2_5)
      : (raw.pm2_5 != null ? Number(raw.pm2_5)
      : (raw.pm25 != null ? Number(raw.pm25)
      : (raw.aqi != null ? Number(raw.aqi)
      : (raw.dust != null ? Number(raw.dust) : null)))))

    const pm10 = raw.PM10 != null ? Number(raw.PM10)
      : (raw.pm10 != null ? Number(raw.pm10) : null)

    const pm1 = raw.PM1_0 != null ? Number(raw.PM1_0)
      : (raw.pm1_0 != null ? Number(raw.pm1_0)
      : (raw.pm1 != null ? Number(raw.pm1) : null))

    const optical_density = raw.optical_density != null ? Number(raw.optical_density)
      : (raw.od != null ? Number(raw.od) : smoke_aqi)

    const mq135_strength = raw.mq135_strength != null ? Number(raw.mq135_strength)
      : (raw.mq135 != null ? Number(raw.mq135)
      : (raw.toxic != null ? Number(raw.toxic) : null))

    const mq4_strength = raw.mq4_strength != null ? Number(raw.mq4_strength)
      : (raw.mq4 != null ? Number(raw.mq4)
      : (raw.methane != null ? Number(raw.methane) : null))

    const battery_pct = raw.battery_pct != null ? Number(raw.battery_pct)
      : (raw.battery != null ? Number(raw.battery) : 98)

    const rssi = raw.rssi != null ? Number(raw.rssi) : -64

    // Identify which sensor groups are active in this packet
    const hasFlood = (water_level_cm != null || soil_moisture != null || rawId.includes('FLOOD'))
    const hasTemp = (temperature_c != null || humidity_pct != null || gas_ppm != null || flame_detected !== undefined || rawId.includes('COTEMP') || rawId.includes('FIRE'))
    const hasAir = (smoke_aqi != null || mq135_strength != null || mq4_strength != null || rawId.includes('POLLUTION') || rawId.includes('AIR'))

    // ─── 1. DISPATCH FLOOD METRICS ──────────────────────────────────────────
    if (hasFlood) {
      let riskScore = 15
      let severity = 'advisory'
      let alertTrigger = null

      if (water_level_cm != null) {
        if (water_level_cm < 20) {
          riskScore = 95
          severity = 'emergency'
          alertTrigger = `CRITICAL WATER SURGE: Level at ${water_level_cm.toFixed(1)} cm! Threshold breached.`
        } else if (water_level_cm < 30) {
          riskScore = 70
          severity = 'warning'
          alertTrigger = `ELEVATED WATER LEVEL: Depth at ${water_level_cm.toFixed(1)} cm.`
        } else {
          riskScore = Math.max(10, Math.min(45, Math.round(100 - water_level_cm)))
        }
      }
      if (soil_moisture != null && soil_moisture > 85) {
        riskScore = Math.max(riskScore, 75)
        severity = riskScore >= 80 ? 'emergency' : 'warning'
      }

      const existingFlood = store.esp32Nodes?.find((n) => n.node_id === 'ESP32-FLOOD')
      const wVal = (water_level_cm != null && water_level_cm >= 2.0)
        ? water_level_cm
        : (existingFlood?.water_level_cm != null ? existingFlood.water_level_cm : null)
      const sVal = (soil_moisture != null && soil_moisture > 0)
        ? soil_moisture
        : (existingFlood?.soil_moisture != null ? existingFlood.soil_moisture : null)

      const floodNode = {
        node_id: 'ESP32-FLOOD',
        hw_node_id: rawId || 'ESP32-FLOOD',
        name: 'ESP32 Flood & Water Sentinel',
        category: 'flood',
        node_type: 'flood',
        sensor_type: 'Flood & Water Level',
        location: 'Sant Sarovar Dam, Sabarmati, Gandhinagar',
        latitude: raw.lat || 23.2385,
        longitude: raw.lng || 72.6710,
        status: raw.status || 'online',
        is_live_hw: true,
        connectivity: `USB Serial @ ${store.usbBaudRate || 115200} baud`,
        battery_pct,
        rssi,
        solar_charging: true,
        water_level_cm: wVal,
        soil_moisture: sVal,
        risk_score: riskScore,
        severity,
        last_update: 'Just now',
      }
      store.upsertEsp32Node(floodNode)

      if (alertTrigger) {
        store.addRealAlert({
          id: `USB-FLOOD-${Date.now()}`,
          node_id: 'ESP32-FLOOD',
          hazard: 'flood',
          risk_score: riskScore,
          message: alertTrigger,
        })
      }
    }

    // ─── 2. DISPATCH TEMPERATURE & CO/FIRE METRICS ──────────────────────────
    if (hasTemp) {
      let riskScore = 15
      let severity = 'advisory'
      let alertTrigger = null

      if (flame_detected) {
        riskScore = 96
        severity = 'emergency'
        alertTrigger = `ACTIVE FLAME DETECTED! Immediate fire hazard alert.`
      } else if (gas_ppm != null && gas_ppm > 8) {
        riskScore = 85
        severity = 'emergency'
        alertTrigger = `TOXIC CO SPIKE: Carbon Monoxide reading ${gas_ppm.toFixed(1)} ppm!`
      } else if (temperature_c != null && temperature_c > 42) {
        riskScore = 78
        severity = 'warning'
        alertTrigger = `THERMAL ANOMALY: Extreme ambient temperature ${temperature_c.toFixed(1)}°C.`
      } else {
        const tVal = temperature_c != null ? temperature_c : 28
        const gVal = gas_ppm != null ? gas_ppm : 1
        riskScore = Math.max(10, Math.min(45, Math.round(gVal * 4 + (tVal - 25) * 2)))
      }

      const existingCotemp = store.esp32Nodes?.find((n) => n.node_id === 'ESP32-COTEMP')
      const tVal = (temperature_c != null && temperature_c > 0) ? temperature_c : (existingCotemp?.temperature_c ?? null)
      const hVal = (humidity_pct != null && humidity_pct > 0) ? humidity_pct : (existingCotemp?.humidity_pct ?? null)
      const gVal = (gas_ppm != null && gas_ppm >= 0) ? gas_ppm : (existingCotemp?.gas_ppm ?? null)
      const fVal = flame_detected !== undefined ? Boolean(flame_detected) : Boolean(existingCotemp?.flame_detected)

      const cotempNode = {
        node_id: 'ESP32-COTEMP',
        hw_node_id: rawId || 'ESP32-COTEMP',
        name: 'ESP32 Fire & CO-Thermal Sentinel',
        category: 'fire',
        node_type: 'fire',
        sensor_type: 'Fire & Thermal IR',
        location: 'Indroda Nature Park Perimeter, Gandhinagar',
        latitude: raw.lat || 23.1950,
        longitude: raw.lng || 72.6520,
        status: raw.status || 'online',
        is_live_hw: true,
        connectivity: `USB Serial @ ${store.usbBaudRate || 115200} baud`,
        battery_pct,
        rssi,
        solar_charging: true,
        temperature_c: tVal,
        humidity_pct: hVal,
        gas_ppm: gVal,
        flame_detected: fVal,
        risk_score: riskScore,
        severity,
        last_update: 'Just now',
      }
      store.upsertEsp32Node(cotempNode)

      if (alertTrigger) {
        store.addRealAlert({
          id: `USB-FIRE-${Date.now()}`,
          node_id: 'ESP32-COTEMP',
          hazard: 'fire',
          risk_score: riskScore,
          message: alertTrigger,
        })
      }
    }

    // ─── 3. DISPATCH AIR QUALITY / POLLUTION METRICS ────────────────────────
    if (hasAir) {
      let riskScore = 15
      let severity = 'advisory'
      let alertTrigger = null

      if (smoke_aqi != null && smoke_aqi > 120) {
        riskScore = 88
        severity = 'emergency'
        alertTrigger = `HAZARDOUS AIR POLLUTION: PM2.5 AQI at ${smoke_aqi}!`
      } else if (smoke_aqi != null && smoke_aqi > 65) {
        riskScore = 62
        severity = 'warning'
        alertTrigger = `POOR AIR QUALITY: PM2.5 AQI at ${smoke_aqi}.`
      } else if (mq135_strength != null && mq135_strength > 60) {
        riskScore = 72
        severity = 'warning'
        alertTrigger = `CHEMICAL VAPOR DETECTED: Ammonia/VOC elevated (${mq135_strength.toFixed(0)}%).`
      } else {
        riskScore = Math.max(10, Math.min(45, Math.round((smoke_aqi || 30) * 0.4)))
      }

      const existingPollution = store.esp32Nodes?.find((n) => n.node_id === 'ESP32-POLLUTION')
      const aqiVal = (smoke_aqi != null && smoke_aqi > 0) ? smoke_aqi : (existingPollution?.smoke_aqi ?? null)
      const pm10Val = (pm10 != null && pm10 > 0) ? pm10 : (existingPollution?.pm10 ?? null)
      const pm1Val = (pm1 != null && pm1 > 0) ? pm1 : (existingPollution?.pm1 ?? null)
      const odVal = (optical_density != null && optical_density > 0) ? optical_density : (existingPollution?.optical_density ?? aqiVal)
      const mq135Val = (mq135_strength != null && mq135_strength > 0) ? mq135_strength : (existingPollution?.mq135_strength ?? null)
      const mq4Val = (mq4_strength != null && mq4_strength > 0) ? mq4_strength : (existingPollution?.mq4_strength ?? null)


      const pollutionNode = {
        node_id: 'ESP32-POLLUTION',
        hw_node_id: rawId || 'ESP32-POLLUTION',
        name: 'ESP32 Air Quality & Toxic Gas Sentinel',
        category: 'air',
        node_type: 'air',
        sensor_type: 'Air Quality (AQI)',
        location: 'Narol-Vatva GIDC Industrial Corridor, Ahmedabad',
        latitude: raw.lat || 22.9734,
        longitude: raw.lng || 72.5898,
        status: 'online',
        is_live_hw: true,
        connectivity: `USB Serial @ ${store.usbBaudRate || 115200} baud`,
        battery_pct,
        rssi,
        solar_charging: true,
        smoke_aqi: aqiVal,
        pm10: pm10Val,
        pm1: pm1Val,
        optical_density: odVal,
        mq135_strength: mq135Val,
        mq135_status: (mq135Val && mq135Val > 40) ? 'DETECTED' : 'NORMAL',
        mq4_strength: mq4Val,
        mq4_status: (mq4Val && mq4Val > 40) ? 'DETECTED' : 'NORMAL',
        risk_score: riskScore,
        severity,
        last_update: 'Just now',
      }
      store.upsertEsp32Node(pollutionNode)

      if (alertTrigger) {
        store.addRealAlert({
          id: `USB-AIR-${Date.now()}`,
          node_id: 'ESP32-POLLUTION',
          hazard: 'air',
          risk_score: riskScore,
          message: alertTrigger,
        })
      }
    }

    // ─── 4. FALLBACK: IF NO SPECIFIC SENSOR MATCHED BUT PACKET ARRIVED ──────
    if (!hasFlood && !hasTemp && !hasAir && rawId) {
      store.upsertEsp32Node({
        node_id: rawId.includes('COTEMP') ? 'ESP32-COTEMP' : rawId.includes('POLLUTION') ? 'ESP32-POLLUTION' : 'ESP32-FLOOD',
        hw_node_id: rawId,
        status: 'online',
        is_live_hw: true,
        last_update: 'Just now'
      })
    }
  }

  // Disconnect cleanly
  async disconnect() {
    this.userDisconnected = true
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('esp32_user_disconnected', 'true')
    }
    this.keepReading = false
    if (this.packetRateTimer) {
      clearInterval(this.packetRateTimer)
      this.packetRateTimer = null
    }

    if (this.bridgeEventSource) {
      try {
        this.bridgeEventSource.close()
      } catch {}
      this.bridgeEventSource = null
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
    store.setMasterGatewayStatus('OFFLINE', null)
    store.addUsbLog('SYSTEM', 'Serial port closed / disconnected by user.', 'info')
    
    // Explicitly update sensor nodes to offline state
    ;['ESP32-FLOOD', 'ESP32-COTEMP', 'ESP32-POLLUTION'].forEach((id) => {
      store.upsertEsp32Node({ node_id: id, status: 'offline', is_live_hw: false, last_update: 'Disconnected' })
    })
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

  // Query backend gateway and sync real physical ESP32 status
  async syncAllEsp32Nodes() {
    const store = useStore.getState()
    try {
      const res = await fetch('http://localhost:4000/api/sensor-data/latest')
      if (res.ok) {
        const json = await res.json()
        const isMasterOnline = json?.master?.status === 'ONLINE'
        store.setMasterGatewayStatus(isMasterOnline ? 'ONLINE' : 'OFFLINE', json?.master?.lastSeen)

        if (isMasterOnline && json.nodes) {
          if (json.nodes.FLOOD?.status === 'ONLINE' && json.nodes.FLOOD.latest) {
            this.processSensorPacket(json.nodes.FLOOD.latest)
          }
          if (json.nodes.CO_TEMP?.status === 'ONLINE' && json.nodes.CO_TEMP.latest) {
            this.processSensorPacket(json.nodes.CO_TEMP.latest)
          }
          if (json.nodes.POLLUTION?.status === 'ONLINE' && json.nodes.POLLUTION.latest) {
            this.processSensorPacket(json.nodes.POLLUTION.latest)
          }
          store.addUsbLog('GATEWAY', '✓ Synced live physical telemetry from Master ESP32 Gateway', 'success')
          return
        }
      }
    } catch {
      // Backend not reached
    }

    // If master is not transmitting or offline, ensure store accurately reflects OFFLINE state
    store.setMasterGatewayStatus('OFFLINE', null)
    store.addUsbLog('GATEWAY', '⚠ Master ESP32 Gateway is OFFLINE. Sensor nodes awaiting hardware.', 'warn')
  }

  // ─── Automatic Background COM7 Bridge Listener ────────────────────────────
  // Connects to local Python/Node serial bridge at http://localhost:4001/api/stream
  startBridgeListener() {
    if (typeof window === 'undefined') return
    // Respect user disconnect choice! Do not connect if user explicitly disconnected.
    if (this.userDisconnected) return

    if (this.bridgeEventSource) {
      try { this.bridgeEventSource.close() } catch {}
      this.bridgeEventSource = null
    }

    try {
      const eventSource = new EventSource('http://localhost:4001/api/stream')
      this.bridgeEventSource = eventSource

      eventSource.onopen = () => {
        if (this.userDisconnected) {
          try { eventSource.close() } catch {}
          return
        }
        const store = useStore.getState()
        store.addUsbLog('BRIDGE', 'Connected to telemetry stream port 4001', 'info')
      }

      eventSource.onmessage = (event) => {
        if (this.userDisconnected) {
          try { eventSource.close() } catch {}
          return
        }
        try {
          const data = JSON.parse(event.data)
          if (data && typeof data === 'object') {
            const store = useStore.getState()
            if (!store.usbConnected && !this.userDisconnected) {
              store.setUsbConnected(true, data.port || 'ESP32 COM Gateway', 115200)
            }
            if (!this.userDisconnected) {
              this.packetCount++
              this.packetsThisSecond++
              store.incrementUsbPacketCount()
              store.addUsbLog('COM7', JSON.stringify(data), 'rx')
              this.processSensorPacket(data)
            }
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

// Auto-start bridge listener in browser if not explicitly disconnected by user
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const isUserDisconnected = localStorage.getItem('esp32_user_disconnected') === 'true'
    if (!isUserDisconnected) {
      webSerialService.startBridgeListener()
    }
  }, 1000)
}

