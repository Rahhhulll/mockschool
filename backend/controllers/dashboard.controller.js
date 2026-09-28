const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Feedback = require("../models/feedback.model");
const Mentor = require("../models/mentor.model");

const upcomingBookingMatch = (ownerField, ownerId) => [
  {
    $match: {
      [ownerField]: ownerId,
      status: "confirmed",
    },
  },
  {
    $lookup: {
      from: "slots",
      localField: "slotId",
      foreignField: "_id",
      as: "slot",
    },
  },
  {
    $unwind: "$slot",
  },
  {
    $match: {
      $expr: {
        $gte: [
          {
            $dateFromString: {
              dateString: {
                $concat: [
                  {
                    $dateToString: {
                      date: "$slot.date",
                      format: "%Y-%m-%d",
                      timezone: "UTC",
                    },
                  },
                  " ",
                  "$slot.startTime",
                ],
              },
              format: "%Y-%m-%d %H:%M",
              timezone: "UTC",
            },
          },
          new Date(),
        ],
      },
    },
  },
  {
    $count: "count",
  },
];

const getCount = (result) => result[0]?.count || 0;

const slotStartDate = (slot) => {
  if (!slot?.date || !slot?.startTime) return null;
  const date = new Date(slot.date);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(`${date.toISOString().slice(0, 10)}T${slot.startTime}:00Z`);
};

// GET STUDENT DASHBOARD
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.userId);

    const [
      totalBookings,
      upcomingBookingsResult,
      completedInterviews,
      cancelledBookings,
      feedbackSummaryResult,
    ] = await Promise.all([
      Booking.countDocuments({ studentId }),
      Booking.aggregate(upcomingBookingMatch("studentId", studentId)),
      Booking.countDocuments({ studentId, status: "completed" }),
      Booking.countDocuments({ studentId, status: "cancelled" }),
      Feedback.aggregate([
        { $match: { studentId } },
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

    const feedbackSummary = feedbackSummaryResult[0] || {
      totalFeedback: 0,
      averageTechnicalRating: 0,
      averageCommunicationRating: 0,
      averageConfidenceRating: 0,
    };

    delete feedbackSummary._id;

    res.status(200).json({
      message: "Student dashboard fetched successfully",
      dashboard: {
        totalBookings,
        upcomingBookings: getCount(upcomingBookingsResult),
        completedInterviews,
        cancelledBookings,
        feedbackSummary,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch student dashboard",
    });
  }
};

// GET MENTOR DASHBOARD
const getMentorDashboard = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({
      userId: req.user.userId,
    }).select("_id");

    if (!mentor) {
      return res.status(404).json({
        message: "Mentor profile not found",
      });
    }

    const mentorId = mentor._id;

    const [
      totalInterviews,
      upcomingInterviewsResult,
      completedInterviews,
      earningsResult,
      ratingResult,
      mentorBookings,
      performanceResult,
    ] = await Promise.all([
      Booking.countDocuments({ mentorId }),
      Booking.aggregate(upcomingBookingMatch("mentorId", mentorId)),
      Booking.countDocuments({ mentorId, status: "completed" }),
      Booking.aggregate([
        {
          $match: {
            mentorId,
            status: "completed",
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$amount" },
          },
        },
      ]),
      Feedback.aggregate([
        { $match: { mentorId } },
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
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
      Booking.find({ mentorId })
        .populate("studentId", "name email")
        .populate("slotId", "date startTime endTime")
        .sort({ createdAt: -1 }),
      Feedback.aggregate([
        { $match: { mentorId } },
        {
          $group: {
            _id: null,
            technicalRating: { $avg: "$technicalRating" },
            communicationRating: { $avg: "$communicationRating" },
            confidenceRating: { $avg: "$confidenceRating" },
          },
        },
      ]),
    ]);

    const upcomingBookings = mentorBookings
      .filter((booking) => booking.status === "confirmed" && slotStartDate(booking.slotId) > new Date())
      .slice(0, 5);
    const recentBookings = mentorBookings
      .filter((booking) => booking.status !== "confirmed" || !(slotStartDate(booking.slotId) > new Date()))
      .slice(0, 5);
    const performanceSummary = performanceResult[0] || null;

    res.status(200).json({
      message: "Mentor dashboard fetched successfully",
      dashboard: {
        totalInterviews,
        upcomingInterviews: getCount(upcomingInterviewsResult),
        completedInterviews,
        totalEarnings: earningsResult[0]?.totalEarnings || 0,
        averageRating: mentor.rating || ratingResult[0]?.averageRating || 0,
        upcomingBookings,
        recentBookings,
        performanceSummary,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch mentor dashboard",
    });
  }
};

module.exports = {
  getStudentDashboard,
  getMentorDashboard,
};
