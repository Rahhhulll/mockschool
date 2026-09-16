const Booking = require("../models/booking.model");
const Slot = require("../models/slot.model");

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({
        message: "slotId is required",
      });
    }

    // Find available slot
    const slot = await Slot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    // Check if slot is already booked
    if (slot.isBooked) {
      return res.status(409).json({
        message: "Slot is already booked",
      });
    }

    // Create booking
    const booking = await Booking.create({
      studentId: req.user.userId,
      mentorId: slot.mentorId,
      slotId: slot._id,
    });

    // Mark slot as booked
    slot.isBooked = true;
    await slot.save();

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

module.exports = {
  createBooking,
};