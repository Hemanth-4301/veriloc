# VERILOC - Classroom Occupancy Monitoring System

A full-stack web application built with the MERN stack for real-time classroom occupancy monitoring with IoT integration.

## 🚀 Features

- **Real-time Room Monitoring**: Track classroom occupancy status in real-time
- **IoT Hardware Integration**: Support for fingerprint sensors and hardware updates
- **Admin Management**: Super admin can manage other admins and room assignments
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Authentication**: JWT-based secure authentication system
- **Analytics**: Visual charts showing occupancy statistics
- **Dark Mode**: Built-in dark mode support

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend

- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd veriloc
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your configuration
MONGODB_URI=mongodb://localhost:27017/veriloc
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Database Setup

```bash
# Start MongoDB (if not running)
mongod

# Seed the database with sample data
npm run seed
```

### 5. Start the Application

#### Development Mode

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

#### Production Mode

```bash
# Backend
npm start

# Frontend
cd frontend
npm run build
# Serve the build folder with a static server
```

## 🔧 API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /login` - Admin login
- `POST /register` - Create new admin (Super admin only)
- `GET /admins` - List all admins (Super admin only)
- `PUT /admins/:id` - Update admin (Super admin only)
- `DELETE /admins/:id` - Delete admin (Super admin only)
- `GET /me` - Get current admin info

### Room Routes (`/api/rooms`)

- `GET /` - List rooms with optional filters
- `POST /` - Create room (Protected)
- `PUT /:id` - Update room (Protected)
- `DELETE /:id` - Delete room (Protected)
- `POST /update` - Update room status from hardware (IoT)
- `GET /occupancy` - Get occupancy statistics

## 🔐 Default Credentials

After seeding the database, you can use these credentials:

### Super Admin

- **Username**: `superadmin`
- **Password**: `admin123`
- **Fingerprint ID**: `1000`

### Sample Admins

- **Username**: `john_doe` | **Password**: `password123` | **Fingerprint ID**: `1001`
- **Username**: `jane_smith` | **Password**: `password123` | **Fingerprint ID**: `1002`
- **Username**: `mike_wilson` | **Password**: `password123` | **Fingerprint ID**: `1003`

## 🔌 Hardware Integration

The system supports IoT hardware integration for real-time status updates:

### Hardware API Endpoint

```
POST /api/rooms/update
```

### Request Body

```json
{
  "roomNumber": "R101",
  "status": "Occupied",
  "fingerprintID": 1001
}
```

### Response

```json
{
  "message": "Room status updated successfully",
  "room": {
    "roomNumber": "R101",
    "status": "Occupied",
    "timestamp": "2023-12-01T10:30:00.000Z"
  }
}
```

### Hardware Setup Instructions

1. **Fingerprint Sensor Setup**:

   - Use R307 fingerprint sensor
   - Connect to your IoT device
   - Enroll fingerprints and note the 4-digit IDs displayed on OLED

2. **API Integration**:
   - Send POST requests to `/api/rooms/update`
   - Include room number, status, and fingerprint ID
   - System validates fingerprint ID against authorized admins

## 📱 User Interface

### Student View (Homepage)

- View all classroom statuses
- Filter by day, time slot, room number, and status
- Interactive occupancy charts
- Real-time updates

### Admin Dashboard

- **Admins Tab**: Manage admin accounts (Super admin only)
- **Rooms Tab**: Create and manage rooms
- **Analytics Tab**: View occupancy statistics
- **Settings Tab**: Hardware integration information

## 🎨 Design Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes
- **Modern UI**: Gradient backgrounds, glass effects, smooth animations
- **Interactive Charts**: Real-time data visualization
- **Mobile-First**: Optimized for mobile devices

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Protected routes
- Admin authorization checks

## 📊 Database Schema

### Admin Model

```javascript
{
  username: String (required, unique),
  password: String (required, hashed),
  email: String (required, unique),
  fingerprintID: Number (required, unique, 1000-9999),
  isSuperAdmin: Boolean (default: false)
}
```

### Room Model

```javascript
{
  roomNumber: String (required, unique),
  day: String (required),
  duration: String (required),
  status: String (enum: ['Vacant', 'Occupied']),
  authorizedAdmins: [ObjectId] (references to Admin),
  timestamp: Date (default: now)
}
```

## 🚀 Deployment

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/veriloc
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=production
```

### Production Build

```bash
# Backend
npm start

# Frontend
cd frontend
npm run build
```

### Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Updates

- Real-time room status updates
- Mobile-responsive design
- Dark mode support
- Hardware integration
- Analytics dashboard
- Admin management system

---

**VERILOC** - Smart Classroom Occupancy Monitoring System
Built with ❤️ using the MERN stack
