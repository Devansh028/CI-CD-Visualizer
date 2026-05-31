const AuditLog = require("../models/AuditLog");
const Member = require("../models/Member");

/**
 * @desc    Get system audit logs with filters and pagination
 * @route   GET /api/audit
 * @access  Private (JWT protected, organization-scoped)
 */
const getAuditLogs = async (req, res) => {
  const { 
    userId, 
    resourceId, 
    action, 
    resourceType, 
    startDate, 
    endDate, 
    organizationId,
    limit = 50,
    page = 1
  } = req.query;

  const query = {};

  try {
    // 1. RBAC check: restrict queries based on organization membership unless global admin
    if (req.user.role !== "admin") {
      const memberships = await Member.find({ userId: req.user._id }).lean();
      const allowedOrgIds = memberships.map(m => m.organizationId.toString());

      if (organizationId) {
        if (!allowedOrgIds.includes(organizationId.toString())) {
          return res.status(403).json({ success: false, message: "Access denied. You do not have permission to view audit logs for this organization." });
        }
        query.organizationId = organizationId;
      } else {
        // Limit query to only return logs from organizations they belong to
        query.organizationId = { $in: allowedOrgIds };
      }
    } else {
      // Global admins can query any organization
      if (organizationId) {
        query.organizationId = organizationId;
      }
    }

    // 2. Build other query filters
    if (userId) query.userId = userId;
    if (resourceId) query.resourceId = resourceId;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("userId", "name email avatar");

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error(`Get Audit Logs Error: ${error.message}`);
    res.status(500).json({ message: "Server error occurred while fetching audit logs." });
  }
};

module.exports = {
  getAuditLogs,
};

