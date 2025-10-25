#include <Adafruit_Fingerprint.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>

// OLED setup (128x64, I2C address 0x3C)
#define OLED_WIDTH 128
#define OLED_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET);

// Fingerprint sensor setup (UART on GPIO16, GPIO17)
SoftwareSerial mySerial(16, 17); // RX, TX
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  // Initialize Serial for debugging
  Serial.begin(115200);
  while (!Serial); // Wait for Serial Monitor
  Serial.println("\nVERILOC Fingerprint Enrollment");

  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("VERILOC Enrollment"));
  display.display();

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
  // Prompt for 4-digit ID
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("Enter 4-digit ID"));
  display.println(F("(1000-9999)"));
  display.display();
  Serial.println("\nEnter a 4-digit ID (1000 to 9999) to enroll:");

  // Wait for ID input
  while (Serial.available() == 0);
  int id = Serial.parseInt();
  if (id < 1000 || id > 9999) {
    Serial.println("Invalid ID. Must be a 4-digit number (1000-9999).");
    display.clearDisplay();
    display.println(F("Invalid ID"));
    display.println(F("Use 1000-9999"));
    display.display();
    delay(2000);
    return;
  }

  // Check if ID is already used
  if (finger.loadModel(id) == FINGERPRINT_OK) {
    Serial.println("Error: ID " + String(id) + " already in use.");
    display.clearDisplay();
    display.println(F("ID In Use:"));
    display.println(String(id));
    display.display();
    delay(3000);
    return;
  }

  // Check for duplicate fingerprint
  Serial.println("Place finger to check duplicates...");
  display.clearDisplay();
  display.println(F("Scan Finger"));
  display.println(F("Check Duplicate"));
  display.display();
  int fingerprintID = getFingerprintIDez();
  if (fingerprintID != -1) {
    Serial.println("Error: Fingerprint already enrolled with ID: " + String(fingerprintID));
    display.clearDisplay();
    display.println(F("Duplicate Found"));
    display.println(F("ID: ") + String(fingerprintID));
    display.display();
    delay(3000);
    return;
  }

  // Proceed with enrollment
  Serial.println("Enrolling fingerprint at ID #" + String(id));
  display.clearDisplay();
  display.println(F("Enrolling ID:"));
  display.println(String(id));
  display.display();
  if (enrollFingerprint(id)) {
    Serial.println("Fingerprint enrolled successfully at ID #" + String(id));
    display.clearDisplay();
    display.println(F("Enrolled ID:"));
    display.println(String(id));
    display.display();
    delay(5000);
  } else {
    Serial.println("Enrollment failed");
    display.clearDisplay();
    display.println(F("Enrollment Failed"));
    display.display();
    delay(3000);
  }
}

// Function to check for existing fingerprint
int getFingerprintIDez() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return -1;
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return -1;
  p = finger.fingerFastSearch();
  if (p != FINGERPRINT_OK) return -1;
  return finger.fingerID;
}

// Function to enroll fingerprint
bool enrollFingerprint(int id) {
  // First scan
  Serial.println("Place finger on sensor...");
  display.clearDisplay();
  display.println(F("Scan Finger 1/2"));
  display.display();
  uint8_t p = finger.getImage();
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
      case FINGERPRINT_OK:
        Serial.println("Image taken");
        break;
      case FINGERPRINT_NOFINGER:
        Serial.println(".");
        break;
      default:
        Serial.println("Error taking image");
        display.clearDisplay();
        display.println(F("Scan Error"));
        display.display();
        delay(2000);
        return false;
    }
  }

  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("Error converting image");
    display.clearDisplay();
    display.println(F("Convert Error"));
    display.display();
    delay(2000);
    return false;
  }

  Serial.println("Remove finger");
  display.clearDisplay();
  display.println(F("Remove Finger"));
  display.display();
  delay(2000);
  p = finger.getImage();
  while (p != FINGERPRINT_NOFINGER) {
    p = finger.getImage();
  }

  // Second scan
  Serial.println("Place same finger again...");
  display.clearDisplay();
  display.println(F("Scan Finger 2/2"));
  display.display();
  p = finger.getImage();
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
      case FINGERPRINT_OK:
        Serial.println("Image taken");
        break;
      case FINGERPRINT_NOFINGER:
        Serial.println(".");
        break;
      default:
        Serial.println("Error taking image");
        display.clearDisplay();
        display.println(F("Scan Error"));
        display.display();
        delay(2000);
        return false;
    }
  }

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println("Error converting image");
    display.clearDisplay();
    display.println(F("Convert Error"));
    display.display();
    delay(2000);
    return false;
  }

  // Create model
  p = finger.createModel();
  if (p != FINGERPRINT_OK) {
    Serial.println("Error creating model");
    display.clearDisplay();
    display.println(F("Model Error"));
    display.display();
    delay(2000);
    return false;
  }

  // Store model
  p = finger.storeModel(id);
  if (p != FINGERPRINT_OK) {
    Serial.println("Error storing fingerprint");
    display.clearDisplay();
    display.println(F("Store Error"));
    display.display();
    delay(2000);
    return false;
  }

  return true;
}