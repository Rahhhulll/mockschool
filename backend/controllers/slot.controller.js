const Slot = require("../models/slot.model");
const Mentor = require("../models/mentor.model");

// CREATE SLOT
const createSlot = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    // Required fields
    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Date, startTime and endTime are required",
      });
    }

    // Find logged-in mentor
    const mentor = await Mentor.findOne({
      userId: req.user.userId,
    });

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor profile not found",
      });
    }

    // Create slot
    const slot = await Slot.create({
      mentorId: mentor._id,
      date,
      startTime,
      endTime,
    });

    res.status(201).json({
      message: "Slot created successfully",
      slot,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create slot",
      error: error.message,
    });
  }
};

// GET AVAILABLE SLOTS
const getAvailableSlots = async (req, res) => {
  try {
    const slots = await Slot.find({
      isBooked: false,
    })
      .populate({
        path: "mentorId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      message: "Available slots fetched successfully",
      count: slots.length,
      slots,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch available slots",
      error: error.message,
    });
  }
};

module.exports = {
  createSlot,
  getAvailableSlots,
};