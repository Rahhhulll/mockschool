const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: true,
    },

    technicalRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    communicationRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    confidenceRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    strengths: {
      type: String,
      trim: true,
    },

    weaknesses: {
      type: String,
      trim: true,
    },

    overallFeedback: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;