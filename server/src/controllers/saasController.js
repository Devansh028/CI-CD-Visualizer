const TenantBilling = require("../models/TenantBilling");
const Organization = require("../models/Organization");
const Project = require("../models/Project");

// Get tenant billing/quotas details
const getBillingDetails = async (req, res) => {
  const { orgId } = req.params;
  try {
    let billing = await TenantBilling.findOne({ organizationId: orgId });
    if (!billing) {
      billing = await TenantBilling.create({
        organizationId: orgId,
        plan: "free"
      });
    }
    
    // Sync actual deployments usage count
    const activeCount = await Project.countDocuments({ organizationId: orgId, status: { $in: ["deployed", "building"] } });
    billing.usage.deployments = activeCount;
    await billing.save();

    res.json(billing);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

// Update billing plan tier (Pro/Enterprise)
const upgradePlan = async (req, res) => {
  const { orgId } = req.params;
  const { plan } = req.body; // free, pro, enterprise
  
  const quotasByPlan = {
    free: { maxDeployments: 5, maxCpu: 2, maxMemory: 4, maxStorage: 10, maxBandwidth: 50 },
    pro: { maxDeployments: 20, maxCpu: 8, maxMemory: 16, maxStorage: 50, maxBandwidth: 250 },
    enterprise: { maxDeployments: 100, maxCpu: 32, maxMemory: 64, maxStorage: 200, maxBandwidth: 1000 }
  };

  try {
    const selectedQuotas = quotasByPlan[plan.toLowerCase()];
    if (!selectedQuotas) {
      return res.status(400).json({ success: false, error: "Invalid plan name" });
    }

    const billing = await TenantBilling.findOneAndUpdate(
      { organizationId: orgId },
      { plan: plan.toLowerCase(), quotas: selectedQuotas },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: `Successfully upgraded organization to ${plan.toUpperCase()}`, billing });
  } catch (error) {
    res.status(500).json({ success: false, error: "Upgrade failed", details: error.message });
  }
};

// Global SaaS utilization analytics (Admin view)
const getAdminAnalytics = async (req, res) => {
  try {
    const totalTenants = await TenantBilling.countDocuments();
    const plansDistribution = [
      { name: "Free", value: await TenantBilling.countDocuments({ plan: "free" }) },
      { name: "Pro", value: await TenantBilling.countDocuments({ plan: "pro" }) },
      { name: "Enterprise", value: await TenantBilling.countDocuments({ plan: "enterprise" }) }
    ];

    const allTenants = await TenantBilling.find().populate("organizationId", "name");
    const activeResources = {
      deployments: allTenants.reduce((sum, t) => sum + t.usage.deployments, 0),
      cpu: allTenants.reduce((sum, t) => sum + t.usage.cpu, 0),
      memory: allTenants.reduce((sum, t) => sum + t.usage.memory, 0)
    };

    res.json({
      totalTenants,
      plansDistribution,
      activeResources,
      tenantsList: allTenants
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

module.exports = {
  getBillingDetails,
  upgradePlan,
  getAdminAnalytics
};
