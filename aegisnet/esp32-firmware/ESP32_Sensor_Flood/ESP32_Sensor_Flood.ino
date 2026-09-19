/*
 * ==============================================================================
 * AegisNet (EcoMonitor) — Sensor Node 1: Flood & Water Level
 * Node ID: ESP32-FLOOD
 * Sensors: HC-SR04 Ultrasonic Distance (cm) + Analog Soil Moisture Sensor (%)
 * Target Region: Sant Sarovar Dam / Sabarmati River Corridor
 * ==============================================================================
 */

#include <WiFi.h>
#include <esp_now.h>

// PIN CONFIGURATION
#define TRIG_PIN 5
#define ECHO_PIN 18
#define SOIL_ANALOG_PIN 34

// REPLACE WITH YOUR USB GATEWAY ESP32 MAC ADDRESS (Printed in Serial Monitor of Gateway)
// Example: {0x24, 0x0A, 0xC4, 0xXX, 0xXX, 0xXX} or use Broadcast {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF}
uint8_t gatewayAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

typedef struct struct_message {
  char node_id[20];
  float water_level_cm;
  float soil_moisture;
  float temperature_c;
  float humidity_pct;
  float gas_ppm;
  bool flame_detected;
  int smoke_aqi;
  int pm10;
  float mq135_strength;
  float mq4_strength;
  int battery_pct;
  int rssi;
} struct_message;

struct_message packet;
esp_now_peer_info_t peerInfo;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5 meters)
  if (duration == 0) return 120.0; // Default clear reading

  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

float readSoilMoisture() {
  int raw = analogRead(SOIL_ANALOG_PIN);
  // Map raw 0-4095 to 0-100% moisture (invert if dry reading is high)
  float pct = map(raw, 4095, 1200, 0, 100);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(SOIL_ANALOG_PIN, INPUT);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  // Register broadcast peer
  memcpy(peerInfo.peer_addr, gatewayAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  strcpy(packet.node_id, "ESP32-FLOOD");
  packet.battery_pct = 98;
  Serial.println("ESP32-FLOOD Node Active and Broadcasting");
}

void loop() {
  packet.water_level_cm = readDistanceCm();
  packet.soil_moisture = readSoilMoisture();
  packet.battery_pct = 98;

  esp_err_t result = esp_now_send(gatewayAddress, (uint8_t *)&packet, sizeof(packet));

  Serial.print("Dispatched Flood Packet -> Water: ");
  Serial.print(packet.water_level_cm);
  Serial.print(" cm | Soil: ");
  Serial.print(packet.soil_moisture);
  Serial.println(" %");

  delay(2000); // Transmit every 2 seconds
}
