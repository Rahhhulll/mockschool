const express = require("express");

const {
  getAllUsers,
  getUserById,
  deleteUser,
} = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// GET ALL USERS - ADMIN ONLY
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  getAllUsers
);

// GET USER BY ID - ADMIN ONLY
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  getUserById
);

// DELETE USER - ADMIN ONLY
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deleteUser
);

module.exports = router;