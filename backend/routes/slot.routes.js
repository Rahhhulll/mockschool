const express = require("express");

const {
  createSlot,
  getAvailableSlots,
  getMySlots,
  updateSlot,
   deleteSlot,
} = require("../controllers/slot.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// CREATE SLOT - MENTOR ONLY
router.post(
  "/",
  authMiddleware,
  authorizeRoles("mentor"),
  createSlot,
   deleteSlot
);

// GET MY SLOTS - MENTOR ONLY
router.get(
  "/my-slots",
  authMiddleware,
  authorizeRoles("mentor"),
  getMySlots
);

// UPDATE SLOT - MENTOR ONLY
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("mentor"),
  updateSlot
);

// GET AVAILABLE SLOTS
router.get(
  "/",
  getAvailableSlots
);

module.exports = router;