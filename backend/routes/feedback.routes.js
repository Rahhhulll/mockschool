const express = require("express");

const {
  createFeedback,
  getFeedbackByBooking,
} = require("../controllers/feedback.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// CREATE FEEDBACK - STUDENT ONLY
router.post(
  "/",
  authMiddleware,
  authorizeRoles("student"),
  createFeedback
);

// GET FEEDBACK BY BOOKING - STUDENT OR MENTOR
router.get(
  "/:bookingId",
  authMiddleware,
  authorizeRoles("student", "mentor"),
  getFeedbackByBooking
);

module.exports = router;