const express = require("express");
const { body, validationResult } = require("express-validator");
const Room = require("../models/Room");
const Admin = require("../models/Admin");
const ActivityService = require("../services/activityService");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const geminiService = require("../services/geminiService");
const logger = require("../utils/logger");

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
        return res.status(400).json({
          message:
            "This exact room configuration already exists. Please check room number, day, and time slot.",
        });
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
        return res.status(400).json({
          message:
            "This exact room configuration already exists. Please check room number, day, and time slot.",
        });
      }
      res.status(500).json({ message: "Update failed" });
    }
  }
);

// DELETE /api/rooms/clear-all - Clear all rooms from database (Protected - Super Admin only)
router.delete("/clear-all", authenticateToken, async (req, res) => {
  try {
    // Check if user is super admin
    const admin = await Admin.findById(req.admin.id);
    if (!admin || !admin.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Super admin only." });
    }

    // Delete all rooms
    const result = await Room.deleteMany({});

    // Log activity
    await ActivityService.logActivity(
      "room_clear_all",
      `Cleared all rooms from database (${result.deletedCount} rooms deleted)`,
      req.admin.id
    );

    res.json({
      message: "All rooms cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear all rooms error:", error);
    res.status(500).json({ message: "Failed to clear rooms" });
  }
});

// POST /api/rooms/make-all-vacant - Make all room combinations vacant (Protected - Super Admin only)
router.post("/make-all-vacant", authenticateToken, async (req, res) => {
  try {
    // Check if user is super admin
    const admin = await Admin.findById(req.admin.id);
    if (!admin || !admin.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Super admin only." });
    }

    const { roomNumbers, days, timeSlots } = req.body;

    // Validate input
    if (!Array.isArray(roomNumbers) || roomNumbers.length === 0) {
      return res
        .status(400)
        .json({ message: "Room numbers array is required" });
    }
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ message: "Days array is required" });
    }
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ message: "Time slots array is required" });
    }

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const invalidDays = days.filter((day) => !validDays.includes(day));
    if (invalidDays.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid days: ${invalidDays.join(", ")}` });
    }

    // Validate duration format
    const durationRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
    const invalidSlots = timeSlots.filter((slot) => !durationRegex.test(slot));
    if (invalidSlots.length > 0) {
      return res.status(400).json({
        message: `Invalid time slot format: ${invalidSlots.join(", ")}`,
      });
    }

    const results = {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // Create all combinations
    for (const roomNumber of roomNumbers) {
      for (const day of days) {
        for (const duration of timeSlots) {
          results.total++;
          try {
            // Check if room with this combination already exists
            const existingRoom = await Room.findOne({
              roomNumber: roomNumber.trim().toUpperCase(),
              day,
              duration: duration.trim(),
            });

            if (existingRoom) {
              // Update to vacant if it exists
              existingRoom.status = "Vacant";
              existingRoom.authorizedAdmins = [req.admin.id];
              await existingRoom.save();
              results.updated++;
            } else {
              // Create new room entry
              await Room.create({
                roomNumber: roomNumber.trim().toUpperCase(),
                day,
                duration: duration.trim(),
                status: "Vacant",
                authorizedAdmins: [req.admin.id],
              });
              results.created++;
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              room: roomNumber,
              day,
              duration,
              error: error.message,
            });
          }
        }
      }
    }

    // Log activity
    await ActivityService.logActivity(
      "rooms_make_all_vacant",
      `Made all room combinations vacant (${results.created} created, ${results.updated} updated, ${results.failed} failed)`,
      req.admin.id
    );

    res.json({
      message: `Successfully processed ${results.total} room combinations`,
      results,
    });
  } catch (error) {
    console.error("Make all vacant error:", error);
    res.status(500).json({ message: "Failed to make rooms vacant" });
  }
});

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

// Helper function to get current time slot based on current time (IST)
function getCurrentTimeSlot() {
  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const utcTime = now.getTime();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(utcTime + istOffset);

  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Define time slots with their ranges
  const timeSlots = [
    { duration: "9:00-10:00", start: 9 * 60, end: 10 * 60 },
    { duration: "10:00-11:00", start: 10 * 60, end: 11 * 60 },
    { duration: "11:30-12:30", start: 11 * 60 + 30, end: 12 * 60 + 30 },
    { duration: "12:30-1:30", start: 12 * 60 + 30, end: 13 * 60 + 30 },
    { duration: "2:30-3:30", start: 14 * 60 + 30, end: 15 * 60 + 30 },
    { duration: "3:30-4:30", start: 15 * 60 + 30, end: 16 * 60 + 30 },
  ];

  // Find the time slot that contains the current time
  for (const slot of timeSlots) {
    if (currentMinutes >= slot.start && currentMinutes < slot.end) {
      return slot.duration;
    }
  }

  return null; // Current time doesn't fall in any defined slot
}

// Helper function to get current day name (IST)
function getCurrentDay() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const utcTime = now.getTime();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(utcTime + istOffset);

  return days[istTime.getUTCDay()];
}

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

      // Get current day and time slot
      const currentDay = getCurrentDay();
      const currentTimeSlot = getCurrentTimeSlot();

      if (!currentTimeSlot) {
        // Get IST time for display
        const now = new Date();
        const utcTime = now.getTime();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(utcTime + istOffset);

        const hours = String(istTime.getUTCHours()).padStart(2, "0");
        const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");
        const currentTime = `${hours}:${minutes}`;

        console.log(
          `Hardware update attempt outside defined time slots (IST time: ${currentTime})`
        );

        return res.status(400).json({
          message: `Current time (${currentTime} IST) is outside defined time slots`,
          currentTime: currentTime,
          timezone: "IST (UTC+5:30)",
          validSlots: [
            "9:00-10:00",
            "10:00-11:00",
            "11:30-12:30",
            "12:30-1:30",
            "2:30-3:30",
            "3:30-4:30",
          ],
        });
      }

      console.log(
        `Hardware update request: Room ${roomNumber}, Day: ${currentDay}, Time slot: ${currentTimeSlot}`
      );

      // Find room by room number, current day, and current time slot
      const room = await Room.findOne({
        roomNumber,
        day: currentDay,
        duration: currentTimeSlot,
      });

      if (!room) {
        console.log(
          `Hardware update attempt for non-existent room configuration: ${roomNumber}, ${currentDay}, ${currentTimeSlot}`
        );

        // Check if room exists for this room number at all
        const anyRoomEntry = await Room.findOne({ roomNumber });

        if (!anyRoomEntry) {
          return res.status(404).json({
            message: `Room ${roomNumber} does not exist in the system. Please create room entries first.`,
            roomNumber,
            day: currentDay,
            timeSlot: currentTimeSlot,
            hint: "Create room entries in the admin dashboard for all days and time slots",
          });
        } else {
          return res.status(404).json({
            message: `Room ${roomNumber} exists but has no entry for ${currentDay} at ${currentTimeSlot}`,
            roomNumber,
            day: currentDay,
            timeSlot: currentTimeSlot,
            hint: `Create a room entry for Room ${roomNumber} on ${currentDay} during ${currentTimeSlot}`,
          });
        }
      }

      // Store old status for activity logging
      const oldStatus = room.status;

      // Update room status
      room.status = status;
      room.timestamp = new Date();
      await room.save();

      // Log room status change activity with hardware source
      await ActivityService.logRoomStatusChanged(
        admin._id,
        roomNumber,
        oldStatus,
        status,
        admin.username,
        "hardware"
      );

      console.log(
        `Room ${roomNumber} (${currentDay}, ${currentTimeSlot}) status updated to ${status} by admin ${admin.username} (${fingerprintID})`
      );

      res.json({
        message: "Room status updated successfully",
        room: {
          roomNumber: room.roomNumber,
          day: currentDay,
          duration: currentTimeSlot,
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

// POST /api/rooms/upload - Upload file and extract room data (Protected)
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    logger.separator();
    logger.log("� UPLOAD ROUTE CALLED");
    logger.log(`User: ${req.admin?.username || "unknown"}`);

    try {
      if (!req.file) {
        logger.log("❌ No file in request");
        return res.status(400).json({
          message: "No file uploaded",
          error: "No file found in the request",
        });
      }

      logger.log("📤 File received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Validate file type - only support PDF and images
      const supportedMimeTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];

      if (!supportedMimeTypes.includes(req.file.mimetype)) {
        logger.log("❌ Unsupported file type:", req.file.mimetype);
        return res.status(400).json({
          message:
            "Unsupported file type. Please upload PDF or PNG/JPEG images.",
          supportedTypes: supportedMimeTypes,
          error: `File type '${req.file.mimetype}' is not supported`,
        });
      }

      logger.log("✅ File type validated");

      // Parse file directly using Gemini 1.5 Flash (no intermediate text extraction)
      let roomsData;
      try {
        logger.log("🤖 Calling geminiService.parseRoomDataFromFile...");
        roomsData = await geminiService.parseRoomDataFromFile(
          req.file.buffer,
          req.file.mimetype
        );
        logger.log(
          `✅ Gemini returned ${roomsData ? roomsData.length : 0} rooms`
        );
      } catch (error) {
        logger.error("❌ Gemini parsing failed:", error.message);
        logger.error("Full error:", error);
        return res.status(400).json({
          message: "Failed to parse room data with AI",
          error: error.message,
          details:
            "The AI service could not extract room data from the uploaded file. Please ensure the file contains a clear timetable.",
        });
      }

      if (!roomsData || roomsData.length === 0) {
        logger.log("⚠️  No valid room data found");
        return res.status(400).json({
          message:
            "No valid room data found in the file. Please ensure the file contains a timetable with room numbers, days, and time slots.",
        });
      }

      // Validate and create rooms
      const results = {
        successful: [],
        failed: [],
        total: roomsData.length,
      };

      for (const roomData of roomsData) {
        try {
          // Parse duration to check for conflicts
          const newRange = parseDurationToMinutes(roomData.duration);
          if (!newRange) {
            results.failed.push({
              ...roomData,
              error: "Invalid duration format",
            });
            continue;
          }

          // Check for time slot conflicts
          const existingRooms = await Room.find({
            roomNumber: roomData.roomNumber,
            day: roomData.day,
          });

          let hasConflict = false;
          let conflictDetails = null;

          for (const existingRoom of existingRooms) {
            const existingRange = parseDurationToMinutes(existingRoom.duration);
            if (rangesOverlap(newRange, existingRange)) {
              hasConflict = true;
              conflictDetails = {
                existingDuration: existingRoom.duration,
              };
              break;
            }
          }

          if (hasConflict) {
            results.failed.push({
              ...roomData,
              error: `Time slot conflict with existing booking at ${conflictDetails.existingDuration}`,
            });
            continue;
          }

          // Create the room
          const room = new Room({
            roomNumber: roomData.roomNumber,
            day: roomData.day,
            duration: roomData.duration,
            status: roomData.status,
            authorizedAdmins: [],
          });

          await room.save();

          // Log room creation activity
          await ActivityService.logRoomCreated(
            req.admin._id,
            roomData.roomNumber,
            req.admin.username
          );

          results.successful.push({
            ...roomData,
            _id: room._id,
          });
        } catch (error) {
          console.error("Error creating room:", error);
          results.failed.push({
            ...roomData,
            error: error.message || "Unknown error",
          });
        }
      }

      logger.log(
        `💾 Processing complete: ${results.successful.length} successful, ${results.failed.length} failed`
      );
      logger.separator();

      // Return comprehensive results
      res.status(200).json({
        message: `Processed ${results.total} rooms: ${results.successful.length} created, ${results.failed.length} failed`,
        results,
      });
    } catch (error) {
      logger.error("Fatal error during upload", error);
      logger.separator();
      res.status(500).json({
        message: "File upload and processing failed",
        error: error.message,
      });
    }
  }
);

module.exports = router;
