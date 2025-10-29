const express = require("express");
const Admin = require("../models/Admin");
const Activity = require("../models/Activity");
const { authenticateToken } = require("../middleware/auth");
const PDFDocument = require("pdfkit");

const router = express.Router();

// GET /api/attendance - Get faculty attendance for a specific date
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // Parse the date
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all admins (faculty)
    const allAdmins = await Admin.find({ isSuperAdmin: false }).select(
      "username email fingerprintID"
    );

    // Get activities for the specified date (room-related activities indicate presence)
    const activities = await Activity.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      type: {
        $in: [
          "room_created",
          "room_updated",
          "room_deleted",
          "room_status_changed",
        ],
      },
      adminId: { $ne: null },
    })
      .populate("adminId", "username email fingerprintID")
      .sort({ createdAt: 1 });

    // Create a map of admin IDs who were present
    const presentAdminIds = new Set();
    const adminActivities = {};

    activities.forEach((activity) => {
      if (activity.adminId) {
        const adminIdStr = activity.adminId._id.toString();
        presentAdminIds.add(adminIdStr);

        if (!adminActivities[adminIdStr]) {
          adminActivities[adminIdStr] = {
            firstActivity: activity.createdAt,
            lastActivity: activity.createdAt,
            activityCount: 0,
          };
        }

        adminActivities[adminIdStr].lastActivity = activity.createdAt;
        adminActivities[adminIdStr].activityCount++;
      }
    });

    // Build attendance records
    const attendanceRecords = allAdmins.map((admin) => {
      const adminIdStr = admin._id.toString();
      const isPresent = presentAdminIds.has(adminIdStr);

      return {
        adminId: admin._id,
        username: admin.username,
        email: admin.email,
        fingerprintID: admin.fingerprintID,
        status: isPresent ? "Present" : "Absent",
        activityCount: isPresent
          ? adminActivities[adminIdStr].activityCount
          : 0,
        firstActivity: isPresent
          ? adminActivities[adminIdStr].firstActivity
          : null,
        lastActivity: isPresent
          ? adminActivities[adminIdStr].lastActivity
          : null,
      };
    });

    // Sort by username
    attendanceRecords.sort((a, b) => a.username.localeCompare(b.username));

    // Calculate statistics
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((r) => r.status === "Present").length,
      absent: attendanceRecords.filter((r) => r.status === "Absent").length,
      presentPercentage: (
        (attendanceRecords.filter((r) => r.status === "Present").length /
          attendanceRecords.length) *
        100
      ).toFixed(2),
    };

    res.json({
      date: selectedDate,
      attendance: attendanceRecords,
      stats,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

// GET /api/attendance/export-pdf - Export attendance as PDF
router.get("/export-pdf", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    // Parse the date
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all admins (faculty)
    const allAdmins = await Admin.find({ isSuperAdmin: false }).select(
      "username email fingerprintID"
    );

    // Get activities for the specified date
    const activities = await Activity.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      type: {
        $in: [
          "room_created",
          "room_updated",
          "room_deleted",
          "room_status_changed",
        ],
      },
      adminId: { $ne: null },
    })
      .populate("adminId", "username email fingerprintID")
      .sort({ createdAt: 1 });

    // Create a map of admin IDs who were present
    const presentAdminIds = new Set();
    const adminActivities = {};

    activities.forEach((activity) => {
      if (activity.adminId) {
        const adminIdStr = activity.adminId._id.toString();
        presentAdminIds.add(adminIdStr);

        if (!adminActivities[adminIdStr]) {
          adminActivities[adminIdStr] = {
            firstActivity: activity.createdAt,
            lastActivity: activity.createdAt,
            activityCount: 0,
          };
        }

        adminActivities[adminIdStr].lastActivity = activity.createdAt;
        adminActivities[adminIdStr].activityCount++;
      }
    });

    // Build attendance records
    const attendanceRecords = allAdmins.map((admin) => {
      const adminIdStr = admin._id.toString();
      const isPresent = presentAdminIds.has(adminIdStr);

      return {
        username: admin.username,
        email: admin.email,
        fingerprintID: admin.fingerprintID,
        status: isPresent ? "Present" : "Absent",
        activityCount: isPresent
          ? adminActivities[adminIdStr].activityCount
          : 0,
        firstActivity: isPresent
          ? adminActivities[adminIdStr].firstActivity
          : null,
      };
    });

    // Sort by username
    attendanceRecords.sort((a, b) => a.username.localeCompare(b.username));

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=faculty-attendance-${
        selectedDate.toISOString().split("T")[0]
      }.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text("Faculty Attendance Report", { align: "center" });
    doc.moveDown();

    // Add date
    doc.fontSize(12).text(
      `Date: ${selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      { align: "center" }
    );
    doc.moveDown();

    // Add statistics
    const presentCount = attendanceRecords.filter(
      (r) => r.status === "Present"
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.status === "Absent"
    ).length;
    const totalCount = attendanceRecords.length;
    const percentage = ((presentCount / totalCount) * 100).toFixed(2);

    doc.fontSize(11).text(`Total Faculty: ${totalCount}`, { align: "center" });
    doc.text(
      `Present: ${presentCount} | Absent: ${absentCount} | Attendance: ${percentage}%`,
      { align: "center" }
    );
    doc.moveDown(2);

    // Add table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [40, 150, 200, 100];

    doc.fontSize(10).fillColor("#000");
    doc.rect(tableLeft, tableTop, 490, 25).fill("#e0e0e0");

    doc.fillColor("#000");
    doc.text("#", tableLeft + 5, tableTop + 8, { width: colWidths[0] });
    doc.text("Faculty Name", tableLeft + colWidths[0] + 5, tableTop + 8, {
      width: colWidths[1],
    });
    doc.text(
      "Email",
      tableLeft + colWidths[0] + colWidths[1] + 5,
      tableTop + 8,
      { width: colWidths[2] }
    );
    doc.text(
      "Status",
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5,
      tableTop + 8,
      { width: colWidths[3] }
    );

    // Add table rows
    let yPosition = tableTop + 30;
    attendanceRecords.forEach((record, index) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(tableLeft, yPosition - 5, 490, 25).fill("#f5f5f5");
      }

      // Set text color based on status
      const statusColor = record.status === "Present" ? "#10b981" : "#ef4444";

      doc.fillColor("#000");
      doc.fontSize(9);
      doc.text(String(index + 1), tableLeft + 5, yPosition, {
        width: colWidths[0],
      });
      doc.text(record.username, tableLeft + colWidths[0] + 5, yPosition, {
        width: colWidths[1],
      });
      doc.text(
        record.email,
        tableLeft + colWidths[0] + colWidths[1] + 5,
        yPosition,
        { width: colWidths[2] }
      );

      doc.fillColor(statusColor);
      doc.text(
        record.status,
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5,
        yPosition,
        { width: colWidths[3] }
      );

      yPosition += 25;
    });

    // Add footer
    doc.moveDown(3);
    doc
      .fontSize(8)
      .fillColor("#666")
      .text(
        `Generated on ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Export PDF error:", error);
    res.status(500).json({ message: "Failed to export attendance" });
  }
});

module.exports = router;
