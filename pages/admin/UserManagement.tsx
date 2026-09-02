import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import {
  Search,
  Filter,
  ShieldCheck,
  Ban,
  ShieldAlert,
  XCircle,
  User,
  Calendar,
  X,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Download,
  Shield,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const UserManagement: React.FC = () => {
  const { isAdmin, user, loading: authLoading } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleError, setRoleError] = useState<string>("");
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listUsers();
      data.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      setUsers(data);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreUsers = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listUsers(lastDoc);
      data.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      setUsers((prev) => [...prev, ...data]);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Error fetching more users", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) fetchUsers();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    let result = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q)),
      );
    }
    if (roleFilter !== "ALL") {
      result = result.filter(
        (u) => (u.role || "PLAYER").toUpperCase() === roleFilter.toUpperCase(),
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter(
        (u) =>
          (u.status || "ACTIVE").toUpperCase() === statusFilter.toUpperCase(),
      );
    }
    setFilteredUsers(result);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const handleSelectUser = async (userRecord: any) => {
    setSelectedUser(userRecord);
    setSelectedRole((userRecord.role || "PLAYER").toUpperCase());
    setRoleError("");
    setLoadingDetails(true);
    try {
      const bookings = await adminService.getUserRecentBookings(userRecord.id);
      setUserBookings(bookings);
    } catch (err) {
      console.error("Failed to fetch user bookings", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await adminService.updateUserStatus(userId, newStatus, user.uid, "User");
      const updated = users.map((u) =>
        u.id === userId ? { ...u, status: newStatus } : u,
      );
      setUsers(updated);
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
      showToast("success", `User status updated to ${newStatus}.`);
    } catch (error) {
      showToast("error", "Failed to update user status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleVerified = async (userId: string, currentVerified: boolean) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await adminService.setUserVerified(userId, !currentVerified, user.uid, "User");
      const updated = users.map((u) =>
        u.id === userId ? { ...u, isVerified: !currentVerified } : u,
      );
      setUsers(updated);
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, isVerified: !currentVerified });
      }
      showToast("success", !currentVerified ? "User marked as verified." : "Verification revoked.");
    } catch (error) {
      showToast("error", "Failed to toggle verification.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!user || !selectedUser || !selectedRole) return;
    setRoleError("");
    setIsUpdating(true);
    try {
      const check = await adminService.checkCanChangeAdminRole(selectedUser.id);
      if (!check.canChange) {
        setRoleError(check.message || "Cannot change role of last admin.");
        setIsUpdating(false);
        return;
      }
      await adminService.updateUserRole(
        selectedUser.id,
        selectedRole,
        user.uid,
        user.email || undefined,
        selectedUser.role || "PLAYER",
      );
      const updated = users.map((u) =>
        u.id === selectedUser.id ? { ...u, role: selectedRole } : u,
      );
      setUsers(updated);
      setSelectedUser({ ...selectedUser, role: selectedRole });
      showToast("success", `Role successfully updated to ${selectedRole}.`);
    } catch (error: any) {
      setRoleError(error.message || "Failed to update role.");
      showToast("error", error?.message || "Failed to update role.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID,Name,Email,Phone,Role,Status,Verified,CreatedAt"];
    const rows = filteredUsers.map((u) =>
      [
        `"${u.id || ""}"`,
        `"${u.name || ""}"`,
        `"${u.email || ""}"`,
        `"${u.phone || ""}"`,
        `"${u.role || "PLAYER"}"`,
        `"${u.status || "ACTIVE"}"`,
        `"${u.isVerified ? "YES" : "NO"}"`,
        `"${u.createdAt || ""}"`,
      ].join(","),
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pitchly-users-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) return null;

  const totalPlayers = users.filter((u) => (u.role || "PLAYER").toUpperCase() === "PLAYER").length;
  const totalOwners = users.filter((u) => (u.role || "").toUpperCase() === "OWNER").length;
  const totalAdmins = users.filter((u) => ["ADMIN", "SUPER_ADMIN"].includes((u.role || "").toUpperCase())).length;

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30 uppercase tracking-wider">
              Identity Management
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Roles &amp; Access Controls
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            User Accounts
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Manage player profiles, assign roles, toggle verification badges, and oversee suspensions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-card rounded-xl p-3 border border-border-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Total Users
          </span>
          <span className="text-lg font-extrabold text-text-primary">{users.length}</span>
        </div>
        <div className="bg-surface-card rounded-xl p-3 border border-border-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Players
          </span>
          <span className="text-lg font-extrabold text-[#38BDF8]">{totalPlayers}</span>
        </div>
        <div className="bg-surface-card rounded-xl p-3 border border-border-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Pitch Owners
          </span>
          <span className="text-lg font-extrabold text-primary-lime">{totalOwners}</span>
        </div>
        <div className="bg-surface-card rounded-xl p-3 border border-border-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
            Admins
          </span>
          <span className="text-lg font-extrabold text-[#A78BFA]">{totalAdmins}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Search user by name, email, phone, UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary font-semibold outline-none focus:border-[#A78BFA] transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-[#A78BFA] cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="PLAYER">Players</option>
              <option value="OWNER">Pitch Owners</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-[#A78BFA] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#A78BFA] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 text-center border border-border-subtle max-w-lg mx-auto">
          <User size={40} className="text-text-tertiary mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-bold text-text-primary mb-1">No users found</h2>
          <p className="text-xs text-text-secondary">
            Adjust your search query or filter parameters.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-raised border-b border-border-subtle">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    User &amp; Contacts
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Role
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Verification
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Account Status
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface-raised/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center font-bold text-xs text-text-primary shrink-0">
                          {u.name?.charAt(0) || u.email?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary text-xs truncate max-w-[180px]">
                            {u.name || "Unnamed User"}
                          </div>
                          <div className="text-[11px] text-text-secondary truncate max-w-[180px]">
                            {u.email || "No email"}
                          </div>
                          {u.phone && (
                            <div className="text-[10px] text-text-tertiary truncate">
                              {u.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          (u.role || "").toUpperCase() === "ADMIN" ||
                          (u.role || "").toUpperCase() === "SUPER_ADMIN"
                            ? "bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30"
                            : (u.role || "").toUpperCase() === "OWNER"
                              ? "bg-primary-lime/10 text-primary-lime border border-primary-lime/30"
                              : "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30"
                        }`}
                      >
                        {u.role || "PLAYER"}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-text-tertiary bg-surface-raised border border-border-subtle px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Standard
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          (u.status || "ACTIVE").toUpperCase() === "ACTIVE"
                            ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                            : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"
                        }`}
                      >
                        {u.status || "ACTIVE"}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleSelectUser(u)}
                        className="bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="p-4 flex justify-center border-t border-border-subtle bg-surface-card">
              <button
                onClick={fetchMoreUsers}
                disabled={loadingMore}
                className="bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Accounts"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Management Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 bg-app-base/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface-card w-full max-w-lg h-full border-l border-border-subtle flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-raised shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30 uppercase tracking-wider">
                  Account Supervision
                </span>
                <h2 className="text-sm font-bold text-text-primary truncate max-w-[240px]">
                  {selectedUser.name || "User Details"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {/* Profile Card */}
              <div className="flex items-center gap-4 bg-surface-raised p-4 rounded-2xl border border-border-subtle">
                <div className="w-14 h-14 rounded-2xl bg-surface-card border border-border-subtle flex items-center justify-center font-extrabold text-lg text-text-primary shrink-0">
                  {selectedUser.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-text-primary truncate">
                    {selectedUser.name || "Unnamed User"}
                  </h3>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {selectedUser.email || "No email registered"}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-1 font-mono truncate">
                    UID: {selectedUser.id}
                  </p>
                </div>
              </div>

              {/* Quick Actions / Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    handleToggleVerified(selectedUser.id, !!selectedUser.isVerified)
                  }
                  disabled={isUpdating}
                  className={`p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                    selectedUser.isVerified
                      ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                      : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{selectedUser.isVerified ? "Verified Badge (Active)" : "Set Verified Badge"}</span>
                </button>

                <button
                  onClick={() =>
                    handleUpdateStatus(
                      selectedUser.id,
                      selectedUser.status === "suspended" ? "active" : "suspended",
                    )
                  }
                  disabled={isUpdating}
                  className={`p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                    selectedUser.status === "suspended"
                      ? "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]"
                      : "bg-surface-raised border-border-subtle text-[#EF4444] hover:bg-[#EF4444]/10"
                  }`}
                >
                  <Ban size={16} />
                  <span>
                    {selectedUser.status === "suspended"
                      ? "Reactivate Account"
                      : "Suspend Account"}
                  </span>
                </button>
              </div>

              {/* Role Assignment */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Role Assignment
                </h4>
                <div className="flex gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary font-bold outline-none focus:border-[#A78BFA]"
                  >
                    <option value="PLAYER">PLAYER (Standard User)</option>
                    <option value="OWNER">OWNER (Pitch / Turf Operator)</option>
                    <option value="ADMIN">ADMIN (Moderator / Staff)</option>
                  </select>
                  <button
                    onClick={handleUpdateRole}
                    disabled={isUpdating || selectedRole === (selectedUser.role || "PLAYER").toUpperCase()}
                    className="bg-primary-lime hover:bg-primary-lime/90 text-accent-text px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Save Role
                  </button>
                </div>
                {roleError && (
                  <p className="text-xs text-[#EF4444] font-medium">{roleError}</p>
                )}
              </div>

              {/* Recent Bookings Activity */}
              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 border-b border-border-subtle pb-1.5 flex items-center justify-between">
                  <span>Recent Match Bookings</span>
                  <span className="text-[10px] text-text-tertiary">
                    {userBookings.length} recorded
                  </span>
                </h4>

                {loadingDetails ? (
                  <div className="text-xs text-text-tertiary py-3">
                    Loading booking history...
                  </div>
                ) : userBookings.length === 0 ? (
                  <div className="text-xs text-text-tertiary p-3 bg-surface-raised rounded-xl border border-border-subtle">
                    No match booking history found for this account.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                    {userBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-text-primary">
                            {b.turfName || "Pitch Booking"}
                          </div>
                          <div className="text-[10px] text-text-tertiary mt-0.5">
                            {b.date} • {b.timeCode || b.time || "Slot"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-lime font-mono">
                            UGX {Number(b.price || 0).toLocaleString()}
                          </div>
                          <span className="text-[9px] font-bold uppercase text-text-secondary">
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Dynamic Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[130] animate-fadeIn max-w-sm">
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 shadow-2xl ${
              toast.type === "success"
                ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]"
                : toast.type === "error"
                ? "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]"
                : "bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-[#22C55E]" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-[#EF4444]" />
            )}
            <p className="text-xs font-bold text-text-primary flex-1">
              {toast.message}
            </p>
            <button onClick={() => setToast(null)} className="p-1 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
