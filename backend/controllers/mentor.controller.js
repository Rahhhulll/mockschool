const Mentor = require("../models/mentor.model");

// CREATE MENTOR PROFILE
const createMentor = async (req, res) => {
  try {
    const {
      userId,
      expertise,
      experience,
      bio,
      hourlyRate,
    } = req.body;

    if (
      !userId ||
      !expertise ||
      experience === undefined ||
      hourlyRate === undefined
    ) {
      return res.status(400).json({
        message: "userId, expertise, experience and hourlyRate are required",
      });
    }

    const existingMentor = await Mentor.findOne({ userId });

    if (existingMentor) {
      return res.status(409).json({
        message: "Mentor profile already exists",
      });
    }

    const mentor = await Mentor.create({
      userId,
      expertise,
      experience,
      bio,
      hourlyRate,
    });

    res.status(201).json({
      message: "Mentor profile created successfully",
      mentor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create mentor profile",
      error: error.message,
    });
  }
};

// GET ALL MENTORS
// GET ALL VERIFIED MENTORS
const getAllMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find({ isVerified: true })
      .populate("userId", "name email");

    res.status(200).json({
      message: "Verified mentors fetched successfully",
      count: mentors.length,
      mentors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mentors",
      error: error.message,
    });
  }
};

// GET MENTOR BY ID
const getMentorById = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id)
      .populate("userId", "name email");

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found",
      });
    }

    res.status(200).json({
      message: "Mentor fetched successfully",
      mentor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mentor",
      error: error.message,
    });
  }
};

// UPDATE MENTOR PROFILE
const updateMentor = async (req, res) => {
  try {
    const { expertise, experience, bio, hourlyRate } = req.body;

    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      {
        expertise,
        experience,
        bio,
        hourlyRate,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId", "name email");

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found",
      });
    }

    res.status(200).json({
      message: "Mentor profile updated successfully",
      mentor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update mentor profile",
      error: error.message,
    });
  }
};


// VERIFY / UNVERIFY MENTOR
const verifyMentor = async (req, res) => {
  try {
    const { isVerified } = req.body || {};

    if (typeof isVerified !== "boolean") {
      return res.status(400).json({
        message: "isVerified must be true or false",
      });
    }

    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: isVerified,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId", "name email");

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor not found",
      });
    }

    res.status(200).json({
      message: isVerified
        ? "Mentor verified successfully"
        : "Mentor unverified successfully",
      mentor,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update mentor verification",
      error: error.message,
    });
  }
};

module.exports = {
  createMentor,
  verifyMentor,
  getAllMentors,
  getMentorById,
  updateMentor,
verifyMentor,
};