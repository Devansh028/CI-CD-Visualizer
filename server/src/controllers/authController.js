const User = require("../models/User");
const jwt = require("jsonwebtoken");

/**
 * Helper to generate JWT token
 * @param {string} id - The MongoDB user ID
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Input Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields (name, email, password) are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    // Check if email already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "A user with this email address already exists." });
    }

    // Create an aesthetic robotic avatar using DiceBear API
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;

    // Create User
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      avatar,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(400).json({ message: "Failed to create user. Invalid user data." });
    }
  } catch (error) {
    console.error(`Register Controller Error: ${error.message}`);
    res.status(500).json({ message: "Server error during registration.", error: error.message });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password." });
    }

    // Find User
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(user._id, null, "Login", "User", user._id, { email: user.email });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      token: generateToken(user._id),
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error(`Login Controller Error: ${error.message}`);
    res.status(500).json({ message: "Server error during login.", error: error.message });
  }
};

/**
 * @desc    Get authenticated user profile
 * @route   GET /api/auth/profile
 * @access  Private (Protected by authMiddleware)
 */
const getProfile = async (req, res) => {
  try {
    // req.user has already been set by protect middleware
    res.json(req.user);
  } catch (error) {
    console.error(`Profile Controller Error: ${error.message}`);
    res.status(500).json({ message: "Server error retrieving user profile." });
  }
};

/**
 * @desc    Log out user and record audit log
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, null, "Logout", "User", req.user._id);
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error(`Logout Controller Error: ${error.message}`);
    res.status(500).json({ message: "Server error during logout." });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
};
