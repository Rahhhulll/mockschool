const Booking = require("../models/booking.model");

// CREATE PAYMENT ORDER
const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        message: "bookingId is required",
      });
    }

    // Remove accidental quotes from bookingId
    const cleanBookingId = String(bookingId).replace(/"/g, "");

    // Find student's own booking
    const booking = await Booking.findOne({
      _id: cleanBookingId,
      studentId: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Payment only for confirmed booking
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: "Payment is allowed only for confirmed bookings",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Booking is already paid",
      });
    }

    // Dummy payment order
    const order = {
      orderId: `MOCK_ORDER_${Date.now()}`,
      amount: booking.amount,
      currency: "INR",
    };

    res.status(201).json({
      message: "Payment order created successfully",
      order,
      bookingId: booking._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

// CONFIRM DUMMY PAYMENT
const confirmDummyPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        message: "bookingId is required",
      });
    }

    // Remove accidental quotes from bookingId
    const cleanBookingId = String(bookingId).replace(/"/g, "");

    // Find student's own booking
    const booking = await Booking.findOne({
      _id: cleanBookingId,
      studentId: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Payment only for confirmed booking
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: "Payment is allowed only for confirmed bookings",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Booking is already paid",
      });
    }

    // Generate dummy payment ID
    const paymentId = `MOCK_PAYMENT_${Date.now()}`;

    booking.paymentStatus = "paid";
    booking.paymentId = paymentId;

    await booking.save();

    res.status(200).json({
      message: "Dummy payment successful",
      paymentId,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};

module.exports = {
  createPaymentOrder,
  confirmDummyPayment,
};