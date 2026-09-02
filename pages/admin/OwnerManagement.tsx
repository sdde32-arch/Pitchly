import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import {
  Search,
  ShieldCheck,
  Ban,
  Building,
  X,
  MapPin,
  Phone,
  Mail,
  Wallet,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ChevronRight,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const OwnerManagement: React.FC = () => {
  const { isAdmin, user, loading: authLoading } = useUser();
  const navigate = useNavigate();
  const [owners, setOwners] = useState<any[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
  const [ownerPitches, setOwnerPitches] = useState<any[]>([]);
  const [ownerStaff, setOwnerStaff] = useState<any[]>([]);
  const [ownerBookingsCount, setOwnerBookingsCount] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const data = await adminService.listOwners();
      data.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      setOwners(data);
      setFilteredOwners(data);
    } catch (error) {
      console.error("Error fetching owners", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) fetchOwners();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    let result = owners;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q)) ||
          (u.businessProfile?.businessName &&
            u.businessProfile.businessName.toLowerCase().includes(q)),
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter(
        (u) =>
          (u.status || "ACTIVE").toUpperCase() === statusFilter.toUpperCase(),
      );
    }
    setFilteredOwners(result);
  }, [searchQuery, statusFilter, owners]);

  const handleSelectOwner = async (owner: any) => {
    setSelectedOwner(owner);
    setLoadingDetails(true);
    try {
      const [pitches, staff, bookingsCount] = await Promise.all([
        adminService.getOwnerPitches(owner.id),
        adminService.getOwnerStaff(owner.id),
        adminService.getOwnerBookingsCount(owner.id),
      ]);
      setOwnerPitches(pitches);
      setOwnerStaff(staff);
      setOwnerBookingsCount(bookingsCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await adminService.updateUserStatus(userId, newStatus, user.uid, "Owner");
      const updated = owners.map((u) =>
        u.id === userId ? { ...u, status: newStatus } : u,
      );
      setOwners(updated);
      if (selectedOwner?.id === userId) {
        setSelectedOwner({ ...selectedOwner, status: newStatus });
      }
      showToast("success", `Owner status changed to ${newStatus}.`);
    } catch (error) {
      showToast("error", "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleVerified = async (userId: string, currentVerified: boolean) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await adminService.setUserVerified(userId, !currentVerified, user.uid, "Owner");
      const updated = owners.map((u) =>
        u.id === userId ? { ...u, isVerified: !currentVerified } : u,
      );
      setOwners(updated);
      if (selectedOwner?.id === userId) {
        setSelectedOwner({ ...selectedOwner, isVerified: !currentVerified });
      }
      showToast("success", !currentVerified ? "Owner certified & verified." : "Verification revoked.");
    } catch (error) {
      showToast("error", "Failed to toggle verification");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID,BusinessName,OwnerName,Email,Phone,Status,Verified,CreatedAt"];
    const rows = filteredOwners.map((o) =>
      [
        `"${o.id || ""}"`,
        `"${o.businessProfile?.businessName || o.name || ""}"`,
        `"${o.name || ""}"`,
        `"${o.email || ""}"`,
        `"${o.phone || ""}"`,
        `"${o.status || "ACTIVE"}"`,
        `"${o.isVerified ? "YES" : "NO"}"`,
        `"${o.createdAt || ""}"`,
      ].join(","),
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pitchly-owners-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) return null;

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-lime/10 text-primary-lime border border-primary-lime/30 uppercase tracking-wider">
              Facility Partners
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Turf Owners &amp; Business Operators
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Pitch Owners
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Monitor registered facility businesses, staff members, payout details, and operational status.
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

      {/* Filter / Search Bar */}
      <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Search by business name, owner, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary font-semibold outline-none focus:border-[#A78BFA] transition-colors"
            />
          </div>

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

      {/* Owners Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-lime border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredOwners.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 text-center border border-border-subtle max-w-lg mx-auto">
          <Building size={40} className="text-text-tertiary mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-bold text-text-primary mb-1">No owners found</h2>
          <p className="text-xs text-text-secondary">
            Adjust your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-raised border-b border-border-subtle">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Business &amp; Partner
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Contact Channels
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Verified Partner
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Status
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredOwners.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-surface-raised/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-lime/10 border border-primary-lime/30 text-primary-lime flex items-center justify-center font-bold text-xs shrink-0">
                          {o.businessProfile?.businessName?.charAt(0) || o.name?.charAt(0) || "B"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary text-xs truncate max-w-[180px]">
                            {o.businessProfile?.businessName || o.name || "Turf Business"}
                          </div>
                          <div className="text-[11px] text-text-secondary truncate max-w-[180px]">
                            Operator: {o.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-xs text-text-secondary">
                      <div className="truncate max-w-[160px]">{o.email}</div>
                      {o.phone && (
                        <div className="text-[10px] text-primary-lime font-bold mt-0.5">
                          {o.phone}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      {o.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          <CheckCircle2 size={11} /> Certified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-text-tertiary bg-surface-raised border border-border-subtle px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          (o.status || "ACTIVE").toUpperCase() === "ACTIVE"
                            ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                            : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"
                        }`}
                      >
                        {o.status || "ACTIVE"}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleSelectOwner(o)}
                        className="bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Owner Detail Drawer */}
      {selectedOwner && (
        <div className="fixed inset-0 bg-app-base/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface-card w-full max-w-lg h-full border-l border-border-subtle flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-raised shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-lime/10 text-primary-lime border border-primary-lime/30 uppercase tracking-wider">
                  Partner Overview
                </span>
                <h2 className="text-sm font-bold text-text-primary truncate max-w-[240px]">
                  {selectedOwner.businessProfile?.businessName || selectedOwner.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOwner(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {/* Partner Profile Box */}
              <div className="bg-surface-raised p-4 rounded-2xl border border-border-subtle space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-lime/10 border border-primary-lime/30 text-primary-lime flex items-center justify-center font-extrabold text-base shrink-0">
                    <Building size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {selectedOwner.businessProfile?.businessName || "Registered Pitch Business"}
                    </h3>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      Operator: {selectedOwner.name}
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail size={13} className="text-text-tertiary" />
                    <span>{selectedOwner.email}</span>
                  </div>
                  {selectedOwner.phone && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Phone size={13} className="text-primary-lime" />
                      <a href={`tel:${selectedOwner.phone}`} className="hover:underline text-primary-lime font-bold">
                        {selectedOwner.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Certification Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    handleToggleVerified(selectedOwner.id, !!selectedOwner.isVerified)
                  }
                  disabled={isUpdating}
                  className={`p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                    selectedOwner.isVerified
                      ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                      : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{selectedOwner.isVerified ? "Certified Partner" : "Certify Partner"}</span>
                </button>

                <button
                  onClick={() =>
                    handleUpdateStatus(
                      selectedOwner.id,
                      selectedOwner.status === "suspended" ? "active" : "suspended",
                    )
                  }
                  disabled={isUpdating}
                  className={`p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                    selectedOwner.status === "suspended"
                      ? "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]"
                      : "bg-surface-raised border-border-subtle text-[#EF4444] hover:bg-[#EF4444]/10"
                  }`}
                >
                  <Ban size={16} />
                  <span>
                    {selectedOwner.status === "suspended"
                      ? "Reactivate Partner"
                      : "Suspend Partner"}
                  </span>
                </button>
              </div>

              {/* Pitches Roster */}
              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 border-b border-border-subtle pb-1.5 flex items-center justify-between">
                  <span>Pitches Under Management</span>
                  <span className="text-[10px] text-text-tertiary">
                    {ownerPitches.length} facilities
                  </span>
                </h4>

                {loadingDetails ? (
                  <div className="text-xs text-text-tertiary py-3">Loading facilities...</div>
                ) : ownerPitches.length === 0 ? (
                  <div className="text-xs text-text-tertiary p-3 bg-surface-raised rounded-xl border border-border-subtle">
                    No pitches uploaded yet by this partner.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ownerPitches.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-card shrink-0 border border-border-subtle">
                            <img
                              src={(p.images && p.images[0]) || p.image || "/placeholder-pitch.png"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-text-primary truncate">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-text-secondary truncate">
                              {p.location || "Kampala"} • UGX {Number(p.pricePerHour || 0).toLocaleString()}/hr
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-card text-text-secondary border border-border-subtle shrink-0">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Staff Roster */}
              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 border-b border-border-subtle pb-1.5 flex items-center justify-between">
                  <span>Delegated Staff Members</span>
                  <span className="text-[10px] text-text-tertiary">
                    {ownerStaff.length} members
                  </span>
                </h4>

                {loadingDetails ? (
                  <div className="text-xs text-text-tertiary py-3">Loading staff...</div>
                ) : ownerStaff.length === 0 ? (
                  <div className="text-xs text-text-tertiary p-3 bg-surface-raised rounded-xl border border-border-subtle">
                    No secondary staff members assigned.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ownerStaff.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-text-primary">{s.name}</div>
                          <div className="text-[10px] text-text-secondary">{s.email || s.phone}</div>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-surface-card rounded border border-border-subtle">
                          {s.role || "Staff"}
                        </span>
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
