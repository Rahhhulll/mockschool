const User = require("../models/user.model");
const Mentor = require("../models/mentor.model");
const Booking = require("../models/booking.model");
const Feedback = require("../models/feedback.model");
const { isValidObjectId } = require("../utils/validation");

const getAdminDashboard = async (req, res) => {
  try {
    const [
      userCounts,
      totalMentors,
      verifiedMentors,
      bookingCounts,
      paidBookings,
      pendingPayments,
      revenueResult,
      feedbackResult,
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            students: {
              $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] },
            },
            mentors: {
              $sum: { $cond: [{ $eq: ["$role", "mentor"] }, 1, 0] },
            },
            admins: {
              $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
            },
          },
        },
      ]),
      Mentor.countDocuments(),
      Mentor.countDocuments({ isVerified: true }),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
            },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
          },
        },
      ]),
      Booking.countDocuments({ paymentStatus: "paid" }),
      Booking.countDocuments({ paymentStatus: "pending" }),
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
      ]),
      Feedback.aggregate([
        {
          $project: {
            rating: {
              $avg: [
                "$technicalRating",
                "$communicationRating",
                "$confidenceRating",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const users = userCounts[0] || {
      total: 0,
      students: 0,
      mentors: 0,
      admins: 0,
    };
    const bookings = bookingCounts[0] || {
      total: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    const feedback = feedbackResult[0] || {
      total: 0,
      averageRating: 0,
    };

    res.status(200).json({
      message: "Admin dashboard fetched successfully",
      dashboard: {
        users: {
          total: users.total,
          students: users.students,
          mentors: users.mentors,
          admins: users.admins,
        },
        mentors: {
          total: totalMentors,
          verified: verifiedMentors,
          unverified: totalMentors - verifiedMentors,
        },
        bookings: {
          total: bookings.total,
          confirmed: bookings.confirmed,
          completed: bookings.completed,
          cancelled: bookings.cancelled,
        },
        payments: {
          paidBookings,
          pendingPayments,
          totalRevenue: revenueResult[0]?.totalRevenue || 0,
        },
        feedback: {
          total: feedback.total,
          averageRating: feedback.averageRating || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin dashboard",
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role !== undefined) {
      if (!["student", "mentor", "admin"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role filter",
        });
      }
      filter.role = role;
    }

    if (search) {
      const escapedSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Admin users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin users",
    });
  }
};

const getAdminUserById = async (req, res) => {
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
      message: "Admin user fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin user",
    });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (req.params.id === String(req.user.userId)) {
      return res.status(400).json({
        message: "Admin cannot delete their own account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
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

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
    });
  }
};

const getAdminMentors = async (req, res) => {
  try {
    const filter = {};

    if (req.query.verified !== undefined) {
      if (!["true", "false"].includes(req.query.verified)) {
        return res.status(400).json({
          message: "verified must be true or false",
        });
      }
      filter.isVerified = req.query.verified === "true";
    }

    const mentors = await Mentor.find(filter)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Admin mentors fetched successfully",
      count: mentors.length,
      mentors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin mentors",
    });
  }
};

const verifyAdminMentor = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid mentor ID",
      });
    }

    const { isVerified } = req.body || {};

    if (typeof isVerified !== "boolean") {
      return res.status(400).json({
        message: "isVerified must be true or false",
      });
    }

    const mentor = await Mentor.findByIdAndUpdate(
      req.params.id,
      { isVerified },
      { new: true, runValidators: true }
    ).populate("userId", "name email role");

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

const getAdminBookings = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;
    const filter = {};

    if (status !== undefined) {
      if (!["confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({
          message: "Invalid booking status filter",
        });
      }
      filter.status = status;
    }

    if (paymentStatus !== undefined) {
      if (!["paid", "pending"].includes(paymentStatus)) {
        return res.status(400).json({
          message: "Invalid payment status filter",
        });
      }
      filter.paymentStatus = paymentStatus;
    }

    const bookings = await Booking.find(filter)
      .populate("studentId", "name email")
      .populate({
        path: "mentorId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate("slotId", "date startTime endTime")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Admin bookings fetched successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin bookings",
    });
  }
};

const getAdminFeedback = async (req, res) => {
  try {
    const [feedback, statistics] = await Promise.all([
      Feedback.find()
        .populate("studentId", "name email")
        .populate({
          path: "mentorId",
          populate: {
            path: "userId",
            select: "name email",
          },
        })
        .populate("bookingId", "_id")
        .sort({ createdAt: -1 }),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            totalFeedback: { $sum: 1 },
            averageTechnicalRating: { $avg: "$technicalRating" },
            averageCommunicationRating: { $avg: "$communicationRating" },
            averageConfidenceRating: { $avg: "$confidenceRating" },
          },
        },
      ]),
    ]);

    const summary = statistics[0] || {
      totalFeedback: 0,
      averageTechnicalRating: 0,
      averageCommunicationRating: 0,
      averageConfidenceRating: 0,
    };

    res.status(200).json({
      message: "Admin feedback fetched successfully",
      count: feedback.length,
      feedback,
      statistics: {
        totalFeedback: summary.totalFeedback,
        averageTechnicalRating: summary.averageTechnicalRating || 0,
        averageCommunicationRating: summary.averageCommunicationRating || 0,
        averageConfidenceRating: summary.averageConfidenceRating || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin feedback",
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  deleteAdminUser,
  getAdminMentors,
  verifyAdminMentor,
  getAdminBookings,
  getAdminFeedback,
};
