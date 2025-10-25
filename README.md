# VERILOC - Classroom Occupancy Management System

**VERILOC** is a full-stack IoT-based web application designed to manage classroom occupancy with secure fingerprint authentication. The system integrates hardware (ESP32, R307 fingerprint sensor, SSD1306 OLED display, push buttons) with a MERN stack (MongoDB, Express, React, Node.js) to allow a superadmin to enroll admins, manage classrooms, and enable admins to update classroom statuses (Vacant or Occupied) via fingerprint authentication. All key interactions are displayed on an OLED screen for real-time feedback.

This README provides a detailed flow of how the project works, including hardware setup, software architecture, user workflows, and step-by-step instructions for setup and testing.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Hardware Components and Setup](#hardware-components-and-setup)
3. [Software Architecture](#software-architecture)
4. [Workflows](#workflows)
   - [Admin Enrollment (Superadmin)](#admin-enrollment-superadmin)
   - [Room Management (Superadmin)](#room-management-superadmin)
   - [Classroom Status Update (Admin)](#classroom-status-update-admin)
5. [Setup Instructions](#setup-instructions)
   - [Hardware Setup](#hardware-setup)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
6. [Testing the System](#testing-the-system)
7. [Debugging Tips](#debugging-tips)
8. [Folder Structure](#folder-structure)
9. [Dependencies](#dependencies)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)

---

## System Overview

**VERILOC** enables secure management of classroom occupancy through fingerprint-based authentication. The system has two primary user roles:
- **Superadmin**: Enrolls admins by capturing their fingerprints using an R307 fingerprint sensor connected to an ESP32, assigns a unique 4-digit `fingerprintID` (1000–9999) displayed on an SSD1306 OLED, and adds admin details to the database via a web-based Admin Dashboard. The superadmin also manages classroom assignments.
- **Admins**: Update classroom statuses (Vacant or Occupied) by scanning their fingerprints on the R307 sensor, with feedback shown on the OLED.

**Key Features**:
- Fingerprint enrollment with duplicate detection and 4-digit `fingerprintID`.
- Secure admin authentication via JWT for the Admin Dashboard.
- Classroom status updates with fingerprint verification.
- Real-time OLED feedback for all hardware interactions.
- Responsive React frontend with Tailwind CSS for public room viewing and admin management.
- MongoDB backend with REST APIs for secure data handling.

**Components**:
- **Hardware**: ESP32, R307 fingerprint sensor, SSD1306 OLED (128x64), two push buttons (Vacant and Occupied).
- **Backend**: Node.js with Express, MongoDB with Mongoose, JWT, bcrypt.
- **Frontend**: React with Tailwind CSS, Axios, React Router, Chart.js.

---

## Hardware Components and Setup

### Components
1. **ESP32 Development Board** (e.g., ESP32-WROOM-32):
   - Microcontroller with WiFi for processing and communication.
2. **R307 Fingerprint Sensor**:
   - Captures and authenticates fingerprints, stores up to 1000 templates.
   - Uses UART for communication.
3. **SSD1306 OLED Display** (128x64 pixels, I2C):
   - Displays messages (e.g., “Enrolled ID: 1001”, “Access Granted”).
4. **Push Buttons** (2x):
   - For setting classroom status (Vacant on GPIO12, Occupied on GPIO13).
5. **Additional**:
   - Breadboard, jumper wires, optional 10kΩ resistors for buttons.

### Circuit Connections
| Component                | Pin on Component | Pin on ESP32       | Notes                                      |
|--------------------------|------------------|--------------------|--------------------------------------------|
| **R307 Fingerprint Sensor** |                  |                    |                                            |
| VCC                      | VCC              | 3.3V               | Power supply (3.3V–6V compatible)         |
| GND                      | GND              | GND                | Ground connection                         |
| TX                       | TX               | GPIO16 (RXD2)      | Serial RX on ESP32                        |
| RX                       | RX               | GPIO17 (TXD2)      | Serial TX on ESP32                        |
| **SSD1306 OLED Display** |                  |                    | I2C, address 0x3C                         |
| VCC                      | VCC              | 3.3V               | Power supply                              |
| GND                      | GND              | GND                | Ground connection                         |
| SCL                      | SCL              | GPIO22 (SCL)       | I2C clock line                            |
| SDA                      | SDA              | GPIO21 (SDA)       | I2C data line                             |
| **Vacant Button**        | One terminal     | GPIO12             | Active LOW, internal pull-up              |
|                          | Other terminal   | GND                | Ground connection                         |
| **Occupied Button**      | One terminal     | GPIO13             | Active LOW, internal pull-up              |
|                          | Other terminal   | GND                | Ground connection                         |

### Notes
- **Power**: ESP32 provides 3.3V for R307 and OLED. Use USB or 5V VIN for ESP32.
- **Pull-ups**: Buttons use internal pull-up resistors on GPIO12/13. Add 10kΩ external pull-ups if unstable.
- **Safety**: Verify connections to avoid shorts. Use a multimeter for continuity.

---

## Software Architecture

### Backend (Node.js, Express, MongoDB)
- **Purpose**: Handles data storage, admin authentication, and room status updates.
- **Models**:
  - **Admin**: `{ username, password (hashed), email, fingerprintID (unique, 1000–9999) }`.
  - **Room**: `{ roomNumber, day, duration, status (Vacant/Occupied), authorizedAdmins (Admin refs), timestamp }`.
- **Routes**:
  - **/api/auth**:
    - `POST /login`: Authenticate superadmin/admin, return JWT.
    - `POST /register`: Add admin (protected, validates 4-digit `fingerprintID`).
    - `GET /admins`, `PUT /admins/:id`, `DELETE /admins/:id`: Manage admins (protected).
  - **/api/rooms**:
    - `GET /`: List rooms, filter by day/duration/roomNumber.
    - `POST /`, `PUT /:id`, `DELETE /:id`: Manage rooms (protected).
    - `POST /update`: Update room status from hardware, verify `fingerprintID`.
- **Security**: JWT for Admin Dashboard, bcrypt for passwords, unique `fingerprintID`.

### Frontend (React, Tailwind CSS)
- **Purpose**: Provides a public interface for room status viewing and a secure Admin Dashboard.
- **Routes**:
  - `/`: Homepage with room list and occupancy graph.
  - `/login`: Login form for superadmin/admin.
  - `/admin`: Admin Dashboard (JWT-protected).
- **Components**:
  - **Login**: Username/password form, stores JWT.
  - **Home**: Filters, RoomList (cards with status), OccupancyGraph (Chart.js bar chart).
  - **AdminDashboard**: Sidebar with Admins/Rooms, AdminForm, RoomForm, RoomList.
  - **AdminForm**: Add/edit admins with 4-digit `fingerprintID` validation.
  - **RoomForm**: Add/edit rooms with authorized admins selection.
- **UI**: Tailwind CSS with gradients, shadow cards, hover effects, responsive design.

### Hardware (ESP32)
- **Sketches**:
  - `enroll_admin.ino`: Enrolls admins with 4-digit `fingerprintID`, displays on OLED.
  - `veriloc.ino`: Authenticates fingerprints, updates room status, shows OLED feedback.
- **Libraries**: Adafruit_Fingerprint, Adafruit_SSD1306, Adafruit_GFX, WiFi, HTTPClient.

---

## Workflows

### Admin Enrollment (Superadmin)
1. **Setup Hardware**:
   - Connect ESP32, R307, OLED, and buttons as per the circuit table.
   - Load `enroll_admin.ino` via Arduino IDE.
2. **Enroll Fingerprint**:
   - Open Serial Monitor (115200 baud).
   - OLED shows “VERILOC Enrollment” and “Enter 4-digit ID (1000-9999)”.
   - Superadmin enters a 4-digit ID (e.g., 1001).
   - If invalid, OLED shows “Invalid ID” or “ID In Use: 1001”.
   - Admin scans finger to check duplicates; OLED shows “Scan Finger”.
   - If duplicate, OLED shows “Duplicate Found ID: X”.
   - Scan finger twice (“Scan Finger 1/2”, “Scan Finger 2/2”).
   - On success, OLED shows “Enrolled ID: 1001” for 5 seconds.
   - Record ID (e.g., “John Doe: ID 1001”).
3. **Add Admin to Database**:
   - Log in to Admin Dashboard (`/admin`) as superadmin.
   - In AdminForm, enter:
     - Username: “john”
     - Password: “pass123”
     - Email: “john@example.com”
     - Fingerprint ID: 1001 (from OLED)
   - Submit. If `fingerprintID` is duplicate, error shows: “Ensure Fingerprint ID is unique”.
   - Verify admin in Admins List.

### Room Management (Superadmin)
1. **Access Admin Dashboard**:
   - Log in at `/login` with superadmin credentials.
   - Navigate to `/admin`.
2. **Create/Edit Room**:
   - In RoomForm, enter:
     - Room Number: “ROOM_101”
     - Day: “Monday”
     - Duration: “9:00-10:00”
     - Status: “Vacant”
     - Authorized Admins: Select “john (ID: 1001)”
   - Submit to create room.
   - Edit/delete rooms in Admin Dashboard as needed.

### Classroom Status Update (Admin)
1. **Setup Hardware**:
   - Load `veriloc.ino` with correct WiFi credentials and server URL.
   - Power ESP32 in the classroom (e.g., ROOM_101).
2. **Authenticate Fingerprint**:
   - OLED shows “Scan Fingerprint” and “ROOM_101”.
   - Admin (e.g., John) scans finger on R307 sensor.
   - If matched, OLED shows “Access Granted ID: 1001” for 3 seconds.
   - If unmatched, OLED shows “Unknown Fingerprint”.
3. **Update Status**:
   - Press Vacant or Occupied button.
   - OLED shows “Updating Vacant ID: 1001” or similar.
   - ESP32 sends `{ roomNumber: "ROOM_101", status: "Vacant", fingerprintID: 1001 }` to `/api/rooms/update`.
   - Backend verifies:
     - `fingerprintID` exists in Admin collection.
     - Admin is in room’s `authorizedAdmins`.
   - On success, OLED shows “Updated to Vacant”.
   - On failure, OLED shows “Unauthorized” or “Server Error”.
4. **View Updates**:
   - Check `/` (homepage) for updated room status in RoomList.

---

## Setup Instructions

### Hardware Setup
1. **Assemble Circuit**:
   - Connect components as per the circuit table.
   - Verify with a multimeter to avoid shorts.
2. **Install Arduino IDE**:
   - Download from [arduino.cc](https://www.arduino.cc/en/software).
   - Add ESP32 support:
     - Preferences > Additional Boards Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`.
     - Tools > Board > Boards Manager > Install “esp32” by Espressif.
3. **Install Libraries**:
   - Sketch > Include Library > Manage Libraries.
   - Install `Adafruit Fingerprint Sensor`, `Adafruit GFX Library`, `Adafruit SSD1306`.
4. **Upload Sketches**:
   - Open `enroll_admin.ino` or `veriloc.ino`.
   - Set Board: “ESP32 Dev Module”, Port: Your ESP32’s USB port.
   - Update `ssid`, `password`, `serverUrl` in `veriloc.ino`.
   - Upload sketch.

### Backend Setup
1. **Prerequisites**:
   - Install Node.js (v16+), MongoDB (local or Atlas).
2. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd veriloc/server
   ```
3. **Install Dependencies**:
   ```bash
   npm install express mongoose bcryptjs jsonwebtoken cors dotenv
   ```
4. **Configure Environment**:
   - Create `.env` in `server/`:
     ```
     MONGODB_URI=mongodb://localhost/veriloc
     JWT_SECRET=your_jwt_secret
     PORT=5000
     ```
5. **Run Backend**:
   ```bash
   npm start
   ```
   - Server runs on `http://localhost:5000`.

### Frontend Setup
1. **Prerequisites**:
   - Install Node.js (v16+).
2. **Navigate to Frontend**:
   ```bash
   cd veriloc/client
   ```
3. **Install Dependencies**:
   ```bash
   npm install axios react-router-dom chart.js react-chartjs-2 tailwindcss
   ```
4. **Configure Tailwind**:
   - Initialize Tailwind in `client/`:
     ```bash
     npx tailwindcss init
     ```
   - Update `tailwind.config.js` and add Tailwind directives to `src/index.css`.
5. **Run Frontend**:
   ```bash
   npm start
   ```
   - App runs on `http://localhost:3000`.

---

## Testing the System

### Enrollment Testing
1. **Setup**:
   - Load `enroll_admin.ino`, connect hardware, open Serial Monitor.
2. **Test Cases**:
   - **Valid Enrollment**: Enter ID 1001, scan finger twice, expect OLED: “Enrolled ID: 1001”.
   - **Invalid ID**: Enter 123, expect OLED: “Invalid ID”.
   - **Duplicate ID**: Enroll ID 1001, try 1001 again, expect OLED: “ID In Use: 1001”.
   - **Duplicate Fingerprint**: Enroll ID 1001, try same finger for ID 1002, expect OLED: “Duplicate Found ID: 1001”.
3. **Add Admin**:
   - Log in to `/admin`, add admin with `fingerprintID: 1001` in AdminForm.
   - Verify in Admins List.

### Room Management Testing
1. **Create Room**:
   - In Admin Dashboard, create ROOM_101, assign admin (ID 1001).
   - Verify in RoomList and MongoDB.
2. **Edit/Delete Room**:
   - Edit ROOM_101’s duration, verify update.
   - Delete ROOM_101, verify removal.

### Status Update Testing
1. **Setup**:
   - Load `veriloc.ino`, ensure backend is running.
   - Authorize admin (ID 1001) for ROOM_101.
2. **Test Cases**:
   - **Successful Update**: Scan enrolled finger, press Vacant, expect OLED: “Updated to Vacant”.
   - **Unknown Fingerprint**: Scan unenrolled finger, expect OLED: “Unknown Fingerprint”.
   - **Unauthorized Admin**: Scan authorized finger for another room, expect OLED: “Unauthorized”.
   - **Server Error**: Stop backend, scan finger, press button, expect OLED: “Server Error”.

---

## Debugging Tips
- **Hardware**:
  - **OLED Blank**: Check I2C connections (GPIO21/22), verify address (0x3C).
  - **Sensor Failure**: Ensure R307 TX/RX on GPIO16/17, 3.3V power.
  - **Button Issues**: Verify GPIO12/13, test with external pull-ups.
- **Backend**:
  - Check logs for `fingerprintID` mismatches or authorization errors.
  - Verify MongoDB connection and `unique: true` constraints.
- **Frontend**:
  - Ensure JWT is stored and sent in API headers.
  - Check Tailwind CSS for responsive issues.
- **General**:
  - Use Serial Monitor for hardware logs.
  - Inspect MongoDB (Atlas or local) for data consistency.

---

## Folder Structure
```
veriloc/
├── hardware/
│   ├── enroll_admin.ino
│   └── veriloc.ino
├── server/
│   ├── models/
│   │   ├── Admin.js
│   │   └── Room.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── rooms.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── server.js
│   └── .env
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Home.js
│   │   │   ├── RoomList.js
│   │   │   ├── OccupancyGraph.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── AdminForm.js
│   │   │   └── RoomForm.js
│   │   ├── App.js
│   │   └── index.css
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## Dependencies
- **Hardware**: Arduino IDE, ESP32 board support, Adafruit_Fingerprint, Adafruit_GFX, Adafruit_SSD1306.
- **Backend**: express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv.
- **Frontend**: react, axios, react-router-dom, chart.js, react-chartjs-2, tailwindcss.

---

## Future Enhancements
- Add buzzer/LED for hardware feedback.
- Implement real-time WebSocket updates for RoomList.
- Deploy backend to Heroku and frontend to Vercel with HTTPS.
- Add admin roles (e.g., limited-access admins).
- Support multiple R307 sensors with synchronized templates.

---

## License
MIT License. See `LICENSE` file for details.

---

This README provides a clear, detailed guide to understanding and setting up the **VERILOC** system. If you need further customization (e.g., specific UI styling, additional hardware features, or deployment instructions), let me know!