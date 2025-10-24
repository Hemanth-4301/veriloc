const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Activity type is required"],
      enum: [
        "admin_login",
        "admin_logout", 
        "room_created",
        "room_updated",
        "room_deleted",
        "room_status_changed",
        "admin_created",
        "admin_updated",
        "admin_deleted",
        "system"
      ],
    },
    message: {
      type: String,
      required: [true, "Activity message is required"],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false, // Some activities might not be tied to a specific admin
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: false, // Some activities might not be tied to a specific room
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ adminId: 1 });

module.exports = mongoose.model("Activity", activitySchema);
