const express = require("express");

const {
  getStudentDashboard,
  getMentorDashboard,
} = require("../controllers/dashboard.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get(
  "/student",
  authMiddleware,
  authorizeRoles("student"),
  getStudentDashboard
);

router.get(
  "/mentor",
  authMiddleware,
  authorizeRoles("mentor"),
  getMentorDashboard
);

module.exports = router;
