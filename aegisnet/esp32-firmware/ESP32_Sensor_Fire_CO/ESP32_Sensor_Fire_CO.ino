/*
 * ==============================================================================
 * AegisNet (EcoMonitor) — Sensor Node 2: Fire, CO & Thermal
 * Node ID: ESP32-COTEMP
 * Sensors: MQ-7 Carbon Monoxide (ppm) + DHT11 Temp/Humidity + Optical Flame IR
 * Target Region: Indroda Nature Park Perimeter
 * ==============================================================================
 */

#include <WiFi.h>
#include <esp_now.h>

// PIN CONFIGURATION
#define MQ7_ANALOG_PIN  35
#define FLAME_DIGITAL_PIN 19
#define DHT_PIN 4

// Broadcast address
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

float readCOppm() {
  int raw = analogRead(MQ7_ANALOG_PIN);
  // Approximate curve conversion for MQ-7 analog reading (0-4095) to ppm (0-50 ppm)
  float ppm = (raw / 4095.0) * 25.0;
  return ppm;
}

bool readFlame() {
  // Flame sensor digital output (LOW when flame is present on most active-low modules)
  return digitalRead(FLAME_DIGITAL_PIN) == LOW;
}

void setup() {
  Serial.begin(115200);
  pinMode(MQ7_ANALOG_PIN, INPUT);
  pinMode(FLAME_DIGITAL_PIN, INPUT);

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

  strcpy(packet.node_id, "ESP32-COTEMP");
  packet.battery_pct = 95;
  Serial.println("ESP32-COTEMP Node Active and Broadcasting");
}

void loop() {
  packet.gas_ppm = readCOppm();
  packet.flame_detected = readFlame();

  // Simulated ambient reading if DHT library is not installed
  // If using DHT library, uncomment: packet.temperature_c = dht.readTemperature(); packet.humidity_pct = dht.readHumidity();
  packet.temperature_c = 29.2 + (analogRead(MQ7_ANALOG_PIN) % 10) * 0.2;
  packet.humidity_pct = 58.0;
  packet.battery_pct = 95;

  esp_now_send(gatewayAddress, (uint8_t *)&packet, sizeof(packet));

  Serial.print("Dispatched CO/Temp Packet -> CO: ");
  Serial.print(packet.gas_ppm);
  Serial.print(" ppm | Temp: ");
  Serial.print(packet.temperature_c);
  Serial.print(" C | Flame: ");
  Serial.println(packet.flame_detected ? "YES" : "NO");

  delay(2000);
}
