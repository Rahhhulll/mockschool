const Slot = require("../models/slot.model");
const Mentor = require("../models/mentor.model");
const {
  isValidObjectId,
  validateSlotInput,
  timeToMinutes,
} = require("../utils/validation");

// CREATE SLOT
const createSlot = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    const validationErrors = validateSlotInput({ date, startTime, endTime });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
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

    const slotDate = new Date(`${date}T00:00:00.000Z`);
    const nextDate = new Date(slotDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const existingSlots = await Slot.find({
      mentorId: mentor._id,
      date: { $gte: slotDate, $lt: nextDate },
    }).select("startTime endTime");
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    if (existingSlots.some((existingSlot) =>
      newStart < timeToMinutes(existingSlot.endTime) &&
      newEnd > timeToMinutes(existingSlot.startTime)
    )) {
      return res.status(409).json({
        message: "Slot overlaps with an existing slot",
      });
    }

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
    });
  }
};

// GET MY SLOTS - MENTOR ONLY
const getMySlots = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({
      userId: req.user.userId,
    });

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor profile not found",
      });
    }

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
    });
  }
};

// UPDATE MY SLOT - MENTOR ONLY
const updateSlot = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    const validationErrors = validateSlotInput({ date, startTime, endTime });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid slot ID",
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

    const currentSlot = await Slot.findOne({
      _id: req.params.id,
      mentorId: mentor._id,
      isBooked: false,
    }).select("_id");

    if (!currentSlot) {
      return res.status(404).json({
        message: "Slot not found or slot is already booked",
      });
    }

    const slotDate = new Date(`${date}T00:00:00.000Z`);
    const nextDate = new Date(slotDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const existingSlots = await Slot.find({
      mentorId: mentor._id,
      _id: { $ne: req.params.id },
      date: { $gte: slotDate, $lt: nextDate },
    }).select("startTime endTime");
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    if (existingSlots.some((existingSlot) =>
      newStart < timeToMinutes(existingSlot.endTime) &&
      newEnd > timeToMinutes(existingSlot.startTime)
    )) {
      return res.status(409).json({
        message: "Slot overlaps with an existing slot",
      });
    }

    // Update only mentor's own unbooked slot
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
    });
  }
};

// DELETE MY SLOT - MENTOR ONLY
const deleteSlot = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid slot ID",
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

    // Delete only mentor's own unbooked slot
    const slot = await Slot.findOneAndDelete({
      _id: req.params.id,
      mentorId: mentor._id,
      isBooked: false,
    });

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found or slot is already booked",
      });
    }

    res.status(200).json({
      message: "Slot deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete slot",
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
      .sort({
        date: 1,
        startTime: 1,
      });

    res.status(200).json({
      message: "Available slots fetched successfully",
      count: slots.length,
      slots,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch available slots",
    });
  }
};

module.exports = {
  createSlot,
  getMySlots,
  getAvailableSlots,
  updateSlot,
  deleteSlot,
};