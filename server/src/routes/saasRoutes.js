const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { checkOrgRole, checkGlobalAdmin } = require("../middleware/rbacMiddleware");
const {
  getBillingDetails,
  upgradePlan,
  getAdminAnalytics
} = require("../controllers/saasController");

const router = express.Router();

router.use(protect);

router.get("/organization/:orgId", checkOrgRole(["owner", "admin", "developer", "viewer"]), getBillingDetails);
router.post("/organization/:orgId/plan", checkOrgRole(["owner", "admin"]), upgradePlan);
router.get("/admin/analytics", checkGlobalAdmin, getAdminAnalytics);

module.exports = router;

