const express = require("express");
const { register, login, getProfile, logout } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

// Public routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

// Protected routes
router.get("/profile", protect, getProfile);
router.post("/logout", protect, logout);

module.exports = router;
