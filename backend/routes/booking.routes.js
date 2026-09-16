const express = require("express");

const { createBooking } = require("../controllers/booking.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// CREATE BOOKING - STUDENT ONLY
router.post(
  "/",
  authMiddleware,
  authorizeRoles("student"),
  createBooking
);

module.exports = router;