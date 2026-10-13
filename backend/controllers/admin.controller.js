const User = require("../models/user.model");
const Mentor = require("../models/mentor.model");
const Booking = require("../models/booking.model");
const Feedback = require("../models/feedback.model");
const { isValidObjectId } = require("../utils/validation");

const normalizePositiveInteger = (value, fallback, maxValue) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }
  return Math.min(number, maxValue);
};

const getPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
});

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAdminDashboard = async (req, res) => {
  try {
    const [
      userCounts,
      totalMentors,
      verifiedMentors,
      bookingCounts,
      totalFeedback,
      revenueSummary,
      revenueOverview,
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalStudents: {
              $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] },
            },
            totalMentors: {
              $sum: { $cond: [{ $eq: ["$role", "mentor"] }, 1, 0] },
            },
            totalAdmins: {
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
            totalBookings: { $sum: 1 },
            confirmed: {
              $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
            },
            completedInterviews: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
          },
        },
      ]),
      Feedback.countDocuments(),
      Booking.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
          },
        },
      ]),
      Booking.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            totalRevenue: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const users = userCounts[0] || {
      totalUsers: 0,
      totalStudents: 0,
      totalMentors: 0,
      totalAdmins: 0,
    };
    const bookings = bookingCounts[0] || {
      totalBookings: 0,
      confirmed: 0,
      completedInterviews: 0,
      cancelledBookings: 0,
    };
    const revenue = revenueSummary[0]?.revenue || 0;

    const dashboardData = {
      stats: {
        totalUsers: users.totalUsers,
        totalStudents: users.totalStudents,
        totalMentors,
        verifiedMentors,
        totalBookings: bookings.totalBookings,
        completedInterviews: bookings.completedInterviews,
        cancelledBookings: bookings.cancelledBookings,
        revenue,
        totalFeedback,
      },
      bookingStatistics: [
        { label: "Confirmed", value: bookings.confirmed || 0 },
        { label: "Completed", value: bookings.completedInterviews || 0 },
        { label: "Cancelled", value: bookings.cancelledBookings || 0 },
      ],
      userStatistics: [
        { label: "Students", value: users.totalStudents },
        { label: "Mentors", value: users.totalMentors },
        { label: "Admins", value: users.totalAdmins },
      ],
      revenueOverview: revenueOverview.map((entry) => {
        const date = new Date(`${entry._id}-01T00:00:00Z`);
        return {
          label: new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date),
          value: entry.totalRevenue || 0,
        };
      }),
    };

    res.status(200).json({
      success: true,
      message: "Admin dashboard fetched successfully",
      data: dashboardData,
      dashboard: dashboardData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const rawPage = normalizePositiveInteger(req.query.page, 1, 1000);
    const rawLimit = normalizePositiveInteger(req.query.limit, 10, 100);
    const page = rawPage;
    const limit = rawLimit;
    const { role, search } = req.query;
    const filter = {};

    if (role !== undefined && role !== "all") {
      if (!["student", "mentor", "admin"].includes(String(role))) {
        return res.status(400).json({
          success: false,
          message: "Invalid role filter",
        });
      }
      filter.role = String(role);
    }

    if (search) {
      const escapedSearch = escapeRegExp(search);
      filter.$or = [{ name: new RegExp(escapedSearch, "i") }, { email: new RegExp(escapedSearch, "i") }];
    }

    const totalItems = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Admin users fetched successfully",
      data: users,
      users,
      count: users.length,
      pagination: getPaginationMeta(page, limit, totalItems),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin users",
    });
  }
};

const getAdminUserById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(req.params.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const mentorProfile = await Mentor.findOne({ userId: user._id }).lean();
    const cleanMentorProfile = mentorProfile
      ? {
          _id: mentorProfile._id,
          expertise: mentorProfile.expertise,
          experience: mentorProfile.experience,
          bio: mentorProfile.bio,
          hourlyRate: mentorProfile.hourlyRate,
          isVerified: mentorProfile.isVerified,
          rating: mentorProfile.rating,
          createdAt: mentorProfile.createdAt,
          updatedAt: mentorProfile.updatedAt,
        }
      : null;

    res.status(200).json({
      success: true,
      message: "Admin user fetched successfully",
      data: {
        ...user,
        mentorProfile: cleanMentorProfile,
      },
      user: {
        ...user,
        mentorProfile: cleanMentorProfile,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin user",
    });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (String(req.user.userId) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot delete their own account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(409).json({
          success: false,
          message: "Cannot delete the last remaining admin account",
        });
      }
    }

    const mentor = await Mentor.findOne({ userId: user._id }).select("_id");
    const relatedBooking = await Booking.exists({
      $or: [{ studentId: user._id }, ...(mentor ? [{ mentorId: mentor._id }] : [])],
    });
    const relatedFeedback = await Feedback.exists({
      $or: [{ studentId: user._id }, ...(mentor ? [{ mentorId: mentor._id }] : [])],
    });

    if (mentor || relatedBooking || relatedFeedback) {
      return res.status(409).json({
        success: false,
        message: "User cannot be deleted while related mentor, booking, or feedback records exist",
      });
    }

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

const getAdminMentors = async (req, res) => {
  try {
    const rawPage = normalizePositiveInteger(req.query.page, 1, 1000);
    const rawLimit = normalizePositiveInteger(req.query.limit, 10, 100);
    const page = rawPage;
    const limit = rawLimit;
    const filter = {};

    const requestedStatus = req.query.verificationStatus ?? req.query.verified ?? "all";
    if (requestedStatus !== "all") {
      if (requestedStatus === "verified" || requestedStatus === "true") {
        filter.isVerified = true;
      } else if (requestedStatus === "pending" || requestedStatus === "false") {
        filter.isVerified = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid verification status filter",
        });
      }
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegExp(req.query.search), "i");
      const matchingUserIds = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");
      const userIds = matchingUserIds.map((user) => user._id);
      filter.$or = [{ expertise: searchRegex }, { userId: { $in: userIds } }];
    }

    const totalItems = await Mentor.countDocuments(filter);
    const mentors = await Mentor.find(filter)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Admin mentors fetched successfully",
      data: mentors,
      mentors,
      count: mentors.length,
      pagination: getPaginationMeta(page, limit, totalItems),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin mentors",
    });
  }
};

const verifyAdminMentor = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
      });
    }

    const { isVerified } = req.body || {};

    if (typeof isVerified !== "boolean") {
      return res.status(400).json({
        success: false,
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
        success: false,
        message: "Mentor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: isVerified ? "Mentor verified successfully" : "Mentor unverified successfully",
      data: mentor,
      mentor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update mentor verification",
    });
  }
};

const getAdminBookings = async (req, res) => {
  try {
    const rawPage = normalizePositiveInteger(req.query.page, 1, 1000);
    const rawLimit = normalizePositiveInteger(req.query.limit, 10, 100);
    const page = rawPage;
    const limit = rawLimit;
    const filter = {};

    if (req.query.status && req.query.status !== "all") {
      if (!["confirmed", "completed", "cancelled"].includes(String(req.query.status))) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status filter",
        });
      }
      filter.status = String(req.query.status);
    }

    if (req.query.paymentStatus && req.query.paymentStatus !== "all") {
      if (!["paid", "pending"].includes(String(req.query.paymentStatus))) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status filter",
        });
      }
      filter.paymentStatus = String(req.query.paymentStatus);
    }

    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegExp(req.query.search), "i");
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");
      const matchingStudentIds = matchingUsers.map((user) => user._id);
      const matchingMentorIds = await Mentor.find({
        userId: { $in: matchingStudentIds },
      }).select("_id");
      const mentorIds = matchingMentorIds.map((mentor) => mentor._id);
      const bookingId = isValidObjectId(String(req.query.search)) ? String(req.query.search) : null;
      filter.$or = [
        { studentId: { $in: matchingStudentIds } },
        { mentorId: { $in: mentorIds } },
        ...(bookingId ? [{ _id: bookingId }] : []),
      ];
    }

    const totalItems = await Booking.countDocuments(filter);
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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Admin bookings fetched successfully",
      data: bookings,
      bookings,
      count: bookings.length,
      pagination: getPaginationMeta(page, limit, totalItems),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin bookings",
    });
  }
};

const getAdminFeedback = async (req, res) => {
  try {
    const rawPage = normalizePositiveInteger(req.query.page, 1, 1000);
    const rawLimit = normalizePositiveInteger(req.query.limit, 10, 100);
    const page = rawPage;
    const limit = rawLimit;
    const { search, rating } = req.query;
    const filter = {};

    if (rating !== undefined && rating !== "all") {
      const parsedRating = Number(rating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Invalid rating filter",
        });
      }

      filter.$expr = {
        $and: [
          {
            $gte: [
              {
                $divide: [
                  {
                    $add: [
                      "$technicalRating",
                      "$communicationRating",
                      "$confidenceRating",
                    ],
                  },
                  3,
                ],
              },
              parsedRating,
            ],
          },
          {
            $lt: [
              {
                $divide: [
                  {
                    $add: [
                      "$technicalRating",
                      "$communicationRating",
                      "$confidenceRating",
                    ],
                  },
                  3,
                ],
              },
              parsedRating + 1,
            ],
          },
        ],
      };
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), "i");
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");
      const studentIds = matchingUsers.map((user) => user._id);
      const mentorUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");
      const mentorProfiles = await Mentor.find({
        userId: { $in: mentorUsers.map((user) => user._id) },
      }).select("_id");
      const mentorIds = mentorProfiles.map((mentor) => mentor._id);
      const bookingId = isValidObjectId(String(search)) ? String(search) : null;

      filter.$or = [
        { studentId: { $in: studentIds } },
        { mentorId: { $in: mentorIds } },
        { strengths: searchRegex },
        { weaknesses: searchRegex },
        { overallFeedback: searchRegex },
        ...(bookingId ? [{ bookingId }] : []),
      ];
    }

    const [summaryData, totalItems, feedback] = await Promise.all([
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            totalFeedback: { $sum: 1 },
            averageTechnicalRating: { $avg: "$technicalRating" },
            averageCommunicationRating: { $avg: "$communicationRating" },
            averageConfidenceRating: { $avg: "$confidenceRating" },
            overallAverageRating: {
              $avg: {
                $divide: [
                  {
                    $add: [
                      "$technicalRating",
                      "$communicationRating",
                      "$confidenceRating",
                    ],
                  },
                  3,
                ],
              },
            },
          },
        },
      ]),
      Feedback.countDocuments(filter),
      Feedback.find(filter)
        .populate("studentId", "name email")
        .populate({
          path: "mentorId",
          populate: {
            path: "userId",
            select: "name email",
          },
        })
        .populate("bookingId", "_id")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const summary = summaryData[0] || {
      totalFeedback: 0,
      averageTechnicalRating: null,
      averageCommunicationRating: null,
      averageConfidenceRating: null,
      overallAverageRating: null,
    };

    res.status(200).json({
      success: true,
      message: "Admin feedback fetched successfully",
      data: feedback,
      pagination: getPaginationMeta(page, limit, totalItems),
      summary: {
        totalFeedback: summary.totalFeedback,
        averageTechnicalRating: summary.averageTechnicalRating ?? null,
        averageCommunicationRating: summary.averageCommunicationRating ?? null,
        averageConfidenceRating: summary.averageConfidenceRating ?? null,
        overallAverageRating: summary.overallAverageRating ?? null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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
