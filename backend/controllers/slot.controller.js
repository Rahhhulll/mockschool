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

// GET MY SLOTS - MENTOR ONLY
const getMySlots = async (req, res) => {
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

    // Get only this mentor's slots
    const slots = await Slot.find({
      mentorId: mentor._id,
    }).sort({
      date: 1,
      startTime: 1,
    });

    res.status(200).json({
      message: "My slots fetched successfully",
      count: slots.length,
      slots,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch my slots",
      error: error.message,
    });
  }
};

// UPDATE MY SLOT - MENTOR ONLY
const updateSlot = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

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

    // Update only if slot belongs to logged-in mentor
    const slot = await Slot.findOneAndUpdate(
      {
        _id: req.params.id,
        mentorId: mentor._id,
        isBooked: false,
      },
      {
        date,
        startTime,
        endTime,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found or slot is already booked",
      });
    }

    res.status(200).json({
      message: "Slot updated successfully",
      slot,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update slot",
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
    getMySlots, 
  getAvailableSlots,
   updateSlot,
};