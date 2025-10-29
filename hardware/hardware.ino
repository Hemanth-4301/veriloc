#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_Fingerprint.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================
const char* ssid = "Ganesha";
const char* password = "krishna4";
const char* serverUrl = "https://veriloc-api.onrender.com/api/rooms/update";

// Pin Definitions
#define BUTTON_VACANT 13
#define BUTTON_OCCUPIED 12
#define RX_PIN 16
#define TX_PIN 17

// Room Configuration
const String ROOM_NUMBER = "400";

// ==================== HARDWARE SETUP ====================
LiquidCrystal_I2C lcd(0x27, 16, 2);
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// ==================== ID MAPPING ====================
struct IDMapping {
  uint8_t sensorID;
  uint16_t userID;
};

IDMapping idMappings[127];
int mappingCount = 0;

// ==================== STATE VARIABLES ====================
enum SystemState {
  STATE_IDLE,
  STATE_AUTHENTICATING,
  STATE_AUTHENTICATED,
  STATE_ENROLLING,
  STATE_UPDATING
};

SystemState currentState = STATE_IDLE;
bool isAuthenticated = false;
int authenticatedUserID = 1004;
bool isRoomOccupied = false;
unsigned long lastButtonPress = 0;
const unsigned long DEBOUNCE_DELAY = 300;
const unsigned long AUTH_TIMEOUT = 30000; // 30 seconds
unsigned long authStartTime = 0;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  ROOM MANAGEMENT SYSTEM v2.0       ║");
  Serial.println("╚════════════════════════════════════╝\n");

  // Initialize LCD
  Wire.begin();
  lcd.init();
  lcd.backlight();
  displayMessage("System", "Starting...");
  delay(1000);

  // Initialize Buttons
  pinMode(BUTTON_VACANT, INPUT_PULLUP);
  pinMode(BUTTON_OCCUPIED, INPUT_PULLUP);
  Serial.println("✓ Buttons initialized");

  // Connect to WiFi
  connectWiFi();

  // Initialize Fingerprint Sensor
  initFingerprintSensor();

  // Load ID mappings
  loadIDMappings();

  // System Ready
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  SYSTEM READY                      ║");
  Serial.println("╚════════════════════════════════════╝");
  displayMessage("System Ready", "Scan Finger...");
  currentState = STATE_IDLE;
}

// ==================== MAIN LOOP ====================
void loop() {
  // Check WiFi connection periodically
  if (WiFi.status() != WL_CONNECTED) {
    reconnectWiFi();
  }

  // State machine
  switch (currentState) {
    case STATE_IDLE:
      handleIdleState();
      break;
    
    case STATE_AUTHENTICATING:
      handleAuthenticationState();
      break;
    
    case STATE_AUTHENTICATED:
      handleAuthenticatedState();
      break;
    
    case STATE_ENROLLING:
      handleEnrollmentState();
      break;
    
    case STATE_UPDATING:
      // Handled in updateRoomStatus function
      break;
  }

  delay(100);
}

// ==================== ID MAPPING FUNCTIONS ====================
void loadIDMappings() {
  Serial.println("📋 Loading ID mappings...");
  mappingCount = 0;
  
  for (int sensorID = 1; sensorID <= 127; sensorID++) {
    uint8_t result = finger.loadModel(sensorID);
    if (result == FINGERPRINT_OK) {
      idMappings[mappingCount].sensorID = sensorID;
      idMappings[mappingCount].userID = 1000 + sensorID;
      
      Serial.print("   Sensor ID ");
      Serial.print(sensorID);
      Serial.print(" → User ID ");
      Serial.println(idMappings[mappingCount].userID);
      
      mappingCount++;
    }
  }
  
  Serial.print("✓ Loaded ");
  Serial.print(mappingCount);
  Serial.println(" ID mappings");
}

int getUserIDFromSensor(uint8_t sensorID) {
  for (int i = 0; i < mappingCount; i++) {
    if (idMappings[i].sensorID == sensorID) {
      return idMappings[i].userID;
    }
  }
  return -1;
}

uint8_t getSensorIDFromUser(int userID) {
  for (int i = 0; i < mappingCount; i++) {
    if (idMappings[i].userID == userID) {
      return idMappings[i].sensorID;
    }
  }
  return 0;
}

void addIDMapping(uint8_t sensorID, int userID) {
  if (mappingCount < 127) {
    idMappings[mappingCount].sensorID = sensorID;
    idMappings[mappingCount].userID = userID;
    mappingCount++;
    
    Serial.print("✓ Added mapping: Sensor ID ");
    Serial.print(sensorID);
    Serial.print(" → User ID ");
    Serial.println(userID);
  }
}

int generateNewUserID() {
  for (int userID = 1000; userID <= 9999; userID++) {
    bool exists = false;
    for (int i = 0; i < mappingCount; i++) {
      if (idMappings[i].userID == userID) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      return userID;
    }
  }
  return -1;
}

// ==================== STATE HANDLERS ====================
void handleIdleState() {
  if (isBothButtonsPressed()) {
    currentState = STATE_ENROLLING;
    return;
  }

  int sensorID = checkFingerprint();
  
  if (sensorID >= 0) {
    int userID = getUserIDFromSensor(sensorID);
    
    if (userID > 0) {
      authenticatedUserID = userID;
      isAuthenticated = true;
      authStartTime = millis();
      currentState = STATE_AUTHENTICATED;
      
      lcd.clear();
      lcd.print("Access Granted");
      lcd.setCursor(0, 1);
      lcd.print("ID: ");
      lcd.print(userID);
      
      Serial.print("✅ Access Granted | User ID: ");
      Serial.print(userID);
      Serial.print(" (Sensor ID: ");
      Serial.print(sensorID);
      Serial.println(")");
      delay(2000);
      
      displayMessage("Select Action:", "Occup=12 Vac=13");
    } else {
      lcd.clear();
      lcd.print("Error!");
      lcd.setCursor(0, 1);
      lcd.print("ID Not Mapped");
      Serial.println("❌ Sensor ID found but no user mapping exists");
      delay(2000);
      displayMessage("System Ready", "Scan Finger...");
    }
  } else if (sensorID == -1) {
    lcd.clear();
    lcd.print("Access Denied");
    lcd.setCursor(0, 1);
    lcd.print("Unknown Finger");
    Serial.println("❌ Access Denied - Fingerprint not recognized");
    delay(2000);
    displayMessage("System Ready", "Scan Finger...");
  }
}

void handleAuthenticationState() {
  currentState = STATE_IDLE;
}

void handleAuthenticatedState() {
  if (millis() - authStartTime > AUTH_TIMEOUT) {
    Serial.println("⏱ Authentication timeout");
    resetAuthentication();
    return;
  }

  unsigned long currentTime = millis();
  
  if (currentTime - lastButtonPress > DEBOUNCE_DELAY) {
    if (digitalRead(BUTTON_OCCUPIED) == LOW) {
      lastButtonPress = currentTime;
      handleOccupiedButton();
    } else if (digitalRead(BUTTON_VACANT) == LOW) {
      lastButtonPress = currentTime;
      handleVacantButton();
    }
  }

  static unsigned long lastDisplayUpdate = 0;
  if (currentTime - lastDisplayUpdate > 5000) {
    displayMessage("Select Action:", "Occup=12 Vac=13");
    lastDisplayUpdate = currentTime;
  }
}

void handleEnrollmentState() {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  ENROLLMENT MODE                   ║");
  Serial.println("╚════════════════════════════════════╝");
  
  displayMessage("Enroll Mode", "Starting...");
  delay(1000);
  
  enrollNewFingerprint();
  
  resetAuthentication();
  currentState = STATE_IDLE;
}

// ==================== BUTTON HANDLERS ====================
void handleOccupiedButton() {
  Serial.println("\n🔵 OCCUPIED button pressed");
  isRoomOccupied = true;
  updateRoomStatus("Occupied");
}

void handleVacantButton() {
  Serial.println("\n🟢 VACANT button pressed");
  isRoomOccupied = false;
  updateRoomStatus("Vacant");
}

// ==================== FINGERPRINT FUNCTIONS ====================
int checkFingerprint() {
  uint8_t result = finger.getImage();
  
  if (result == FINGERPRINT_NOFINGER) {
    return -2;
  }
  
  if (result != FINGERPRINT_OK) {
    return -2;
  }

  result = finger.image2Tz();
  if (result != FINGERPRINT_OK) {
    return -1;
  }

  result = finger.fingerFastSearch();
  if (result != FINGERPRINT_OK) {
    return -1;
  }

  Serial.print("🔍 Fingerprint matched | Sensor ID: ");
  Serial.print(finger.fingerID);
  Serial.print(" | Confidence: ");
  Serial.println(finger.confidence);

  return finger.fingerID;
}

void enrollNewFingerprint() {
  int sensorID = getNextFreeID();
  
  if (sensorID == -1) {
    displayMessage("Error!", "Memory Full");
    Serial.println("❌ Enrollment failed - Memory full");
    delay(2000);
    return;
  }

  int newUserID = generateNewUserID();
  if (newUserID == -1) {
    displayMessage("Error!", "No User IDs");
    Serial.println("❌ Enrollment failed - No available user IDs");
    delay(2000);
    return;
  }

  Serial.print("📝 Enrolling new fingerprint");
  Serial.print("\n   Sensor ID: ");
  Serial.print(sensorID);
  Serial.print("\n   User ID: ");
  Serial.println(newUserID);

  displayMessage("Enrolling...", "User: " + String(newUserID));
  Serial.println("   Step 1: Place finger on sensor");
  delay(2000);
  displayMessage("Place finger", "on sensor");
  
  int result = waitForFingerImage();
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Try Again");
    delay(2000);
    return;
  }

  result = finger.image2Tz(1);
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Scan Failed");
    delay(2000);
    return;
  }

  displayMessage("Success!", "Remove finger");
  Serial.println("   ✓ First scan captured");
  delay(2000);

  displayMessage("Enrolling...", "Remove finger");
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    delay(100);
  }
  delay(500);

  displayMessage("Enrolling...", "Place AGAIN");
  Serial.println("   Step 2: Place same finger again");
  
  result = waitForFingerImage();
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Try Again");
    delay(2000);
    return;
  }

  result = finger.image2Tz(2);
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Scan Failed");
    delay(2000);
    return;
  }

  Serial.println("   ✓ Second scan captured");

  displayMessage("Processing...", "Please wait");
  result = finger.createModel();
  
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Mismatch");
    Serial.println("❌ Fingerprints did not match");
    delay(2000);
    return;
  }

  result = finger.storeModel(sensorID);
  
  if (result == FINGERPRINT_OK) {
    addIDMapping(sensorID, newUserID);
    
    displayMessage("Success!", "ID: " + String(newUserID));
    Serial.print("✅ Enrollment successful!");
    Serial.print("\n   Sensor ID: ");
    Serial.print(sensorID);
    Serial.print("\n   User ID: ");
    Serial.println(newUserID);
    delay(3000);
  } else {
    displayMessage("Error!", "Store Failed");
    Serial.println("❌ Failed to store fingerprint");
    delay(2000);
  }
}

int getNextFreeID() {
  Serial.println("🔍 Searching for free sensor ID slot...");
  
  for (int id = 1; id <= 127; id++) {
    uint8_t result = finger.loadModel(id);
    if (result != FINGERPRINT_OK) {
      Serial.print("   Found free slot at Sensor ID: ");
      Serial.println(id);
      return id;
    }
  }
  
  Serial.println("   No free slots available");
  return -1;
}

int waitForFingerImage() {
  int timeout = 100;
  
  while (timeout > 0) {
    uint8_t result = finger.getImage();
    
    if (result == FINGERPRINT_OK) {
      return FINGERPRINT_OK;
    }
    
    delay(100);
    timeout--;
  }
  
  return FINGERPRINT_TIMEOUT;
}

// ==================== NETWORK FUNCTIONS ====================
void connectWiFi() {
  displayMessage("Connecting", "WiFi...");
  Serial.print("📡 Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    displayMessage("WiFi Connected", WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    displayMessage("WiFi Failed!", "Check Config");
    delay(2000);
  }
}

void reconnectWiFi() {
  Serial.println("⚠ WiFi disconnected. Reconnecting...");
  displayMessage("WiFi Lost!", "Reconnecting...");
  WiFi.disconnect();
  delay(1000);
  connectWiFi();
}

void updateRoomStatus(String status) {
  currentState = STATE_UPDATING;
  
  if (WiFi.status() != WL_CONNECTED) {
    displayMessage("Error!", "No WiFi");
    Serial.println("❌ Cannot update - No WiFi connection");
    delay(2000);
    resetAuthentication();
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  // Create JSON object using ArduinoJson
  StaticJsonDocument<200> doc;
  doc["roomNumber"] = ROOM_NUMBER;
  doc["status"] = status;
  doc["fingerprintID"] = authenticatedUserID;

  // Serialize to string
  String payload;
  serializeJson(doc, payload);

  // Log the payload for debugging
  Serial.println("📤 JSON payload:");
  Serial.println(payload);
  Serial.println("   Payload length: " + String(payload.length()));
  for (int i = 0; i < payload.length(); i++) {
    Serial.print("   Pos ");
    Serial.print(i);
    Serial.print(": '");
    Serial.print(payload[i]);
    Serial.print("' (ASCII: ");
    Serial.print((int)payload[i]);
    Serial.println(")");
  }

  displayMessage("Updating...", status);
  Serial.println("\n📤 Sending update to server:");
  Serial.println("   Room: " + ROOM_NUMBER);
  Serial.println("   Status: " + status);
  Serial.println("   User ID: " + String(authenticatedUserID));

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("✅ Server response (Code ");
    Serial.print(httpCode);
    Serial.println("):");
    Serial.println(response);
    
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error && responseDoc["message"]) {
      String msg = responseDoc["message"].as<String>();
      if (msg.length() <= 16) {
        displayMessage("Server Msg", msg);
      } else {
        String line1 = msg.substring(0, 16);
        String line2 = msg.substring(16, min((int)msg.length(), 32));
        displayMessage(line1, line2);
      }
      Serial.println("   Server Message: " + msg);
    } else {
      if (httpCode == 500) {
        displayMessage("Server Error", "Status Failed");
      } else if (httpCode == 403) {
        displayMessage("Error 403", "Unauthorized");
      } else if (httpCode == 404) {
        displayMessage("Error 404", "Room Not Found");
      } else {
        displayMessage("Server Error", "Code: " + String(httpCode));
      }
      if (error) {
        Serial.println("   JSON parsing error: " + String(error.c_str()));
      }
    }
  } else {
    displayMessage("Error!", "No Response");
    Serial.print("❌ HTTP Error: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  delay(3000);
  resetAuthentication();
}

// ==================== SENSOR INITIALIZATION ====================
void initFingerprintSensor() {
  displayMessage("Initializing", "Sensor...");
  Serial.println("🔧 Initializing fingerprint sensor...");

  int baudRates[] = {57600, 9600, 19200, 38400, 115200};
  bool sensorFound = false;
  
  for (int i = 0; i < 5; i++) {
    Serial.print("   Trying baud rate: ");
    Serial.println(baudRates[i]);
    
    mySerial.end();
    delay(100);
    mySerial.begin(baudRates[i], SERIAL_8N1, RX_PIN, TX_PIN);
    delay(500);
    
    finger.begin(baudRates[i]);
    delay(500);

    if (finger.verifyPassword()) {
      Serial.print("✅ Fingerprint sensor detected at ");
      Serial.print(baudRates[i]);
      Serial.println(" baud");
      
      finger.getTemplateCount();
      Serial.print("   Stored fingerprints: ");
      Serial.println(finger.templateCount);
      
      displayMessage("Sensor Ready", String(finger.templateCount) + " prints");
      delay(2000);
      sensorFound = true;
      break;
    }
  }

  if (!sensorFound) {
    Serial.println("❌ Fingerprint sensor not found at any baud rate!");
    Serial.println("\n   Troubleshooting steps:");
    Serial.println("   1. Check wiring:");
    Serial.println("      - Sensor RX -> ESP32 TX (Pin 17)");
    Serial.println("      - Sensor TX -> ESP32 RX (Pin 16)");
    Serial.println("      - VCC -> 3.3V (NOT 5V for some sensors)");
    Serial.println("      - GND -> GND");
    Serial.println("   2. Check power supply (sensor needs stable power)");
    Serial.println("   3. Try swapping RX/TX pins");
    Serial.println("   4. Verify sensor model compatibility");
    
    displayMessage("Sensor Error!", "Check Wiring");
    Serial.println("\n⚠ System will continue without sensor for debugging");
    delay(5000);
  }
}

// ==================== UTILITY FUNCTIONS ====================
void displayMessage(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  if (line2.length() > 0) {
    lcd.setCursor(0, 1);
    lcd.print(line2);
  }
}

void resetAuthentication() {
  isAuthenticated = false;
  authenticatedUserID = -1;
  authStartTime = 0;
  currentState = STATE_IDLE;
  displayMessage("System Ready", "Scan Finger...");
  Serial.println("\n🔄 System reset to idle state");
}

bool isBothButtonsPressed() {
  return (digitalRead(BUTTON_VACANT) == LOW && 
          digitalRead(BUTTON_OCCUPIED) == LOW);
}

// ==================== DEBUG FUNCTIONS ====================
void printSystemStatus() {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  SYSTEM STATUS                     ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.print("State: ");
  Serial.println(currentState);
  Serial.print("Authenticated: ");
  Serial.println(isAuthenticated ? "Yes" : "No");
  Serial.print("User ID: ");
  Serial.println(authenticatedUserID);
  Serial.print("Room Status: ");
  Serial.println(isRoomOccupied ? "Occupied" : "Vacant");
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Serial.print("ID Mappings: ");
  Serial.println(mappingCount);
  Serial.println("════════════════════════════════════════\n");
}