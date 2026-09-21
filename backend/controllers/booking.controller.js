const Booking = require("../models/booking.model");
const Slot = require("../models/slot.model");
const Mentor = require("../models/mentor.model");

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({
        message: "slotId is required",
      });
    }

    // Atomically book the slot
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        isBooked: false,
      },
      {
        isBooked: true,
      },
      {
        new: true,
      }
    );

    if (!slot) {
      return res.status(409).json({
        message: "Slot is already booked or not available",
      });
    }

    // Create booking
    const booking = await Booking.create({
      studentId: req.user.userId,
      mentorId: slot.mentorId,
      slotId: slot._id,
      amount: 99,
      paymentStatus: "pending",
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

// GET MY BOOKINGS
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      studentId: req.user.userId,
    })
      .populate("studentId", "name email")
      .populate({
        path: "mentorId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate("slotId");

    res.status(200).json({
      message: "My bookings fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// GET BOOKING BY ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      studentId: req.user.userId,
    })
      .populate("studentId", "name email")
      .populate({
        path: "mentorId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate("slotId");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    res.status(200).json({
      message: "Booking fetched successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// CANCEL BOOKING
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      studentId: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        message: "Completed booking cannot be cancelled",
      });
    }

    // Cancel booking
    booking.status = "cancelled";
    await booking.save();

    // Make slot available again
    await Slot.findByIdAndUpdate(
      booking.slotId,
      {
        isBooked: false,
      }
    );

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch/cancel booking",
      error: error.message,
    });
  }
};

// GET MENTOR BOOKINGS
const getMentorBookings = async (req, res) => {
  try {
    // Find mentor profile of logged-in mentor
    const mentor = await Mentor.findOne({
      userId: req.user.userId,
    });

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor profile not found",
      });
    }

    const bookings = await Booking.find({
      mentorId: mentor._id,
    })
      .populate("studentId", "name email")
      .populate("slotId")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      message: "Mentor bookings fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mentor bookings",
      error: error.message,
    });
  }
};

// COMPLETE BOOKING
const completeBooking = async (req, res) => {
  try {
    // Find logged-in mentor
    const mentor = await Mentor.findOne({
      userId: req.user.userId,
    });

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor profile not found",
      });
    }

    // Find booking belonging to this mentor
    const booking = await Booking.findOne({
      _id: req.params.id,
      mentorId: mentor._id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled booking cannot be completed",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        message: "Booking is already completed",
      });
    }

    booking.status = "completed";

    await booking.save();

    res.status(200).json({
      message: "Booking completed successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to complete booking",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getMentorBookings,
  completeBooking,
};