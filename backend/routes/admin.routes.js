const express = require("express");

const {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  deleteAdminUser,
  getAdminMentors,
  verifyAdminMentor,
  getAdminBookings,
  getAdminFeedback,
} = require("../controllers/admin.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.get("/dashboard", getAdminDashboard);
router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.delete("/users/:id", deleteAdminUser);
router.get("/mentors", getAdminMentors);
router.patch("/mentors/:id/verify", verifyAdminMentor);
router.get("/bookings", getAdminBookings);
router.get("/feedback", getAdminFeedback);

module.exports = router;
