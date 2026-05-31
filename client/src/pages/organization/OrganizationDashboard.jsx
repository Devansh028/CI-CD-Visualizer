import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { 
  createOrg, 
  getMyOrgs, 
  getOrgById, 
  createTeam, 
  assignProjectsToTeam, 
  manageTeamMembers, 
  deleteTeam, 
  updateMemberRole, 
  removeMember, 
  inviteMember, 
  getInvitations, 
  revokeInvitation 
} from "../../api/orgApi";
import { getProjects } from "../../api/projectApi";
import { 
  Users, 
  Plus, 
  Settings, 
  Mail, 
  Trash2, 
  ShieldAlert, 
  UserPlus, 
  FolderPlus, 
  Briefcase, 
  ChevronRight, 
  Check, 
  Loader2,
  X
} from "lucide-react";

const OrganizationDashboard = () => {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [orgData, setOrgData] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  
  // Loading & UI States
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members"); // "members" | "teams"
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  
  // Modals / Dropdowns
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  
  const [showAssignProjModal, setShowAssignProjModal] = useState(false);
  const [activeTeamForProj, setActiveTeamForProj] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  
  const [showAssignMemModal, setShowAssignMemModal] = useState(false);
  const [activeTeamForMem, setActiveTeamForMem] = useState(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  useEffect(() => {
    loadOrgs();
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadOrgDetails(selectedOrgId);
    } else {
      setOrgData(null);
      setInvitations([]);
    }
  }, [selectedOrgId]);

  const loadOrgs = async () => {
    try {
      setIsLoading(true);
      const list = await getMyOrgs();
      setOrgs(list);
      if (list.length > 0) {
        setSelectedOrgId(list[0]._id);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error loading orgs:", err);
      setIsLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const list = await getProjects();
      setAllProjects(list);
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  };

  const loadOrgDetails = async (orgId) => {
    try {
      setIsLoading(true);
      const data = await getOrgById(orgId);
      setOrgData(data);
      
      // Load pending invites if admin/owner
      if (data.role === "owner" || data.role === "admin") {
        const invites = await getInvitations(orgId);
        setInvitations(invites);
      } else {
        setInvitations([]);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading org details:", err);
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      const newOrg = await createOrg({ name: newOrgName.trim() });
      setNewOrgName("");
      setShowCreateOrg(false);
      // Reload lists and select the newly created org
      const list = await getMyOrgs();
      setOrgs(list);
      setSelectedOrgId(newOrg._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create organization.");
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember(selectedOrgId, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      setShowInviteModal(false);
      // Reload invites
      const invites = await getInvitations(selectedOrgId);
      setInvitations(invites);
      alert("Invitation sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send invitation.");
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    try {
      await revokeInvitation(inviteId);
      setInvitations(invitations.filter(i => i._id !== inviteId));
    } catch (err) {
      alert("Failed to revoke invitation.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateMemberRole(selectedOrgId, userId, newRole);
      loadOrgDetails(selectedOrgId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update member role.");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member from the organization?")) return;
    try {
      await removeMember(selectedOrgId, userId);
      loadOrgDetails(selectedOrgId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await createTeam(selectedOrgId, { name: newTeamName.trim() });
      setNewTeamName("");
      setShowTeamModal(false);
      loadOrgDetails(selectedOrgId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create team.");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeam(teamId);
      loadOrgDetails(selectedOrgId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete team.");
    }
  };

  // Assign Projects Modal Methods
  const openAssignProjects = (team) => {
    setActiveTeamForProj(team);
    setSelectedProjectIds(team.projects.map(p => p._id));
    setShowAssignProjModal(true);
  };

  const handleAssignProjects = async () => {
    try {
      await assignProjectsToTeam(activeTeamForProj._id, selectedProjectIds);
      setShowAssignProjModal(false);
      loadOrgDetails(selectedOrgId);
    } catch (err) {
      alert("Failed to assign projects.");
    }
  };

  // Assign Members Modal Methods
  const openAssignMembers = (team) => {
    setActiveTeamForMem(team);
    setSelectedMemberIds(team.members || []);
    setShowAssignMemModal(true);
  };

  const handleAssignMembers = async () => {
    try {
      await manageTeamMembers(activeTeamForMem._id, selectedMemberIds);
      setShowAssignMemModal(false);
      loadOrgDetails(selectedOrgId);
    } catch (err) {
      alert("Failed to update team members.");
    }
  };

  const hasAccess = orgData && (orgData.role === "owner" || orgData.role === "admin");

  return (
    <AppLayout>
      <div className="relative min-h-screen">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none"></div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-500" />
              Team Collaboration
            </h1>
            <p className="text-xs text-gray-400 font-light mt-1">Manage organization structures, role access permissions, and teams.</p>
          </div>

          <div className="flex items-center gap-3">
            {orgs.length > 0 && (
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="rounded-lg border border-white/5 bg-[#12141c]/90 py-2 px-3 text-sm text-gray-300 focus:border-purple-500/80 focus:outline-none cursor-pointer"
              >
                {orgs.map(o => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowCreateOrg(true)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 px-3.5 py-2 text-xs font-semibold text-purple-400 hover:text-white hover:bg-purple-600 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Org
            </button>
          </div>
        </div>

        {/* Create Org Overlay */}
        {showCreateOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#0e1017] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Create New Organization</h3>
                <button onClick={() => setShowCreateOrg(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c] py-2 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 cursor-pointer"
                >
                  Create Organization
                </button>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Loading Organization Workspace...</span>
          </div>
        ) : !orgData ? (
          <div className="text-center py-24 border border-dashed border-white/5 rounded-2xl bg-white/5">
            <p className="text-sm text-gray-500 italic">No organization selected or available. Create one to get started.</p>
          </div>
        ) : (
          <div>
            {/* Org Dashboard Metadata Bar */}
            <div className="rounded-xl border border-white/5 bg-[#0e1017]/40 p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur-xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Current Workspace</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{orgData.organization.name}</h2>
                <p className="text-[10px] text-gray-500 font-mono">Slug: {orgData.organization.slug}</p>
              </div>
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs text-purple-400 font-semibold uppercase tracking-wider">
                Role: {orgData.role}
              </div>
            </div>

            {/* Tabs Control */}
            <div className="flex border-b border-white/5 mb-8">
              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 cursor-pointer ${activeTab === "members" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-white"}`}
              >
                Members & Invites
              </button>
              <button
                onClick={() => setActiveTab("teams")}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 cursor-pointer ${activeTab === "teams" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-white"}`}
              >
                Teams Management
              </button>
            </div>

            {/* MEMBERS TAB */}
            {activeTab === "members" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Members list header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-200">Organization Members</h3>
                  {hasAccess && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white cursor-pointer hover:brightness-110 transition"
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite Member
                    </button>
                  )}
                </div>

                {/* Members Table */}
                <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e1017]/40 backdrop-blur-xl">
                  <table className="min-w-full divide-y divide-white/5 text-left text-xs text-gray-300">
                    <thead className="bg-[#12141c]/50 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role Access</th>
                        {hasAccess && <th className="px-6 py-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orgData.members.map((m) => (
                        <tr key={m._id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img
                              src={m.userId?.avatar || "https://api.dicebear.com/7.x/bottts/svg"}
                              alt=""
                              className="h-7 w-7 rounded-lg border border-white/5"
                            />
                            <span className="font-semibold text-white">{m.userId?.name}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{m.userId?.email}</td>
                          <td className="px-6 py-4">
                            {hasAccess && m.role !== "owner" ? (
                              <select
                                value={m.role}
                                onChange={(e) => handleRoleChange(m.userId._id, e.target.value)}
                                className="rounded bg-[#12141c] border border-white/5 py-1 px-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
                              >
                                <option value="admin">Admin</option>
                                <option value="developer">Developer</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            ) : (
                              <span className="capitalize font-medium">{m.role}</span>
                            )}
                          </td>
                          {hasAccess && (
                            <td className="px-6 py-4 text-right">
                              {m.role !== "owner" && (
                                <button
                                  onClick={() => handleRemoveMember(m.userId._id)}
                                  className="text-rose-400 hover:text-rose-300 p-1 bg-rose-500/10 border border-rose-500/20 rounded cursor-pointer transition duration-200"
                                  title="Remove Member"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pending Invitations list */}
                {hasAccess && invitations.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-bold text-gray-200">Pending Invitations</h3>
                    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e1017]/40">
                      <table className="min-w-full divide-y divide-white/5 text-left text-xs text-gray-300">
                        <thead className="bg-[#12141c]/50 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          <tr>
                            <th className="px-6 py-3">Invited Email</th>
                            <th className="px-6 py-3">Assigned Role</th>
                            <th className="px-6 py-3">Expiration</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {invitations.map((i) => (
                            <tr key={i._id} className="hover:bg-white/5 transition">
                              <td className="px-6 py-3.5 font-medium text-white flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-gray-500" />
                                {i.email}
                              </td>
                              <td className="px-6 py-3.5 capitalize text-indigo-400 font-semibold">{i.role}</td>
                              <td className="px-6 py-3.5 text-gray-500">{new Date(i.expiresAt).toLocaleDateString()}</td>
                              <td className="px-6 py-3.5 text-right">
                                <button
                                  onClick={() => handleRevokeInvite(i._id)}
                                  className="text-rose-400 hover:text-rose-300 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEAMS TAB */}
            {activeTab === "teams" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-200">Organization Teams</h3>
                  {hasAccess && (
                    <button
                      onClick={() => setShowTeamModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white cursor-pointer hover:brightness-110"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Create Team
                    </button>
                  )}
                </div>

                {orgData.teams.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/5 rounded-xl bg-white/5">
                    <p className="text-xs text-gray-500 italic">No teams created in this organization yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {orgData.teams.map((team) => (
                      <div
                        key={team._id}
                        className="rounded-2xl border border-white/5 bg-[#0e1017]/70 p-6 backdrop-blur-xl flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-white text-base">{team.name}</h4>
                            {hasAccess && (
                              <button
                                onClick={() => handleDeleteTeam(team._id)}
                                className="text-rose-400 hover:text-rose-300 p-1.5 bg-rose-500/10 border border-rose-500/20 rounded cursor-pointer transition"
                                title="Delete Team"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Team Members List */}
                          <div className="mb-4">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-purple-400 block mb-1">
                              Members ({team.members ? team.members.length : 0})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {(!team.members || team.members.length === 0) ? (
                                <span className="text-[10px] text-gray-500 italic">No members assigned</span>
                              ) : (
                                team.members.map((userId) => {
                                  const orgMember = orgData.members.find(m => m.userId?._id === userId);
                                  return (
                                    <span 
                                      key={userId} 
                                      className="inline-block px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] text-gray-300 font-medium"
                                      title={orgMember?.userId?.email}
                                    >
                                      {orgMember?.userId?.name || "User"}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Team Projects List */}
                          <div className="mb-6">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 block mb-1">
                              Projects ({team.projects ? team.projects.length : 0})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {(!team.projects || team.projects.length === 0) ? (
                                <span className="text-[10px] text-gray-500 italic">No projects assigned</span>
                              ) : (
                                team.projects.map((proj) => (
                                  <span 
                                    key={proj._id} 
                                    className="inline-block px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-300 font-bold"
                                  >
                                    {proj.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {hasAccess && (
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <button
                              onClick={() => openAssignMembers(team)}
                              className="w-full text-center py-2 text-[10px] font-bold bg-[#12141c] hover:bg-white/5 text-gray-300 border border-white/5 rounded-lg transition cursor-pointer"
                            >
                              Edit Members
                            </button>
                            <button
                              onClick={() => openAssignProjects(team)}
                              className="w-full text-center py-2 text-[10px] font-bold bg-[#12141c] hover:bg-white/5 text-gray-300 border border-white/5 rounded-lg transition cursor-pointer"
                            >
                              Edit Projects
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* INVITE MEMBER MODAL */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#0e1017] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Invite Team Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="developer@acme.com"
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c] py-2.5 px-3 text-xs placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">Select Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="block w-full rounded-lg border border-white/5 bg-[#12141c] py-2.5 px-3 text-xs text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="admin">Admin (Manage Team & Deployments)</option>
                    <option value="developer">Developer (Deploy Projects & View Stats)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 cursor-pointer"
                >
                  Send Organization Invitation
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CREATE TEAM MODAL */}
        {showTeamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#0e1017] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Create New Team</h3>
                <button onClick={() => setShowTeamModal(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Frontend Team"
                  className="block w-full rounded-lg border border-white/5 bg-[#12141c] py-2 px-3 text-sm placeholder-gray-600 text-gray-200 focus:border-purple-500/80 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 cursor-pointer"
                >
                  Create Team
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ASSIGN PROJECTS TO TEAM MODAL */}
        {showAssignProjModal && activeTeamForProj && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0e1017] p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm">Assign Projects to {activeTeamForProj.name}</h3>
                  <button onClick={() => setShowAssignProjModal(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1">
                  {allProjects.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No projects found in visualizer catalog.</p>
                  ) : (
                    allProjects.map((p) => {
                      const isChecked = selectedProjectIds.includes(p._id);
                      return (
                        <div 
                          key={p._id}
                          onClick={() => {
                            setSelectedProjectIds(
                              isChecked 
                                ? selectedProjectIds.filter(id => id !== p._id) 
                                : [...selectedProjectIds, p._id]
                            );
                          }}
                          className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition ${isChecked ? "bg-purple-500/5 border-purple-500/30" : "bg-[#12141c] border-white/5 hover:bg-white/5"}`}
                        >
                          <div>
                            <div className="text-xs font-bold text-gray-200">{p.name}</div>
                            <div className="text-[10px] text-gray-500">{p.framework} • Port: {p.deployPort}</div>
                          </div>
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${isChecked ? "bg-purple-600 border-purple-500 text-white" : "border-white/10 bg-transparent"}`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <button
                onClick={handleAssignProjects}
                className="w-full mt-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 cursor-pointer"
              >
                Save Project Assignments
              </button>
            </div>
          </div>
        )}

        {/* ASSIGN MEMBERS TO TEAM MODAL */}
        {showAssignMemModal && activeTeamForMem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0e1017] p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm">Assign Members to {activeTeamForMem.name}</h3>
                  <button onClick={() => setShowAssignMemModal(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1">
                  {orgData.members.map((m) => {
                    const isChecked = selectedMemberIds.includes(m.userId._id);
                    return (
                      <div 
                        key={m._id}
                        onClick={() => {
                          setSelectedMemberIds(
                            isChecked 
                              ? selectedMemberIds.filter(id => id !== m.userId._id) 
                              : [...selectedMemberIds, m.userId._id]
                          );
                        }}
                        className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition ${isChecked ? "bg-purple-500/5 border-purple-500/30" : "bg-[#12141c] border-white/5 hover:bg-white/5"}`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={m.userId.avatar || "https://api.dicebear.com/7.x/bottts/svg"}
                            className="h-6 w-6 rounded"
                            alt=""
                          />
                          <div>
                            <div className="text-xs font-bold text-gray-200">{m.userId.name}</div>
                            <div className="text-[10px] text-gray-500">{m.userId.email} • {m.role}</div>
                          </div>
                        </div>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${isChecked ? "bg-purple-600 border-purple-500 text-white" : "border-white/10 bg-transparent"}`}>
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={handleAssignMembers}
                className="w-full mt-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 cursor-pointer"
              >
                Save Member Assignments
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default OrganizationDashboard;
