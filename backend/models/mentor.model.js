const mongoose = require("mongoose");

const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    expertise: {
      type: [String],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length > 0 &&
          value.every((item) => typeof item === "string" && item.trim().length > 0),
        message: "Expertise must be a non-empty array",
      },
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
    },

    bio: {
      type: String,
      trim: true,
    },

    hourlyRate: {
      type: Number,
      required: true,
      min: 0.01,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Mentor = mongoose.model("Mentor", mentorSchema);

module.exports = Mentor;