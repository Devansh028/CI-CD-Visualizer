const Project = require("../../models/Project");
const Deployment = require("../../models/Deployment");
const logger = require("../../utils/logger");

/**
 * Calculates aggregate deployment stats and lists recent history for the user's projects.
 * 
 * @param {string} userId - Mongoose user ID to scope queries
 * @returns {Promise<Object>} Aggregated metrics and recent deployments
 */
const getDeploymentStats = async (userId) => {
  try {
    // 1. Resolve projects owned by the user
    const userProjects = await Project.find({ owner: userId }).select("_id");
    const projectIds = userProjects.map(p => p._id);

    // If the user does not own any projects, return zero metrics
    if (projectIds.length === 0) {
      return {
        totalDeployments: 0,
        successful: 0,
        failed: 0,
        successRate: "0%",
        averageDuration: "0s",
        recentActivity: []
      };
    }

    // 2. Aggregate deployment details
    const result = await Deployment.aggregate([
      {
        $match: {
          projectId: { $in: projectIds }
        }
      },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          avgDuration: [
            { $match: { status: "success", duration: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: "$duration" } } }
          ],
          recentActivity: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "project"
              }
            },
            { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                commitHash: 1,
                branch: 1,
                status: 1,
                duration: 1,
                createdAt: 1,
                commitMessage: 1,
                deploymentVersion: 1,
                projectName: "$project.name",
                triggerType: 1
              }
            }
          ]
        }
      }
    ]);

    const facet = result[0] || {};
    const statusCounts = facet.statusCounts || [];
    const avgDurationArray = facet.avgDuration || [];
    const recentActivity = facet.recentActivity || [];

    let totalDeployments = 0;
    let successful = 0;
    let failed = 0;

    statusCounts.forEach(s => {
      totalDeployments += s.count;
      if (s._id === "success") {
        successful += s.count;
      } else if (s._id === "failed" || s._id === "rolled-back") {
        failed += s.count;
      }
    });

    const successRateVal = totalDeployments > 0 ? Math.round((successful / totalDeployments) * 100) : 0;
    const successRate = `${successRateVal}%`;

    const avgDurationSec = avgDurationArray[0]?.avg || 0;
    
    // Human readable duration format (e.g. 151s -> "2m 31s")
    const formatDuration = (seconds) => {
      if (!seconds || seconds <= 0) return "0s";
      const m = Math.floor(seconds / 60);
      const s = Math.round(seconds % 60);
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    };

    const averageDuration = formatDuration(avgDurationSec);

    return {
      totalDeployments,
      successful,
      failed,
      successRate,
      averageDuration,
      recentActivity
    };
  } catch (error) {
    logger.error(`Error calculating deployment metrics: ${error.message}`);
    return {
      totalDeployments: 0,
      successful: 0,
      failed: 0,
      successRate: "0%",
      averageDuration: "0s",
      recentActivity: []
    };
  }
};

module.exports = {
  getDeploymentStats,
};
