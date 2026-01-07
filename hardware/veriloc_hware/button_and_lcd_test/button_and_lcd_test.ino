#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define VACANT_BUTTON 12
#define OCCUPIED_BUTTON 13

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Wire.begin();  
  lcd.init();
  lcd.backlight();

  pinMode(VACANT_BUTTON, INPUT_PULLUP);
  pinMode(OCCUPIED_BUTTON, INPUT_PULLUP);

  lcd.setCursor(0, 0);
  lcd.print("Button Test Mode");
  lcd.setCursor(0, 1);
  lcd.print("Press a button");
}

void loop() {
  if (digitalRead(VACANT_BUTTON) == LOW) {  
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Vacant Button");
    lcd.setCursor(0, 1);
    lcd.print("Pressed!");
    delay(1000);
  }

  if (digitalRead(OCCUPIED_BUTTON) == LOW) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Occupied Button");
    lcd.setCursor(0, 1);
    lcd.print("Pressed!");
    delay(1000);
  }
}
