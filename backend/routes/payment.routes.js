const express = require("express");

const {
  createPaymentOrder,
  confirmDummyPayment,
} = require("../controllers/payment.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

// CREATE PAYMENT ORDER - STUDENT ONLY
router.post(
  "/create-order",
  authMiddleware,
  authorizeRoles("student"),
  createPaymentOrder
);

// CONFIRM DUMMY PAYMENT - STUDENT ONLY
router.post(
  "/confirm",
  authMiddleware,
  authorizeRoles("student"),
  confirmDummyPayment
);

module.exports = router;