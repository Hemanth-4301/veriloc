#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Set the LCD address to 0x27 or 0x3F depending on your module
// Try 0x27 first — most common for I2C LCDs
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  // Initialize I2C communication
  Wire.begin();  // SDA and SCL default to 21 and 22 on ESP32
  lcd.init();    // Initialize the LCD
  lcd.backlight(); // Turn on backlight
  
  lcd.setCursor(0, 0);
  lcd.print("Veriloc");
  lcd.setCursor(0, 1);
  lcd.print("LCD working :)");
}

void loop() {
  // Nothing to loop for now
}
