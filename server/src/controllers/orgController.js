const Organization = require("../models/Organization");
const Team = require("../models/Team");
const Member = require("../models/Member");
const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const User = require("../models/User");
const crypto = require("crypto");

/**
 * Helper to check user membership role in an organization
 */
const getMemberRole = async (orgId, userId) => {
  const member = await Member.findOne({ organizationId: orgId, userId });
  return member ? member.role : null;
};

// ==========================================
// 1. Organization Controllers
// ==========================================

const createOrg = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Organization name is required." });
  }

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    // Check if slug already exists
    const existing = await Organization.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "An organization with a similar name already exists." });
    }

    const org = await Organization.create({
      name,
      slug,
      ownerId: req.user._id,
    });

    // Create member entry for the owner
    await Member.create({
      organizationId: org._id,
      userId: req.user._id,
      role: "owner",
    });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: "Error creating organization.", error: error.message });
  }
};

const getMyOrgs = async (req, res) => {
  try {
    const memberships = await Member.find({ userId: req.user._id }).populate("organizationId");
    const orgs = memberships
      .filter(m => m.organizationId)
      .map(m => ({
        ...m.organizationId.toObject(),
        role: m.role
      }));
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching organizations.", error: error.message });
  }
};

const getOrgById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found." });
    }

    const userRole = await getMemberRole(org._id, req.user._id);
    if (!userRole) {
      return res.status(403).json({ message: "You are not a member of this organization." });
    }

    const members = await Member.find({ organizationId: org._id }).populate("userId", "name email avatar");
    const teams = await Team.find({ organizationId: org._id }).populate("projects", "name framework status");

    res.json({
      organization: org,
      role: userRole,
      members,
      teams
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving organization details.", error: error.message });
  }
};

const updateOrg = async (req, res) => {
  const { name } = req.body;
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found." });
    }

    const userRole = await getMemberRole(org._id, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Only organization owners or admins can update settings." });
    }

    if (name) org.name = name.trim();
    await org.save();

    res.json(org);
  } catch (error) {
    res.status(500).json({ message: "Error updating organization.", error: error.message });
  }
};

const deleteOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org) {
      return res.status(404).json({ message: "Organization not found." });
    }

    // Only owner can delete Organization
    if (org.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only organization owners can delete the organization." });
    }

    // Delete associated teams, members, and invitations
    await Team.deleteMany({ organizationId: org._id });
    await Member.deleteMany({ organizationId: org._id });
    await Invitation.deleteMany({ organizationId: org._id });

    // Untag projects
    await Project.updateMany(
      { organizationId: org._id },
      { $set: { organizationId: null, teamId: null } }
    );

    await org.deleteOne();
    res.json({ message: "Organization deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting organization.", error: error.message });
  }
};

// ==========================================
// 2. Team Controllers
// ==========================================

const createTeam = async (req, res) => {
  const { orgId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Team name is required." });
  }

  try {
    const userRole = await getMemberRole(orgId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const team = await Team.create({
      organizationId: orgId,
      name,
      projects: [],
      members: []
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: "Error creating team.", error: error.message });
  }
};

const assignProjectsToTeam = async (req, res) => {
  const { teamId } = req.params;
  const { projectIds } = req.body; // Array of Project ObjectIds

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    const userRole = await getMemberRole(team.organizationId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    // Update team projects list
    team.projects = projectIds;
    await team.save();

    // Update project teamIds
    await Project.updateMany(
      { _id: { $in: projectIds } },
      { $set: { teamId: team._id, organizationId: team.organizationId } }
    );

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: "Error assigning projects.", error: error.message });
  }
};

const manageTeamMembers = async (req, res) => {
  const { teamId } = req.params;
  const { memberIds } = req.body; // Array of User ObjectIds

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    const userRole = await getMemberRole(team.organizationId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    // Ensure all userIds are actual organization members
    const validMembersCount = await Member.countDocuments({
      organizationId: team.organizationId,
      userId: { $in: memberIds }
    });

    if (validMembersCount !== memberIds.length) {
      return res.status(400).json({ message: "One or more users are not members of the organization." });
    }

    team.members = memberIds;
    await team.save();

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: "Error updating team members.", error: error.message });
  }
};

const deleteTeam = async (req, res) => {
  const { teamId } = req.params;
  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    const userRole = await getMemberRole(team.organizationId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    // Untag projects
    await Project.updateMany(
      { teamId: team._id },
      { $set: { teamId: null } }
    );

    await team.deleteOne();
    res.json({ message: "Team deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting team.", error: error.message });
  }
};

// ==========================================
// 3. Member Controllers
// ==========================================

const updateMemberRole = async (req, res) => {
  const { orgId, userId } = req.params;
  const { role } = req.body;

  if (!["admin", "developer", "viewer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified." });
  }

  try {
    const userRole = await getMemberRole(orgId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const targetMember = await Member.findOne({ organizationId: orgId, userId });
    if (!targetMember) {
      return res.status(404).json({ message: "Member not found." });
    }

    if (targetMember.role === "owner") {
      return res.status(400).json({ message: "Owner role cannot be changed." });
    }

    targetMember.role = role;
    await targetMember.save();

    res.json(targetMember);
  } catch (error) {
    res.status(500).json({ message: "Error updating member role.", error: error.message });
  }
};

const removeMember = async (req, res) => {
  const { orgId, userId } = req.params;

  try {
    const userRole = await getMemberRole(orgId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const targetMember = await Member.findOne({ organizationId: orgId, userId });
    if (!targetMember) {
      return res.status(404).json({ message: "Member not found in organization." });
    }

    if (targetMember.role === "owner") {
      return res.status(400).json({ message: "Owner cannot be removed from the organization." });
    }

    // Remove from team memberships
    await Team.updateMany(
      { organizationId: orgId },
      { $pull: { members: userId } }
    );

    await targetMember.deleteOne();
    res.json({ message: "Member removed from organization." });
  } catch (error) {
    res.status(500).json({ message: "Error removing member.", error: error.message });
  }
};

// ==========================================
// 4. Invitation Controllers
// ==========================================

const inviteMember = async (req, res) => {
  const { orgId } = req.params;
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: "Email and role are required." });
  }

  try {
    const userRole = await getMemberRole(orgId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    // Check if user is already a member
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const isAlreadyMember = await Member.findOne({ organizationId: orgId, userId: user._id });
      if (isAlreadyMember) {
        return res.status(400).json({ message: "User is already a member of this organization." });
      }
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    const invitation = await Invitation.create({
      organizationId: orgId,
      email: email.toLowerCase(),
      role,
      token,
      expiresAt
    });

    const { logAuditEvent } = require("../utils/auditLogger");
    await logAuditEvent(req.user._id, orgId, "User Invite", "Invitation", invitation._id, { email: invitation.email, role: invitation.role });

    res.status(201).json(invitation);
  } catch (error) {
    res.status(500).json({ message: "Error sending invitation.", error: error.message });
  }
};

const getInvitations = async (req, res) => {
  const { orgId } = req.params;
  try {
    const userRole = await getMemberRole(orgId, req.user._id);
    if (!userRole) {
      return res.status(403).json({ message: "Access denied." });
    }

    const invitations = await Invitation.find({ organizationId: orgId });
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invitations.", error: error.message });
  }
};

const acceptInvitation = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Invitation token is required." });
  }

  try {
    const invite = await Invitation.findOne({ token });
    if (!invite) {
      return res.status(404).json({ message: "Invalid or expired invitation token." });
    }

    if (new Date() > invite.expiresAt) {
      await invite.deleteOne();
      return res.status(400).json({ message: "Invitation has expired." });
    }

    // Check if user matches invite email (optional check, but good validation)
    if (req.user.email !== invite.email) {
      return res.status(400).json({ message: "This invitation was sent to a different email address." });
    }

    // Check if already a member
    const existing = await Member.findOne({ organizationId: invite.organizationId, userId: req.user._id });
    if (existing) {
      await invite.deleteOne();
      return res.status(400).json({ message: "You are already a member of this organization." });
    }

    // Create membership record
    const member = await Member.create({
      organizationId: invite.organizationId,
      userId: req.user._id,
      role: invite.role
    });

    await invite.deleteOne();
    res.status(201).json({ message: "Invitation accepted successfully.", member });
  } catch (error) {
    res.status(500).json({ message: "Error accepting invitation.", error: error.message });
  }
};

const revokeInvitation = async (req, res) => {
  const { inviteId } = req.params;
  try {
    const invite = await Invitation.findById(inviteId);
    if (!invite) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const userRole = await getMemberRole(invite.organizationId, req.user._id);
    if (userRole !== "owner" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    await invite.deleteOne();
    res.json({ message: "Invitation revoked successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error revoking invitation.", error: error.message });
  }
};

module.exports = {
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
  revokeInvitation,
};
