const express = require("express");

const {
  createSlot,
  getAvailableSlots,
} = require("../controllers/slot.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// CREATE SLOT - MENTOR ONLY
router.post(
  "/",
  authMiddleware,
  authorizeRoles("mentor"),
  createSlot
);

// GET AVAILABLE SLOTS
router.get(
  "/",
  getAvailableSlots
);

module.exports = router;