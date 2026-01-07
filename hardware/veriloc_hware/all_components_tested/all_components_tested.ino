#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_Fingerprint.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>

// ==================== CONFIGURATION ====================
// WiFi Credentials
const char* ssid = "Ganesha";
const char* password = "krishna4";
const char* serverUrl = "https://veriloc-api.onrender.com/api/rooms/update";

// Pin Definitions
#define BUTTON_VACANT 13
#define BUTTON_OCCUPIED 12
#define RX_PIN 16
#define TX_PIN 17

// Room Configuration
const String ROOM_NUMBER = "ROOM_101";

// ==================== HARDWARE SETUP ====================
LiquidCrystal_I2C lcd(0x27, 16, 2);
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

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
int authenticatedUserID = -1;
bool isRoomOccupied = false;
unsigned long lastButtonPress = 0;
const unsigned long DEBOUNCE_DELAY = 300;
const unsigned long AUTH_TIMEOUT = 30000; // 30 seconds
unsigned long authStartTime = 0;

// ==================== FUNCTION DECLARATIONS ====================
void displayMessage(String line1, String line2);
void connectWiFi();
void reconnectWiFi();
void initFingerprintSensor();
void handleIdleState();
void handleAuthenticatedState();
void handleEnrollmentState();
void handleOccupiedButton();
void handleVacantButton();
int checkFingerprint();
void updateRoomStatus(String status);
void resetAuthentication();
bool isBothButtonsPressed();
void enrollNewFingerprint();
int getNextFreeID();
int waitForFingerImage();

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  ROOM MANAGEMENT SYSTEM v3.0       ║");
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

  // System Ready
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  SYSTEM READY                      ║");
  Serial.println("╚════════════════════════════════════╝");
  displayMessage("System Ready", "Scan Finger...");
  currentState = STATE_IDLE;
}

// ==================== MAIN LOOP ====================
void loop() {
  // Ensure Wi-Fi stays connected
  if (WiFi.status() != WL_CONNECTED) {
    reconnectWiFi();
  }

  switch (currentState) {
    case STATE_IDLE: 
      handleIdleState(); 
      break;
    
    case STATE_AUTHENTICATING: 
      currentState = STATE_IDLE; 
      break;
    
    case STATE_AUTHENTICATED: 
      handleAuthenticatedState(); 
      break;
    
    case STATE_ENROLLING: 
      handleEnrollmentState(); 
      break;
    
    case STATE_UPDATING: 
      // Handled in updateRoomStatus
      break;
  }

  delay(100);
}

// ==================== STATE HANDLERS ====================
void handleIdleState() {
  // Check if both buttons pressed for enrollment
  if (isBothButtonsPressed()) {
    currentState = STATE_ENROLLING;
    return;
  }

  int fingerID = checkFingerprint();
  
  if (fingerID >= 0) {
    authenticatedUserID = fingerID;
    isAuthenticated = true;
    authStartTime = millis();
    currentState = STATE_AUTHENTICATED;
    
    lcd.clear();
    lcd.print("Access Granted");
    lcd.setCursor(0, 1);
    lcd.print("ID: ");
    lcd.print(fingerID);
    
    Serial.print("✅ Access Granted | User ID: ");
    Serial.println(fingerID);
    delay(2000);
    
    displayMessage("Select Action:", "Occup=12 Vac=13");
  } 
  else if (fingerID == -1) {
    Serial.println("❌ Access Denied - Fingerprint not recognized");
    lcd.clear();
    lcd.print("Access Denied");
    lcd.setCursor(0, 1);
    lcd.print("Try Again...");
    delay(2000);
    displayMessage("System Ready", "Scan Finger...");
  }
}

void handleAuthenticatedState() {
  // Check for authentication timeout
  if (millis() - authStartTime > AUTH_TIMEOUT) {
    Serial.println("⏱️ Authentication timeout");
    resetAuthentication();
    return;
  }

  unsigned long currentTime = millis();
  
  // Check button presses with debounce
  if (currentTime - lastButtonPress > DEBOUNCE_DELAY) {
    if (digitalRead(BUTTON_OCCUPIED) == LOW) {
      lastButtonPress = currentTime;
      handleOccupiedButton();
    } 
    else if (digitalRead(BUTTON_VACANT) == LOW) {
      lastButtonPress = currentTime;
      handleVacantButton();
    }
  }
}

void handleEnrollmentState() {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  ENROLLMENT MODE                   ║");
  Serial.println("╚════════════════════════════════════╝");
  
  displayMessage("Enroll Mode", "Starting...");
  delay(1000);
  
  enrollNewFingerprint();
  
  // Return to idle state
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
  if (result == FINGERPRINT_NOFINGER) return -2; // No finger
  if (result != FINGERPRINT_OK) return -2; // Error getting image

  result = finger.image2Tz();
  if (result != FINGERPRINT_OK) return -1; // Error converting

  result = finger.fingerFastSearch();
  if (result != FINGERPRINT_OK) return -1; // Not found

  Serial.print("🔍 Fingerprint matched | ID: ");
  Serial.print(finger.fingerID);
  Serial.print(" | Confidence: ");
  Serial.println(finger.confidence);
  
  return finger.fingerID;
}

void enrollNewFingerprint() {
  int newID = getNextFreeID();
  
  if (newID == -1) {
    displayMessage("Error!", "Memory Full");
    Serial.println("❌ Enrollment failed - Memory full");
    delay(2000);
    return;
  }

  Serial.print("📝 Enrolling new fingerprint at ID: ");
  Serial.println(newID);

  // ===== FIRST CAPTURE =====
  displayMessage("Enrolling...", "Place finger");
  Serial.println("   Step 1: Place finger on sensor");
  
  int result = waitForFingerImage();
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Try Again");
    Serial.println("❌ Failed to capture first image");
    delay(2000);
    return;
  }

  result = finger.image2Tz(1);
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Scan Failed");
    Serial.println("❌ Failed to convert first image");
    delay(2000);
    return;
  }

  displayMessage("Success!", "Remove finger");
  Serial.println("   ✓ First scan captured");
  delay(2000);

  // Wait for finger removal
  displayMessage("Enrolling...", "Remove finger");
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    delay(100);
  }
  delay(500);

  // ===== SECOND CAPTURE =====
  displayMessage("Enrolling...", "Place AGAIN");
  Serial.println("   Step 2: Place same finger again");
  
  result = waitForFingerImage();
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Try Again");
    Serial.println("❌ Failed to capture second image");
    delay(2000);
    return;
  }

  result = finger.image2Tz(2);
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Scan Failed");
    Serial.println("❌ Failed to convert second image");
    delay(2000);
    return;
  }

  Serial.println("   ✓ Second scan captured");

  // ===== CREATE AND STORE MODEL =====
  displayMessage("Processing...", "Please wait");
  result = finger.createModel();
  
  if (result != FINGERPRINT_OK) {
    displayMessage("Error!", "Mismatch");
    Serial.println("❌ Fingerprints did not match");
    delay(2000);
    return;
  }

  result = finger.storeModel(newID);
  
  if (result == FINGERPRINT_OK) {
    displayMessage("Success!", "ID: " + String(newID));
    Serial.print("✅ Enrollment successful! Stored at ID: ");
    Serial.println(newID);
    delay(3000);
  } else {
    displayMessage("Error!", "Store Failed");
    Serial.println("❌ Failed to store fingerprint");
    delay(2000);
  }
}

int getNextFreeID() {
  Serial.println("🔍 Searching for free ID slot...");
  
  for (int id = 1; id <= 127; id++) {
    uint8_t result = finger.loadModel(id);
    if (result != FINGERPRINT_OK) {
      Serial.print("   Found free slot at ID: ");
      Serial.println(id);
      return id;
    }
  }
  
  Serial.println("   No free slots available");
  return -1;
}

int waitForFingerImage() {
  int timeout = 100; // 10 seconds (100 * 100ms)
  
  while (timeout > 0) {
    uint8_t result = finger.getImage();
    
    if (result == FINGERPRINT_OK) {
      return FINGERPRINT_OK;
    }
    
    delay(100);
    timeout--;
  }
  
  Serial.println("   ⏱️ Timeout waiting for finger");
  return FINGERPRINT_TIMEOUT;
}

// ==================== NETWORK FUNCTIONS ====================
void connectWiFi() {
  displayMessage("Connecting", "WiFi...");
  
  // Print current WiFi credentials for verification
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║  WiFi Connection Attempt          ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.print("📡 SSID: ");
  Serial.println(ssid);
  Serial.print("📡 Password Length: ");
  Serial.println(strlen(password));
  Serial.print("📡 Password: ");
  Serial.println(password);
  
  // Configure WiFi settings
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(1000);
  
  // Start connection
  Serial.println("📡 Starting WiFi connection...");
  WiFi.begin(ssid, password);

  int attempts = 0;
  const int maxAttempts = 40; // 20 seconds
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    Serial.print(".");
    
    // Show status every 5 attempts
    if (attempts % 10 == 0 && attempts > 0) {
      Serial.println();
      Serial.print("   Status Code: ");
      Serial.println(WiFi.status());
      Serial.print("   Attempt: ");
      Serial.print(attempts);
      Serial.print("/");
      Serial.println(maxAttempts);
      
      lcd.clear();
      lcd.print("Connecting...");
      lcd.setCursor(0, 1);
      lcd.print(String(attempts/2) + "s / " + String(maxAttempts/2) + "s");
    }
    
    attempts++;
  }

  Serial.println(); // New line after dots
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected Successfully!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print("   MAC Address: ");
    Serial.println(WiFi.macAddress());
    
    displayMessage("WiFi Connected", WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.print("   Final Status Code: ");
    Serial.println(WiFi.status());
    Serial.println("\n📶 Troubleshooting Guide:");
    Serial.println("   1. Verify hotspot name is EXACTLY: Hemanth");
    Serial.println("   2. Verify password is EXACTLY: 1223334444");
    Serial.println("   3. Ensure hotspot is 2.4 GHz (NOT 5 GHz)");
    Serial.println("   4. Make sure hotspot is ON and visible");
    Serial.println("   5. Try moving ESP32 closer to phone");
    Serial.println("   6. Restart your phone's hotspot");
    Serial.println("   7. Check if hotspot allows new connections");
    Serial.println("\n   WiFi Status Codes:");
    Serial.println("   0 = WL_IDLE_STATUS");
    Serial.println("   1 = WL_NO_SSID_AVAIL (Wrong SSID)");
    Serial.println("   4 = WL_CONNECT_FAILED (Wrong Password)");
    Serial.println("   6 = WL_DISCONNECTED");
    
    displayMessage("WiFi Failed!", "Check Serial");
    delay(5000);
  }
}

void reconnectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n⚠️ WiFi lost — reconnecting...");
    displayMessage("WiFi Lost!", "Reconnecting...");
    connectWiFi();
  }
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
  http.setTimeout(10000); // 10 sec timeout

  String payload = "{\"roomNumber\":\"" + ROOM_NUMBER + 
                   "\",\"status\":\"" + status + 
                   "\",\"fingerprintID\":" + String(authenticatedUserID) + 
                   ",\"timestamp\":\"" + String(millis()) + "\"}";

  displayMessage("Updating...", status);
  Serial.println("\n📤 Sending update:");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    if (httpCode == 200 || httpCode == 201) {
      Serial.println("✅ Update Success!");
      Serial.print("   Response: ");
      Serial.println(http.getString());
      displayMessage("Success!", status);
    } else {
      Serial.print("⚠️ Server Error: ");
      Serial.println(httpCode);
      displayMessage("Server Error", String(httpCode));
    }
  } else {
    Serial.print("❌ HTTP Error: ");
    Serial.println(http.errorToString(httpCode));
    displayMessage("Error!", "No Response");
  }

  http.end();
  delay(1500);
  resetAuthentication();
}

// ==================== SENSOR INITIALIZATION ====================
void initFingerprintSensor() {
  displayMessage("Initializing", "Sensor...");
  Serial.println("🔧 Initializing fingerprint sensor...");

  mySerial.begin(57600, SERIAL_8N1, RX_PIN, TX_PIN);
  finger.begin(57600);
  delay(500);

  if (finger.verifyPassword()) {
    Serial.println("✅ Fingerprint sensor detected");
    finger.getTemplateCount();
    Serial.print("   Stored fingerprints: ");
    Serial.println(finger.templateCount);
    displayMessage("Sensor Ready", String(finger.templateCount) + " prints");
    delay(2000);
  } else {
    Serial.println("❌ Fingerprint sensor not found!");
    Serial.println("   Check wiring:");
    Serial.println("   - RX (Yellow) -> Pin 16");
    Serial.println("   - TX (White)  -> Pin 17");
    Serial.println("   - VCC (Red)   -> 3.3V/5V");
    Serial.println("   - GND (Black) -> GND");
    displayMessage("Sensor Error!", "Check Wiring");
    while (true) delay(1000);
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