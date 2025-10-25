#include <Adafruit_Fingerprint.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials (replace with your values)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-backend-url/api/rooms/update";

// Pin definitions
#define BUTTON_VACANT 12
#define BUTTON_OCCUPIED 13

// OLED setup (128x64, I2C address 0x3C)
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET);

// Fingerprint sensor setup (UART on GPIO16, GPIO17)
SoftwareSerial mySerial(16, 17); // RX, TX
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// Room details (configure for each device)
String roomNumber = "ROOM_101";
bool isAuthenticated = false;
int fingerprintID = -1;

void setup() {
  // Initialize Serial for debugging
  Serial.begin(115200);
  mySerial.begin(57600);

  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("VERILOC Starting"));
  display.println(roomNumber);
  display.display();

  // Initialize buttons with internal pull-ups
  pinMode(BUTTON_VACANT, INPUT_PULLUP);
  pinMode(BUTTON_OCCUPIED, INPUT_PULLUP);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  display.clearDisplay();
  display.println(F("Connecting WiFi"));
  display.display();
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
    display.println(F("."));
    display.display();
  }
  Serial.println("Connected to WiFi");
  display.clearDisplay();
  display.println(F("WiFi Connected"));
  display.display();
  delay(2000);

  // Initialize fingerprint sensor
  finger.begin(57600);
  if (finger.verifyPassword()) {
    Serial.println("Fingerprint sensor found!");
    display.clearDisplay();
    display.println(F("Sensor Ready"));
    display.display();
    delay(2000);
  } else {
    Serial.println("Fingerprint sensor not found :(");
    display.clearDisplay();
    display.println(F("Sensor Error"));
    display.display();
    while (1);
  }
}

void loop() {
  // If not authenticated, prompt for fingerprint
  if (!isAuthenticated) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(F("Scan Fingerprint"));
    display.println(roomNumber);
    display.display();
    fingerprintID = getFingerprintIDez();
    if (fingerprintID != -1) {
      isAuthenticated = true;
      display.clearDisplay();
      display.println(F("Access Granted"));
      display.println(F("ID: ") + String(fingerprintID));
      display.display();
      delay(3000);
    } else {
      display.clearDisplay();
      display.println(F("Unknown Fingerprint"));
      display.println(roomNumber);
      display.display();
      delay(2000);
    }
  } else {
    // Check button presses
    if (digitalRead(BUTTON_VACANT) == LOW) {
      updateRoomStatus("Vacant");
      delay(1000); // Debounce
    } else if (digitalRead(BUTTON_OCCUPIED) == LOW) {
      updateRoomStatus("Occupied");
      delay(1000); // Debounce
    }
  }
  delay(100);
}

// Function to authenticate fingerprint
int getFingerprintIDez() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return -1;
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return -1;
  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK) return -1;
  return finger.fingerID;
}

// Function to display messages on OLED
void displayStatus(String message) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(roomNumber);
  display.println(message);
  display.display();
  delay(3000);
}

// Function to send status update to backend
void updateRoomStatus(String status) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String payload = "{\"roomNumber\":\"" + roomNumber + "\",\"status\":\"" + status + "\",\"fingerprintID\":" + String(fingerprintID) + "}";
    display.clearDisplay();
    display.println(F("Updating ") + status);
    display.println(F("ID: ") + String(fingerprintID));
    display.display();
    
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode == 200) {
      Serial.println("Status updated: " + status);
      displayStatus("Updated to " + status);
    } else if (httpResponseCode == 403) {
      Serial.println("Unauthorized");
      displayStatus("Unauthorized");
    } else {
      Serial.println("Error sending update: " + String(httpResponseCode));
      displayStatus("Server Error");
    }
    http.end();
    // Reset authentication
    isAuthenticated = false;
    fingerprintID = -1;
  } else {
    displayStatus("WiFi Disconnected");
    Serial.println("WiFi not connected");
    isAuthenticated = false;
    fingerprintID = -1;
  }
}