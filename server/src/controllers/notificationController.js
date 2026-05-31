const Notification = require("../models/Notification");
const logger = require("../utils/logger");

/**
 * @desc    Get user's notifications (paginated and filtered)
 * @route   GET /api/notifications
 * @access  Private (JWT protected)
 */
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    
    // Support filtering by read/unread status
    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === "true" || req.query.isRead === true;
    }
    
    // Support filtering by project
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("projectId", "name")
      .lean();

    res.json({
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
      unreadCount: await Notification.countDocuments({ userId: req.user._id, isRead: false }),
    });
  } catch (error) {
    logger.error(`Get Notifications Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while fetching notifications." });
  }
};

/**
 * @desc    Get unread notifications list or count only
 * @route   GET /api/notifications/unread
 * @access  Private (JWT protected)
 */
const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id, isRead: false })
      .sort({ createdAt: -1 })
      .populate("projectId", "name")
      .lean();

    res.json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    logger.error(`Get Unread Notifications Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while fetching unread notifications." });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (JWT protected)
 */
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    // Ownership check
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read.", notification });
  } catch (error) {
    logger.error(`Mark Notification Read Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while marking notification as read." });
  }
};

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private (JWT protected)
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    logger.error(`Mark All Notifications Read Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while updating notifications." });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (JWT protected)
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    // Ownership check
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    await notification.deleteOne();
    res.json({ message: "Notification deleted successfully." });
  } catch (error) {
    logger.error(`Delete Notification Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while deleting notification." });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
