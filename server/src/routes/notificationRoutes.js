const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

// Require JWT authentication for all notification routes
router.use(protect);

router.get("/", getNotifications);
router.get("/unread", getUnreadNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

module.exports = router;
