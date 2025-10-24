const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Room = require("../models/Room");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/veriloc";

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Clear existing data
    await Admin.deleteMany({});
    await Room.deleteMany({});
    console.log("Cleared existing data");

    // Create super admin
    const superAdmin = new Admin({
      username: "superadmin",
      password: "admin123",
      email: "superadmin@veriloc.com",
      fingerprintID: 1000,
      isSuperAdmin: true,
    });
    await superAdmin.save();
    console.log("Created super admin");

    // Create sample admins
    const admin1 = new Admin({
      username: "john_doe",
      password: "password123",
      email: "john@veriloc.com",
      fingerprintID: 1001,
    });

    const admin2 = new Admin({
      username: "jane_smith",
      password: "password123",
      email: "jane@veriloc.com",
      fingerprintID: 1002,
    });

    const admin3 = new Admin({
      username: "mike_wilson",
      password: "password123",
      email: "mike@veriloc.com",
      fingerprintID: 1003,
    });

    await Promise.all([admin1.save(), admin2.save(), admin3.save()]);
    console.log("Created sample admins");

    // Create sample rooms
    const rooms = [
      {
        roomNumber: "R101",
        day: "Monday",
        duration: "09:00-10:00",
        status: "Vacant",
        authorizedAdmins: [admin1._id, admin2._id],
      },
      {
        roomNumber: "R101",
        day: "Monday",
        duration: "10:00-11:00",
        status: "Occupied",
        authorizedAdmins: [admin1._id, admin2._id],
      },
      {
        roomNumber: "R101",
        day: "Tuesday",
        duration: "09:00-10:00",
        status: "Vacant",
        authorizedAdmins: [admin1._id, admin3._id],
      },
      {
        roomNumber: "R102",
        day: "Monday",
        duration: "09:00-10:00",
        status: "Vacant",
        authorizedAdmins: [admin2._id, admin3._id],
      },
      {
        roomNumber: "R102",
        day: "Tuesday",
        duration: "10:00-11:00",
        status: "Occupied",
        authorizedAdmins: [admin2._id, admin3._id],
      },
      {
        roomNumber: "R103",
        day: "Wednesday",
        duration: "14:00-15:00",
        status: "Vacant",
        authorizedAdmins: [admin1._id, admin3._id],
      },
      {
        roomNumber: "R201",
        day: "Thursday",
        duration: "11:00-12:00",
        status: "Occupied",
        authorizedAdmins: [admin1._id, admin2._id, admin3._id],
      },
      {
        roomNumber: "R201",
        day: "Friday",
        duration: "09:00-10:00",
        status: "Vacant",
        authorizedAdmins: [admin1._id, admin2._id],
      },
    ];

    for (const roomData of rooms) {
      const room = new Room(roomData);
      await room.save();
    }

    console.log("Created sample rooms");

    // Populate rooms with admin details for display
    const populatedRooms = await Room.find({}).populate(
      "authorizedAdmins",
      "username fingerprintID"
    );

    console.log("\n=== SEED DATA SUMMARY ===");
    console.log("Super Admin:");
    console.log(`  Username: superadmin`);
    console.log(`  Password: admin123`);
    console.log(`  Fingerprint ID: 1000`);
    console.log(`  Email: superadmin@veriloc.com`);

    console.log("\nSample Admins:");
    console.log(`  john_doe (1001) - password123`);
    console.log(`  jane_smith (1002) - password123`);
    console.log(`  mike_wilson (1003) - password123`);

    console.log("\nSample Rooms:");
    populatedRooms.forEach((room) => {
      console.log(
        `  ${room.roomNumber} - ${room.day} ${room.duration} - ${room.status}`
      );
      console.log(
        `    Authorized: ${room.authorizedAdmins
          .map((a) => `${a.username}(${a.fingerprintID})`)
          .join(", ")}`
      );
    });

    console.log("\nDatabase seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
