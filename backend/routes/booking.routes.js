const express = require("express");

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getMentorBookings,
  completeBooking,
} = require("../controllers/booking.controller");

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

// GET MY BOOKINGS - STUDENT ONLY
router.get(
  "/my-bookings",
  authMiddleware,
  authorizeRoles("student"),
  getMyBookings
);

// GET MENTOR BOOKINGS - MENTOR ONLY
router.get(
  "/mentor-bookings",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorBookings
);

// CANCEL BOOKING - STUDENT ONLY
router.patch(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("student"),
  cancelBooking
);

// COMPLETE BOOKING - MENTOR ONLY
router.patch(
  "/:id/complete",
  authMiddleware,
  authorizeRoles("mentor"),
  completeBooking
);

// GET BOOKING BY ID - STUDENT ONLY
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("student"),
  getBookingById
);

module.exports = router;