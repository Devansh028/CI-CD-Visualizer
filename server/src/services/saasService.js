const TenantBilling = require("../models/TenantBilling");
const Project = require("../models/Project");

/**
 * Validates if an organization has available quota to trigger a new deployment.
 * Enforces strict tenant isolation and limits.
 */
const validateTenantQuota = async (organizationId) => {
  if (!organizationId) return { allowed: true };

  // Find or create default free tier tenant details
  let billing = await TenantBilling.findOne({ organizationId });
  if (!billing) {
    billing = await TenantBilling.create({
      organizationId,
      plan: "free"
    });
  }

  // Calculate current active deployments
  const projects = await Project.find({ organizationId });
  const activeCount = projects.filter(p => p.status === "deployed" || p.status === "building").length;

  // Sync current count to DB
  billing.usage.deployments = activeCount;
  await billing.save();

  if (activeCount >= billing.quotas.maxDeployments) {
    return {
      allowed: false,
      reason: `Organization has exceeded its active deployment quota of ${billing.quotas.maxDeployments} on the '${billing.plan.toUpperCase()}' plan.`
    };
  }

  return { allowed: true };
};

/**
 * Recalculates exact resource consumption (CPU/Memory) for billing.
 */
const updateTenantUtilization = async (organizationId, deltaCpu, deltaMemory, deltaStorage) => {
  const billing = await TenantBilling.findOne({ organizationId });
  if (!billing) return;

  billing.usage.cpu = Math.max(0, billing.usage.cpu + deltaCpu);
  billing.usage.memory = Math.max(0, billing.usage.memory + deltaMemory);
  billing.usage.storage = Math.max(0, billing.usage.storage + deltaStorage);
  
  await billing.save();
};

module.exports = {
  validateTenantQuota,
  updateTenantUtilization
};
