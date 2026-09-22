const Mentor = require("../models/mentor.model");
const { isValidObjectId } = require("../utils/validation");

// CREATE MENTOR PROFILE
const createMentor = async (req, res) => {
  try {
    const {
      expertise,
      experience,
      bio,
      hourlyRate,
    } = req.body;

    if (
      !Array.isArray(expertise) ||
      expertise.length === 0 ||
      expertise.some((item) => typeof item !== "string" || item.trim().length === 0) ||
      typeof experience !== "number" ||
      !Number.isFinite(experience) ||
      experience < 0 ||
      typeof hourlyRate !== "number" ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate <= 0
    ) {
      return res.status(400).json({
        message: "Validation failed",
        errors: [
          "expertise must be a non-empty array",
          "experience must be a non-negative number",
          "hourlyRate must be a positive number",
        ],
      });
    }

    const userId = req.user.userId;
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
    });
  }
};

// GET MENTOR BY ID
const getMentorById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid mentor ID",
      });
    }

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
    });
  }
};

// UPDATE MENTOR PROFILE
const updateMentor = async (req, res) => {
  try {
    const { expertise, experience, bio, hourlyRate } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid mentor ID",
      });
    }

    if (
      !Array.isArray(expertise) ||
      expertise.length === 0 ||
      expertise.some((item) => typeof item !== "string" || item.trim().length === 0) ||
      typeof experience !== "number" ||
      !Number.isFinite(experience) ||
      experience < 0 ||
      typeof hourlyRate !== "number" ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate <= 0
    ) {
      return res.status(400).json({
        message: "Validation failed",
        errors: [
          "expertise must be a non-empty array",
          "experience must be a non-negative number",
          "hourlyRate must be a positive number",
        ],
      });
    }

    const mentor = await Mentor.findByIdAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
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

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid mentor ID",
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