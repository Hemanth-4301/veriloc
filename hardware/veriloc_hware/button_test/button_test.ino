void setup() {
  Serial.begin(115200);
  pinMode(12, INPUT_PULLUP);
  pinMode(13, INPUT_PULLUP);
}

void loop() {
  if (digitalRead(12) == LOW) {
    Serial.println("Button 1 Pressed!");
    delay(300);
  }
  if (digitalRead(13) == LOW) {
    Serial.println("Button 2 Pressed!");
    delay(300);
  }
}
