const Feedback = require("../models/feedback.model");
const Booking = require("../models/booking.model");
const { isValidObjectId } = require("../utils/validation");

// CREATE FEEDBACK
const createFeedback = async (req, res) => {
  try {
    const {
      bookingId,
      technicalRating,
      communicationRating,
      confidenceRating,
      strengths,
      weaknesses,
      overallFeedback,
    } = req.body;

    if (
      !bookingId ||
      technicalRating === undefined ||
      communicationRating === undefined ||
      confidenceRating === undefined
    ) {
      return res.status(400).json({
        message:
          "bookingId, technicalRating, communicationRating and confidenceRating are required",
      });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    if (![technicalRating, communicationRating, confidenceRating].every(
      (rating) => typeof rating === "number" && Number.isFinite(rating) && rating >= 1 && rating <= 5
    )) {
      return res.status(400).json({
        message: "Ratings must be numbers between 1 and 5",
      });
    }

    // Find booking belonging to logged-in student
    const booking = await Booking.findOne({
      _id: bookingId,
      studentId: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Feedback only after interview is completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "Feedback can be submitted only for completed booking",
      });
    }

    // Check existing feedback
    const existingFeedback = await Feedback.findOne({
      bookingId,
    });

    if (existingFeedback) {
      return res.status(409).json({
        message: "Feedback already submitted",
      });
    }

    const feedback = await Feedback.create({
      bookingId,
      studentId: req.user.userId,
      mentorId: booking.mentorId,
      technicalRating,
      communicationRating,
      confidenceRating,
      strengths,
      weaknesses,
      overallFeedback,
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.bookingId) {
      return res.status(409).json({
        message: "Feedback already submitted",
      });
    }

    res.status(500).json({
      message: "Failed to submit feedback",
    });
  }
};


// GET FEEDBACK BY BOOKING ID
const getFeedbackByBooking = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Student can access only their own booking feedback
    if (
      req.user.role === "student" &&
      booking.studentId.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Mentor can access only their own booking feedback
    if (req.user.role === "mentor") {
      const mentor = await require("../models/mentor.model").findOne({
        userId: req.user.userId,
      });

      if (!mentor || booking.mentorId.toString() !== mentor._id.toString()) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }

    const feedback = await Feedback.findOne({
      bookingId: req.params.bookingId,
    })
      .populate("studentId", "name email")
      .populate({
        path: "mentorId",
        populate: {
          path: "userId",
          select: "name email",
        },
      });

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    res.status(200).json({
      message: "Feedback fetched successfully",
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch feedback",
    });
  }
};

module.exports = {
  createFeedback,
  getFeedbackByBooking,
}; 