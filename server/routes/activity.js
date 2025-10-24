const express = require("express");
const ActivityService = require("../services/activityService");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/admin/activity - Get recent activities
router.get("/activity", authenticateToken, async (req, res) => {
  try {
    const activities = await ActivityService.getRecentActivities(20);
    
    res.json({
      message: "Activities fetched successfully",
      activities,
    });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});

module.exports = router;
