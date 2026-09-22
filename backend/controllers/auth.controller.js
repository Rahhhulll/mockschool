const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (role === "admin") {
      return res.status(403).json({
        message: "Admin role cannot be self-assigned",
      });
    }

    const errors = [];
    if (typeof name !== "string" || name.trim().length === 0) {
      errors.push("Name is required");
    } else if (name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
    if (typeof email !== "string" || email.trim().length === 0) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push("Please enter a valid email");
    }
    if (typeof password !== "string" || password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (role !== undefined && !["student", "mentor"].includes(role)) {
      errors.push("Role must be student or mentor");
    }
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    // Required fields validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Name validation
    if (name.trim().length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || "student",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Required fields validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};