/*
 * ==============================================================================
 * AegisNet (EcoMonitor) — ESP32 USB Gateway & Coordinator Sketch
 * Target: USB ESP32 (Connected to Computer via COM7 @ 115200 baud)
 * Protocol: ESP-NOW Wireless Receiver -> Serial JSON Output
 * ==============================================================================
 * Description:
 *   Receives wireless telemetry from 3 remote ESP32 field sensor nodes:
 *     1. ESP32-FLOOD     (Ultrasonic water level + soil moisture)
 *     2. ESP32-COTEMP    (MQ-7 CO gas + DHT11 Temp/Humidity + Flame sensor)
 *     3. ESP32-POLLUTION (PM2.5 / PM10 + MQ-135 NH3 + MQ-4 CH4)
 *   Serializes packets into single-line JSON and prints to Serial over USB.
 *   The AegisNet website directly reads this stream on COM7 via Web Serial API.
 * ==============================================================================
 */

#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

// Standard Struct matching incoming packet format
typedef struct struct_message {
  char node_id[20];       // "ESP32-FLOOD", "ESP32-COTEMP", "ESP32-POLLUTION"
  float water_level_cm;   // Flood node
  float soil_moisture;    // Flood node
  float temperature_c;    // CO/Temp node
  float humidity_pct;     // CO/Temp node
  float gas_ppm;          // CO/Temp node (MQ-7)
  bool flame_detected;    // CO/Temp node
  int smoke_aqi;          // Pollution node (PM2.5)
  int pm10;               // Pollution node
  float mq135_strength;   // Pollution node (NH3/Air)
  float mq4_strength;     // Pollution node (Methane/CNG)
  int battery_pct;        // 0 - 100
  int rssi;               // Signal strength dBm
} struct_message;

struct_message incomingPacket;

// Callback function executed when data is received over ESP-NOW
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len) {
  memcpy(&incomingPacket, incomingData, sizeof(incomingPacket));

  // Determine RSSI (signal strength)
  wifi_ap_record_t wifidata;
  int rssiVal = -60;
  if (esp_wifi_sta_get_ap_info(&wifidata) == 0) {
    rssiVal = wifidata.rssi;
  }

  // Print single-line clean JSON to USB Serial (COM7)
  Serial.print("{\"node_id\":\"");
  Serial.print(incomingPacket.node_id);
  Serial.print("\"");

  if (strcmp(incomingPacket.node_id, "ESP32-FLOOD") == 0) {
    Serial.print(",\"water_level_cm\":");
    Serial.print(incomingPacket.water_level_cm, 1);
    Serial.print(",\"soil_moisture\":");
    Serial.print(incomingPacket.soil_moisture, 1);
  } 
  else if (strcmp(incomingPacket.node_id, "ESP32-COTEMP") == 0) {
    Serial.print(",\"temperature_c\":");
    Serial.print(incomingPacket.temperature_c, 1);
    Serial.print(",\"humidity_pct\":");
    Serial.print(incomingPacket.humidity_pct, 1);
    Serial.print(",\"gas_ppm\":");
    Serial.print(incomingPacket.gas_ppm, 2);
    Serial.print(",\"flame_detected\":");
    Serial.print(incomingPacket.flame_detected ? "true" : "false");
  } 
  else if (strcmp(incomingPacket.node_id, "ESP32-POLLUTION") == 0) {
    Serial.print(",\"smoke_aqi\":");
    Serial.print(incomingPacket.smoke_aqi);
    Serial.print(",\"pm10\":");
    Serial.print(incomingPacket.pm10);
    Serial.print(",\"mq135_strength\":");
    Serial.print(incomingPacket.mq135_strength, 1);
    Serial.print(",\"mq4_strength\":");
    Serial.print(incomingPacket.mq4_strength, 1);
  }

  Serial.print(",\"battery_pct\":");
  Serial.print(incomingPacket.battery_pct);
  Serial.print(",\"rssi\":");
  Serial.print(rssiVal);
  Serial.println("}");
}

void setup() {
  // Initialize USB Serial at 115200 baud
  Serial.begin(115200);
  delay(1000);

  Serial.println("{\"status\":\"boot\",\"message\":\"AegisNet ESP32 USB Gateway Ready on COM7\"}");

  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_STA);

  // Print MAC Address for sensor node pairing
  Serial.print("{\"gateway_mac\":\"");
  Serial.print(WiFi.macAddress());
  Serial.println("\"}");

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("{\"status\":\"error\",\"message\":\"Error initializing ESP-NOW\"}");
    return;
  }

  // Register receive callback
  esp_now_register_recv_cb(OnDataRecv);
  Serial.println("{\"status\":\"ready\",\"message\":\"Listening for 3-node sensor telemetry\"}");
}

void loop() {
  // Gateway runs in event-driven interrupt mode; keep loop light
  delay(100);
}
