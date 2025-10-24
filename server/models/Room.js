const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      uppercase: true,
    },
    day: {
      type: String,
      required: [true, "Day is required"],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
      match: [
        /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/,
        "Duration must be in format HH:MM-HH:MM",
      ],
    },
    status: {
      type: String,
      enum: ["Vacant", "Occupied"],
      default: "Vacant",
    },
    authorizedAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
// Use compound index for roomNumber+day+duration (not unique)
roomSchema.index({ roomNumber: 1, day: 1, duration: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ day: 1 });
// Ensure roomNumber by itself is NOT unique
roomSchema.index({ roomNumber: 1 }, { unique: false });

// Virtual for formatted duration
roomSchema.virtual("formattedDuration").get(function () {
  return this.duration;
});

// Method to check if admin is authorized for this room
roomSchema.methods.isAdminAuthorized = function (adminId) {
  return this.authorizedAdmins.some(
    (admin) => admin.toString() === adminId.toString()
  );
};

module.exports = mongoose.model("Room", roomSchema);
