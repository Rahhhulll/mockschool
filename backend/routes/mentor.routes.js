const express = require("express");

const {
  createMentor,
  getAllMentors,
  getMentorById,
  updateMentor,
  verifyMentor,
} = require("../controllers/mentor.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// CREATE MENTOR PROFILE
router.post("/", createMentor);

// GET ALL MENTORS
router.get("/", getAllMentors);

// GET MENTOR BY ID
router.get("/:id", getMentorById);

// UPDATE MENTOR PROFILE
router.put("/:id", updateMentor);

// VERIFY / UNVERIFY MENTOR - ADMIN ONLY
router.patch(
  "/:id/verify",
  authMiddleware,
  authorizeRoles("admin"),
  verifyMentor
);

module.exports = router;