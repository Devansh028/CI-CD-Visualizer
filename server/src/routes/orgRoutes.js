const express = require("express");
const {
  createOrg,
  getMyOrgs,
  getOrgById,
  updateOrg,
  deleteOrg,
  createTeam,
  assignProjectsToTeam,
  manageTeamMembers,
  deleteTeam,
  updateMemberRole,
  removeMember,
  inviteMember,
  getInvitations,
  acceptInvitation,
  revokeInvitation
} = require("../controllers/orgController");
const { protect } = require("../middleware/authMiddleware");
const { mongoIdParamValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

// All routes require JWT authentication
router.use(protect);

// Organization CRUD
router.post("/", createOrg);
router.get("/", getMyOrgs);
router.get("/:orgId", mongoIdParamValidation("orgId"), getOrgById);
router.put("/:orgId", mongoIdParamValidation("orgId"), updateOrg);
router.delete("/:orgId", mongoIdParamValidation("orgId"), deleteOrg);

// Teams
router.post("/:orgId/teams", mongoIdParamValidation("orgId"), createTeam);
router.put("/teams/:teamId", mongoIdParamValidation("teamId"), assignProjectsToTeam); // Set team projects
router.post("/teams/:teamId/members", mongoIdParamValidation("teamId"), manageTeamMembers); // Manage team membership
router.delete("/teams/:teamId", mongoIdParamValidation("teamId"), deleteTeam);

// Members
router.put("/:orgId/members/:userId", mongoIdParamValidation("orgId"), mongoIdParamValidation("userId"), updateMemberRole);
router.delete("/:orgId/members/:userId", mongoIdParamValidation("orgId"), mongoIdParamValidation("userId"), removeMember);

// Invitations
router.post("/:orgId/invitations", mongoIdParamValidation("orgId"), inviteMember);
router.get("/:orgId/invitations", mongoIdParamValidation("orgId"), getInvitations);
router.post("/invitations/accept", acceptInvitation);
router.delete("/invitations/:inviteId", mongoIdParamValidation("inviteId"), revokeInvitation);

module.exports = router;
