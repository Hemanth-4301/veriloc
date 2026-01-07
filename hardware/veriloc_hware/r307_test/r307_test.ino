#include <HardwareSerial.h>

HardwareSerial mySerial(2); // use UART2 (pins 16 RX, 17 TX)

void setup() {
  Serial.begin(115200);      // for Serial Monitor
  mySerial.begin(57600, SERIAL_8N1, 16, 17); // baud rate, mode, RX, TX
  Serial.println("R307 Fingerprint Sensor Test Starting...");
  delay(2000);

  // Send "handshake" command manually
  byte cmd[] = {0xEF, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0x01, 0x00, 0x03, 0x01, 0x00, 0x05};
  mySerial.write(cmd, sizeof(cmd));

  Serial.println("Handshake command sent — waiting for response...");
}

void loop() {
  if (mySerial.available()) {
    Serial.print("Response: ");
    while (mySerial.available()) {
      Serial.print(mySerial.read(), HEX);
      Serial.print(" ");
    }
    Serial.println();
    delay(1000);
  }
}