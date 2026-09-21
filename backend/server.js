const express = require("express");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const mentorRoutes = require("./routes/mentor.routes");
const slotRoutes = require("./routes/slot.routes");
const bookingRoutes = require("./routes/booking.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

// Parse JSON request body
app.use(express.json());

// Auth Routes
app.use("/api/auth", authRoutes);

// User Routes
app.use("/api/users", userRoutes);

// Mentor Routes
app.use("/api/mentors", mentorRoutes);

// Slot Routes
app.use("/api/slots", slotRoutes);

// Booking Routes
app.use("/api/bookings", bookingRoutes);

// Feedback Routes
app.use("/api/feedback", feedbackRoutes);

// Payment Routes
app.use("/api/payments", paymentRoutes);

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "MockSchool API is running",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});