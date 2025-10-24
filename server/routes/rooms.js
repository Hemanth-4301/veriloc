const express = require("express");
const { body, validationResult } = require("express-validator");
const Room = require("../models/Room");
const Admin = require("../models/Admin");
const ActivityService = require("../services/activityService");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Helper to normalize fields and avoid false duplicates
function normalizeRoomPayload(payload) {
  const trim = (v) => (typeof v === "string" ? v.trim() : v);
  const toTitle = (v) =>
    typeof v === "string" && v.length
      ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
      : v;

  const normalized = { ...payload };
  if (normalized.roomNumber)
    normalized.roomNumber = trim(normalized.roomNumber).toUpperCase();
  if (normalized.day) normalized.day = toTitle(trim(normalized.day));
  if (normalized.duration) normalized.duration = trim(normalized.duration);
  return normalized;
}

// Parse a duration string like "9:00-10:00" into start and end minutes
// Returns { start: Number, end: Number } where values are minutes since 00:00.
// If end is less than or equal to start (e.g., "12:30-1:30"), assume end is PM and add 12 hours.
function parseDurationToMinutes(duration) {
  if (!duration || typeof duration !== "string") return null;
  const parts = duration.split("-");
  if (parts.length !== 2) return null;
  const parsePart = (p) => {
    const [hStr, mStr] = p.split(":").map((s) => s.trim());
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const start = parsePart(parts[0]);
  const end = parsePart(parts[1]);
  if (start === null || end === null) return null;

  // If end is less or equal to start, assume the end is later in the day (e.g., 12:30-1:30 -> 12:30-13:30)
  const adjustedEnd = end <= start ? end + 12 * 60 : end;
  return { start, end: adjustedEnd };
}

// Check if two time ranges overlap. Each range is { start, end } in minutes.
function rangesOverlap(a, b) {
  if (!a || !b) return false;
  return a.start < b.end && b.start < a.end;
}

// GET /api/rooms - List rooms with optional filters
router.get("/", async (req, res) => {
  try {
    const { day, duration, roomNumber, status } = req.query;
    const filter = {};

    if (day) filter.day = day;
    if (duration) filter.duration = duration;
    if (roomNumber) filter.roomNumber = new RegExp(roomNumber, "i");
    if (status) filter.status = status;

    const rooms = await Room.find(filter)
      .populate("authorizedAdmins", "username fingerprintID")
      .sort({ roomNumber: 1, day: 1, duration: 1 });

    res.json({ rooms });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
});

// POST /api/rooms - Create room (Protected)
router.post(
  "/",
  [
    authenticateToken,
    body("roomNumber").notEmpty().withMessage("Room number is required"),
    body("day")
      .isIn([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ])
      .withMessage("Valid day is required"),
    body("duration")
      .matches(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/)
      .withMessage("Duration must be in format HH:MM-HH:MM"),
    body("status").optional().isIn(["Vacant", "Occupied"]),
    // authorizedAdmins is optional
    body("authorizedAdmins").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        roomNumber,
        day,
        duration,
        status = "Vacant",
        authorizedAdmins = [],
      } = normalizeRoomPayload(req.body);

      // Check if room conflicts with existing rooms (same roomNumber and day)
      const normalizedRoom = {
        roomNumber: roomNumber.trim().toUpperCase(),
        day: day.trim(),
        duration: duration.trim(),
      };

      // Parse new duration
      const newRange = parseDurationToMinutes(normalizedRoom.duration);
      if (!newRange) {
        return res.status(400).json({ message: "Invalid duration format" });
      }

      // Find existing entries for the same room number and day
      const existingRooms = await Room.find({
        roomNumber: normalizedRoom.roomNumber,
        day: normalizedRoom.day,
      });

      // If any existing duration overlaps with the new one, reject
      for (const r of existingRooms) {
        const existingRange = parseDurationToMinutes(r.duration);
        if (rangesOverlap(newRange, existingRange)) {
          return res.status(400).json({
            message: `Time slot conflict: Room ${normalizedRoom.roomNumber} on ${normalizedRoom.day} already has a booking during ${r.duration} that overlaps with your requested time ${normalizedRoom.duration}`,
            existingRoom: true,
            roomNumber: normalizedRoom.roomNumber,
            day: normalizedRoom.day,
            duration: r.duration,
          });
        }
      }

      // If provided, verify all authorized admins exist
      if (authorizedAdmins && authorizedAdmins.length > 0) {
        const admins = await Admin.find({ _id: { $in: authorizedAdmins } });
        if (admins.length !== authorizedAdmins.length) {
          return res
            .status(400)
            .json({ message: "One or more authorized admins not found" });
        }
      }

      const room = new Room({
        roomNumber,
        day,
        duration,
        status,
        authorizedAdmins,
      });

      await room.save();
      await room.populate("authorizedAdmins", "username fingerprintID");

      // Log room creation activity
      await ActivityService.logRoomCreated(
        req.admin._id,
        roomNumber,
        req.admin.username
      );

      res.status(201).json({
        message: "Room created successfully",
        room,
      });
    } catch (error) {
      console.error("Create room error:", error);
      if (error.code === 11000) {
        return res.status(400).json({ message: "This exact room configuration already exists. Please check room number, day, and time slot." });
      }
      res.status(500).json({ message: "Room creation failed" });
    }
  }
);

// PUT /api/rooms/:id - Update room (Protected)
router.put(
  "/:id",
  [
    authenticateToken,
    body("roomNumber").optional().notEmpty(),
    body("day")
      .optional()
      .isIn([
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ]),
    body("duration")
      .optional()
      .matches(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/),
    body("status").optional().isIn(["Vacant", "Occupied"]),
    // authorizedAdmins optional; allow empty to clear
    body("authorizedAdmins").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = normalizeRoomPayload(req.body);

      // Don't update authorizedAdmins if not explicitly provided
      if (updateData.authorizedAdmins === undefined) {
        delete updateData.authorizedAdmins;
      }

      // Check if the new room data would conflict with existing rooms (use overlap detection)
      if (updateData.roomNumber || updateData.day || updateData.duration) {
        // Build the candidate values falling back to existing values when not provided
        const roomToCheck = {
          roomNumber: updateData.roomNumber || undefined,
          day: updateData.day || undefined,
          duration: updateData.duration || undefined,
        };

        // If any of them are undefined, fetch the current room to complete the values
        const currentRoom = await Room.findById(id);
        if (!currentRoom) {
          return res.status(404).json({ message: "Room not found" });
        }

        const finalRoom = {
          roomNumber: (roomToCheck.roomNumber || currentRoom.roomNumber)
            .trim()
            .toUpperCase(),
          day: (roomToCheck.day || currentRoom.day).trim(),
          duration: (roomToCheck.duration || currentRoom.duration).trim(),
        };

        const newRange = parseDurationToMinutes(finalRoom.duration);
        if (!newRange) {
          return res.status(400).json({ message: "Invalid duration format" });
        }

        // Find other existing entries for the same room number and day (exclude this id)
        const existingRooms = await Room.find({
          _id: { $ne: id },
          roomNumber: finalRoom.roomNumber,
          day: finalRoom.day,
        });

        for (const r of existingRooms) {
          const existingRange = parseDurationToMinutes(r.duration);
          if (rangesOverlap(newRange, existingRange)) {
            return res.status(400).json({
              message: `Time slot conflict: Room ${finalRoom.roomNumber} on ${finalRoom.day} already has a booking during ${r.duration} that overlaps with your requested time ${finalRoom.duration}`,
              existingRoom: true,
              roomNumber: finalRoom.roomNumber,
              day: finalRoom.day,
              duration: r.duration,
            });
          }
        }
      }

      const room = await Room.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate("authorizedAdmins", "username fingerprintID");

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Log room update activity
      await ActivityService.logRoomUpdated(
        req.admin._id,
        room.roomNumber,
        req.admin.username,
        updateData
      );

      res.json({
        message: "Room updated successfully",
        room,
      });
    } catch (error) {
      console.error("Update room error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "This exact room configuration already exists. Please check room number, day, and time slot." });
      }
      res.status(500).json({ message: "Update failed" });
    }
  }
);

// DELETE /api/rooms/:id - Delete room (Protected)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Log room deletion activity
    await ActivityService.logRoomDeleted(
      req.admin._id,
      room.roomNumber,
      req.admin.username
    );

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

// POST /api/rooms/update - Update room status from hardware (IoT)
router.post(
  "/update",
  [
    body("roomNumber").notEmpty().withMessage("Room number is required"),
    body("status")
      .isIn(["Vacant", "Occupied"])
      .withMessage("Status must be Vacant or Occupied"),
    body("fingerprintID")
      .isInt({ min: 1000, max: 9999 })
      .withMessage("Valid fingerprint ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { roomNumber, status, fingerprintID } = req.body;

      // Find admin by fingerprint ID
      const admin = await Admin.findOne({ fingerprintID });
      if (!admin) {
        console.log(
          `Hardware update attempt with invalid fingerprint ID: ${fingerprintID}`
        );
        return res.status(403).json({ message: "Unauthorized fingerprint ID" });
      }

      // Find room by room number
      const room = await Room.findOne({ roomNumber });
      if (!room) {
        console.log(
          `Hardware update attempt for non-existent room: ${roomNumber}`
        );
        return res.status(404).json({ message: "Room not found" });
      }

      // Check if admin is authorized for this room
      if (!room.isAdminAuthorized(admin._id)) {
        console.log(
          `Unauthorized hardware update attempt: Admin ${admin.username} (${fingerprintID}) for room ${roomNumber}`
        );
        return res
          .status(403)
          .json({ message: "Admin not authorized for this room" });
      }

      // Store old status for activity logging
      const oldStatus = room.status;

      // Update room status
      room.status = status;
      room.timestamp = new Date();
      await room.save();

      // Log room status change activity
      await ActivityService.logRoomStatusChanged(
        admin._id,
        roomNumber,
        oldStatus,
        status,
        admin.username
      );

      console.log(
        `Room ${roomNumber} status updated to ${status} by admin ${admin.username} (${fingerprintID})`
      );

      res.json({
        message: "Room status updated successfully",
        room: {
          roomNumber: room.roomNumber,
          status: room.status,
          timestamp: room.timestamp,
        },
      });
    } catch (error) {
      console.error("Hardware update error:", error);
      res.status(500).json({ message: "Status update failed" });
    }
  }
);

// GET /api/rooms/occupancy - Get occupancy statistics
router.get("/occupancy", async (req, res) => {
  try {
    const { day } = req.query;
    const filter = day ? { day } : {};

    const occupancyStats = await Room.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$day",
          total: { $sum: 1 },
          vacant: {
            $sum: { $cond: [{ $eq: ["$status", "Vacant"] }, 1, 0] },
          },
          occupied: {
            $sum: { $cond: [{ $eq: ["$status", "Occupied"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ occupancyStats });
  } catch (error) {
    console.error("Get occupancy stats error:", error);
    res.status(500).json({ message: "Failed to fetch occupancy statistics" });
  }
});

// GET /api/rooms/analytics - Get analytics data for charts
router.get("/analytics", async (req, res) => {
  try {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const analyticsData = await Room.aggregate([
      {
        $group: {
          _id: "$day",
          total: { $sum: 1 },
          vacant: {
            $sum: { $cond: [{ $eq: ["$status", "Vacant"] }, 1, 0] },
          },
          occupied: {
            $sum: { $cond: [{ $eq: ["$status", "Occupied"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Ensure all days are represented, even if no data exists
    const result = days.map((day) => {
      const dayData = analyticsData.find((item) => item._id === day);
      return {
        _id: day,
        total: dayData ? dayData.total : 0,
        vacant: dayData ? dayData.vacant : 0,
        occupied: dayData ? dayData.occupied : 0,
      };
    });

    res.json({ analyticsData: result });
  } catch (error) {
    console.error("Get analytics data error:", error);
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
});

module.exports = router;
