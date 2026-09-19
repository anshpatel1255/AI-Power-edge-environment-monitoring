/*
 * ==============================================================================
 * AegisNet (EcoMonitor) — Sensor Node 3: Air Pollution & Toxic Gas
 * Node ID: ESP32-POLLUTION
 * Sensors: Optical PM2.5/10 Dust Sensor + MQ-135 (NH3/Air) + MQ-4 (Methane/CNG)
 * Target Region: Narol-Vatva GIDC Industrial Corridor
 * ==============================================================================
 */

#include <WiFi.h>
#include <esp_now.h>

// PIN CONFIGURATION
#define MQ135_ANALOG_PIN 32
#define MQ4_ANALOG_PIN   33
#define DUST_ANALOG_PIN  36 // VP pin

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

int readDustAqi() {
  int raw = analogRead(DUST_ANALOG_PIN);
  // Map ADC reading to representative PM2.5 AQI range (10 - 250)
  int aqi = map(raw, 200, 3000, 25, 200);
  if (aqi < 15) aqi = 15;
  return aqi;
}

float readMq135() {
  int raw = analogRead(MQ135_ANALOG_PIN);
  float strength = (raw / 4095.0) * 100.0;
  return strength;
}

float readMq4() {
  int raw = analogRead(MQ4_ANALOG_PIN);
  float strength = (raw / 4095.0) * 100.0;
  return strength;
}

void setup() {
  Serial.begin(115200);
  pinMode(MQ135_ANALOG_PIN, INPUT);
  pinMode(MQ4_ANALOG_PIN, INPUT);
  pinMode(DUST_ANALOG_PIN, INPUT);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  memcpy(peerInfo.peer_addr, gatewayAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  strcpy(packet.node_id, "ESP32-POLLUTION");
  packet.battery_pct = 92;
  Serial.println("ESP32-POLLUTION Node Active and Broadcasting");
}

void loop() {
  packet.smoke_aqi = readDustAqi();
  packet.pm10 = (int)(packet.smoke_aqi * 1.35);
  packet.mq135_strength = readMq135();
  packet.mq4_strength = readMq4();
  packet.battery_pct = 92;

  esp_now_send(gatewayAddress, (uint8_t *)&packet, sizeof(packet));

  Serial.print("Dispatched Pollution Packet -> PM2.5: ");
  Serial.print(packet.smoke_aqi);
  Serial.print(" AQI | MQ-135: ");
  Serial.print(packet.mq135_strength);
  Serial.print(" % | MQ-4: ");
  Serial.print(packet.mq4_strength);
  Serial.println(" %");

  delay(2000);
}
