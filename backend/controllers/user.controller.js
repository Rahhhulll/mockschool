const User = require("../models/user.model");
const Mentor = require("../models/mentor.model");
const Booking = require("../models/booking.model");
const Feedback = require("../models/feedback.model");
const { isValidObjectId } = require("../utils/validation");

// GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

// GET USER BY ID
const getUserById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (String(user._id) === String(req.user.userId)) {
      return res.status(400).json({
        message: "Admin cannot delete their own account",
      });
    }

    const mentor = await Mentor.findOne({ userId: user._id }).select("_id");
    const relatedBooking = await Booking.exists({
      $or: [
        { studentId: user._id },
        ...(mentor ? [{ mentorId: mentor._id }] : []),
      ],
    });
    const relatedFeedback = await Feedback.exists({
      $or: [
        { studentId: user._id },
        ...(mentor ? [{ mentorId: mentor._id }] : []),
      ],
    });

    if (mentor || relatedBooking || relatedFeedback) {
      return res.status(409).json({
        message:
          "User cannot be deleted while related mentor, booking or feedback records exist",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
};