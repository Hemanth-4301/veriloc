const express = require("express");
const { body, validationResult } = require("express-validator");
const Admin = require("../models/Admin");
const ActivityService = require("../services/activityService");
const {
  authenticateToken,
  requireSuperAdmin,
  generateToken,
} = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
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

      const { username, password } = req.body;

      // Find admin by username
      const admin = await Admin.findOne({ username });
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(admin._id);

      // Log admin login activity
      await ActivityService.logAdminLogin(admin._id, admin.username);

      res.json({
        message: "Login successful",
        token,
        admin: admin.getPublicProfile(),
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  }
);

// POST /api/auth/register (Super admin only)
router.post(
  "/register",
  [
    authenticateToken,
    requireSuperAdmin,
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("fingerprintID")
      .isInt({ min: 1000, max: 9999 })
      .withMessage("Fingerprint ID must be between 1000-9999"),
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

      const { username, password, email, fingerprintID } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [{ username }, { email }, { fingerprintID }],
      });

      if (existingAdmin) {
        return res.status(400).json({
          message:
            "Admin with this username, email, or fingerprint ID already exists",
        });
      }

      // Create new admin
      const admin = new Admin({
        username,
        password,
        email,
        fingerprintID,
      });

      await admin.save();

      // Log admin creation activity
      await ActivityService.logAdminCreated(req.admin._id, admin.username, req.admin.username);

      res.status(201).json({
        message: "Admin created successfully",
        admin: admin.getPublicProfile(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "Admin with this information already exists" });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  }
);

// GET /api/auth/admins (All authenticated admins)
// Note: Exposes public fields only; sensitive fields like password are excluded
router.get("/admins", authenticateToken, async (req, res) => {
  try {
    const admins = await Admin.find({})
      .select("username email fingerprintID isSuperAdmin createdAt updatedAt")
      .sort({ createdAt: -1 });
    res.json({ admins });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({ message: "Failed to fetch admins" });
  }
});

// PUT /api/auth/admins/:id (Super admin only)
router.put(
  "/admins/:id",
  [
    authenticateToken,
    requireSuperAdmin,
    body("username").optional().isLength({ min: 3 }),
    body("email").optional().isEmail(),
    body("fingerprintID").optional().isInt({ min: 1000, max: 9999 }),
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
      const updateData = req.body;

      // Remove password from update data if present
      delete updateData.password;

      const admin = await Admin.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Log admin update activity
      await ActivityService.logAdminUpdated(req.admin._id, admin.username, req.admin.username);

      res.json({
        message: "Admin updated successfully",
        admin,
      });
    } catch (error) {
      console.error("Update admin error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "Admin with this information already exists" });
      }
      res.status(500).json({ message: "Update failed" });
    }
  }
);

// DELETE /api/auth/admins/:id (Super admin only)
router.delete(
  "/admins/:id",
  authenticateToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent deleting self
      if (id === req.admin._id.toString()) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
      }

      const admin = await Admin.findByIdAndDelete(id);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Log admin deletion activity
      await ActivityService.logAdminDeleted(req.admin._id, admin.username, req.admin.username);

      res.json({ message: "Admin deleted successfully" });
    } catch (error) {
      console.error("Delete admin error:", error);
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

// GET /api/auth/me (Get current admin info)
router.get("/me", authenticateToken, async (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
