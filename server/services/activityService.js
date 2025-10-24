const Activity = require("../models/Activity");

class ActivityService {
  static async logActivity(type, message, adminId = null, roomId = null, metadata = {}) {
    try {
      const activity = new Activity({
        type,
        message,
        adminId,
        roomId,
        metadata,
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw error to prevent breaking the main operation
    }
  }

  static async getRecentActivities(limit = 10) {
    try {
      const activities = await Activity.find({})
        .populate("adminId", "username")
        .populate("roomId", "roomNumber")
        .sort({ createdAt: -1 })
        .limit(limit);

      return activities;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  }

  static async logAdminLogin(adminId, username) {
    return this.logActivity(
      "admin_login",
      `${username} logged in`,
      adminId
    );
  }

  static async logAdminLogout(adminId, username) {
    return this.logActivity(
      "admin_logout", 
      `${username} logged out`,
      adminId
    );
  }

  static async logRoomCreated(adminId, roomNumber, adminUsername) {
    return this.logActivity(
      "room_created",
      `${adminUsername} created room ${roomNumber}`,
      adminId,
      null,
      { roomNumber }
    );
  }

  static async logRoomUpdated(adminId, roomNumber, adminUsername, changes) {
    return this.logActivity(
      "room_updated",
      `${adminUsername} updated room ${roomNumber}`,
      adminId,
      null,
      { roomNumber, changes }
    );
  }

  static async logRoomDeleted(adminId, roomNumber, adminUsername) {
    return this.logActivity(
      "room_deleted",
      `${adminUsername} deleted room ${roomNumber}`,
      adminId,
      null,
      { roomNumber }
    );
  }

  static async logRoomStatusChanged(adminId, roomNumber, oldStatus, newStatus, adminUsername) {
    return this.logActivity(
      "room_status_changed",
      `Room ${roomNumber} status changed from ${oldStatus} to ${newStatus} by ${adminUsername}`,
      adminId,
      null,
      { roomNumber, oldStatus, newStatus }
    );
  }

  static async logAdminCreated(adminId, newAdminUsername, adminUsername) {
    return this.logActivity(
      "admin_created",
      `${adminUsername} created admin ${newAdminUsername}`,
      adminId,
      null,
      { newAdminUsername }
    );
  }

  static async logAdminUpdated(adminId, updatedAdminUsername, adminUsername) {
    return this.logActivity(
      "admin_updated",
      `${adminUsername} updated admin ${updatedAdminUsername}`,
      adminId,
      null,
      { updatedAdminUsername }
    );
  }

  static async logAdminDeleted(adminId, deletedAdminUsername, adminUsername) {
    return this.logActivity(
      "admin_deleted",
      `${adminUsername} deleted admin ${deletedAdminUsername}`,
      adminId,
      null,
      { deletedAdminUsername }
    );
  }

  static async logSystemActivity(message, metadata = {}) {
    return this.logActivity(
      "system",
      message,
      null,
      null,
      metadata
    );
  }
}

module.exports = ActivityService;
