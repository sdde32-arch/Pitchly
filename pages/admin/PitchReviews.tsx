import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import {
  ShieldCheck,
  XCircle,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Phone,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  X,
  Building2,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Check,
  Send,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export const PitchReviews: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useUser();
  const [pitches, setPitches] = useState<any[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<any[]>([]);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING_APPROVAL" | "PENDING_INSPECTION" | "CHANGES_REQUESTED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPitch, setSelectedPitch] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Template change requests
  const quickChangeTemplates = [
    "Please upload higher resolution photos of the turf surface and goalposts.",
    "Please verify operating hours and ensure peak pricing matches standard rates.",
    "Please update your mobile money payout number under business settings.",
    "Physical inspection failed due to missing floodlights/changing room access.",
  ];

  const fetchPitches = async () => {
    setLoading(true);
    try {
      const fbPitches = await adminService.listPendingPitches();
      const mapped = fbPitches.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        name: p.name,
        location: p.location,
        fullAddress: p.fullAddress || p.location,
        pricePerHour: p.pricePerHour,
        images: p.images && p.images.length > 0 ? p.images : ((p as any).image ? [(p as any).image] : []),
        image: (p.images && p.images[0]) || (p as any).image || "/placeholder-pitch.png",
        status: p.status as any,
        contactPhone: (p as any).contactPhone || (p as any).phone || "",
        submittedAt: p.createdAt,
        ownerName: (p as any).ownerName || "Owner (" + (p.ownerId?.substring(0, 6) || "ID") + ")",
        turfType: (p as any).turfType || "Artificial Turf",
        size: (p as any).size || "7-a-side",
        amenities: (p as any).amenities || [],
        openingHours: (p as any).openingHours || (p as any).operatingHours || { open: "06:00", close: "23:00" },
        changeRequestMessage: (p as any).changeRequestMessage,
      }));

      mapped.sort(
        (a: any, b: any) =>
          new Date(b.submittedAt || 0).getTime() -
          new Date(a.submittedAt || 0).getTime(),
      );
      setPitches(mapped);
    } catch (error: any) {
      console.error("Error fetching pending pitches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) fetchPitches();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    let result = pitches;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.ownerName?.toLowerCase().includes(q) ||
          p.contactPhone?.toLowerCase().includes(q)
      );
    }

    if (filter !== "ALL") {
      result = result.filter((p) => {
        const s = (p.status || "").toUpperCase();
        if (filter === "PENDING_APPROVAL") {
          return s === "PENDING_APPROVAL" || s === "PENDING_REVIEW";
        }
        if (filter === "PENDING_INSPECTION") {
          return s === "PENDING_INSPECTION";
        }
        if (filter === "CHANGES_REQUESTED") {
          return s === "CHANGES_REQUESTED";
        }
        return s === filter;
      });
    }

    setFilteredPitches(result);
  }, [searchQuery, filter, pitches]);

  const handleUpdateStatus = async (
    pitchId: string,
    newStatus: string,
    stage: string,
    reason?: string,
  ) => {
    if (!user) return;
    setIsUpdating(true);
    setUpdateError("");
    const defaultReason =
      newStatus === "REJECTED"
        ? "Pitch rejected during admin review."
        : "Changes requested by administrator.";
    const finalReason = reason && reason.trim() ? reason.trim() : defaultReason;

    try {
      if (newStatus === "ACTIVE" || newStatus === "approved") {
        await adminService.approvePitch(pitchId, user.uid);
        showToast("success", "Pitch approved and live for booking!");
      } else if (newStatus === "REJECTED" || newStatus === "rejected") {
        await adminService.rejectPitch(pitchId, user.uid, finalReason);
        showToast("info", "Pitch listing rejected.");
      } else if (newStatus === "changes_requested") {
        await adminService.requestPitchChanges(pitchId, user.uid, finalReason);
        showToast("info", "Modification request sent to pitch owner.");
      } else if (newStatus === "PENDING_INSPECTION") {
        // Move to Stage 2 Inspection
        await adminService.requestPitchChanges(
          pitchId,
          user.uid,
          "Stage 1 Details Approved. Pending physical ground inspection."
        );
        showToast("success", "Stage 1 approved. Scheduled for physical inspection.");
      }
      await fetchPitches();
      setSelectedPitch(null);
      setRejectionReason("");
    } catch (error: any) {
      console.error("Failed to update pitch status:", error);
      setUpdateError(error.message || "Failed to update pitch status. Please try again.");
      showToast("error", error?.message || "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-text-primary">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30 uppercase tracking-wider">
              Verification Engine
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Stage 1 (Review) &amp; Stage 2 (Inspection)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Pitch Certifications
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Inspect facility information, turf quality, amenities, and certify venues for player booking.
          </p>
        </div>
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
              placeholder="Search pitch by name, location, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary font-semibold outline-none focus:border-[#A78BFA] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === "ALL"
                  ? "bg-[#A78BFA] text-accent-text shadow-xs font-extrabold"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              All Queue ({pitches.length})
            </button>
            <button
              onClick={() => setFilter("PENDING_APPROVAL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === "PENDING_APPROVAL"
                  ? "bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/30"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              Stage 1: Review
            </button>
            <button
              onClick={() => setFilter("PENDING_INSPECTION")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === "PENDING_INSPECTION"
                  ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              Stage 2: Inspection
            </button>
            <button
              onClick={() => setFilter("CHANGES_REQUESTED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === "CHANGES_REQUESTED"
                  ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              Changes Requested
            </button>
          </div>
        </div>
      </div>

      {/* Main Pitch Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#A78BFA] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPitches.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 text-center border border-border-subtle max-w-lg mx-auto">
          <ShieldCheck
            size={40}
            className="text-text-tertiary mx-auto mb-3 opacity-60"
          />
          <h2 className="text-base font-bold text-text-primary mb-1">
            No pitches in review queue
          </h2>
          <p className="text-xs text-text-secondary">
            All submitted pitches have been reviewed and processed.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-raised border-b border-border-subtle">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Pitch &amp; Owner
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Location &amp; Rate
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Submission Stage
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Contact
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredPitches.map((pitch) => (
                  <tr
                    key={pitch.id}
                    className="hover:bg-surface-raised/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-card shrink-0 border border-border-subtle">
                          <img
                            src={pitch.image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-pitch.png";
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text-primary text-xs truncate max-w-[180px]">
                            {pitch.name}
                          </div>
                          <div className="text-[11px] text-text-secondary truncate max-w-[180px]">
                            {pitch.ownerName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs font-semibold text-text-primary truncate max-w-[160px]">
                        {pitch.location || "Kampala"}
                      </div>
                      <div className="text-[10px] text-primary-lime font-bold mt-0.5">
                        UGX {Number(pitch.pricePerHour || 0).toLocaleString()} / hr
                      </div>
                    </td>

                    <td className="p-3.5">
                      {pitch.status === "PENDING_APPROVAL" ||
                      pitch.status === "pending_review" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30">
                          Stage 1 Review
                        </span>
                      ) : pitch.status === "PENDING_INSPECTION" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                          Stage 2 Inspection
                        </span>
                      ) : pitch.status === "changes_requested" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                          Changes Needed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-raised text-text-secondary border border-border-subtle">
                          {(pitch.status || "").replace(/_/g, " ")}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-xs text-text-secondary font-medium">
                      {pitch.contactPhone ? (
                        <a
                          href={`tel:${pitch.contactPhone}`}
                          className="text-text-primary hover:text-primary-lime underline"
                        >
                          {pitch.contactPhone}
                        </a>
                      ) : (
                        <span className="text-text-tertiary">Not provided</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPitch(pitch);
                          setActiveImageIndex(0);
                        }}
                        className="bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Inspect &amp; Certify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pitch Review Drawer / Modal */}
      {selectedPitch && (
        <div className="fixed inset-0 bg-app-base/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface-card w-full max-w-2xl h-full border-l border-border-subtle flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-raised shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30 uppercase tracking-wider">
                  Pitch Certification
                </span>
                <h2 className="text-sm font-bold text-text-primary truncate max-w-[300px]">
                  {selectedPitch.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPitch(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {/* Image Gallery with Zoom trigger */}
              <div>
                <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-surface-raised border border-border-subtle group">
                  <img
                    src={
                      (selectedPitch.images && selectedPitch.images[activeImageIndex]) ||
                      selectedPitch.image ||
                      "/placeholder-pitch.png"
                    }
                    alt={selectedPitch.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() =>
                      setEnlargedImage(
                        (selectedPitch.images && selectedPitch.images[activeImageIndex]) ||
                          selectedPitch.image
                      )
                    }
                  />
                  <div className="absolute top-3 right-3 bg-app-base/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-text-primary border border-border-subtle">
                    Click to zoom
                  </div>
                </div>

                {selectedPitch.images && selectedPitch.images.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar py-1">
                    {selectedPitch.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                          activeImageIndex === idx
                            ? "border-primary-lime ring-2 ring-primary-lime/30"
                            : "border-border-subtle opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                    Hourly Rate
                  </span>
                  <div className="text-sm font-extrabold text-primary-lime">
                    UGX {Number(selectedPitch.pricePerHour || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                    Surface Type
                  </span>
                  <div className="text-xs font-bold text-text-primary">
                    {selectedPitch.turfType || "Artificial 3G"}
                  </div>
                </div>

                <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                    Pitch Format
                  </span>
                  <div className="text-xs font-bold text-text-primary">
                    {selectedPitch.size || "7-a-side"}
                  </div>
                </div>
              </div>

              {/* Address & Contact Information */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-2.5">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Location &amp; Owner Contacts
                </h3>
                <div className="text-xs space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-text-tertiary shrink-0 mt-0.5" />
                    <span className="text-text-primary font-medium">
                      {selectedPitch.fullAddress || selectedPitch.location || "Kampala"}
                    </span>
                  </div>
                  {selectedPitch.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-primary-lime shrink-0" />
                      <a
                        href={`tel:${selectedPitch.contactPhone}`}
                        className="text-primary-lime font-bold hover:underline"
                      >
                        {selectedPitch.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities & Facility Features */}
              <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Amenities Checklist
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedPitch.amenities || []).length === 0 ? (
                    <span className="text-xs text-text-tertiary">
                      Standard football facilities.
                    </span>
                  ) : (
                    selectedPitch.amenities.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-raised border border-border-subtle text-text-primary flex items-center gap-1.5"
                      >
                        <Check size={12} className="text-primary-lime" />
                        <span>{item}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Error Box */}
              {updateError && (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-xs font-bold text-[#EF4444] flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{updateError}</span>
                </div>
              )}

              {/* Action Stage Controls */}
              <div className="border-t border-border-subtle pt-4 space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Certification Decision
                </h3>

                {selectedPitch.status === "PENDING_APPROVAL" ||
                selectedPitch.status === "pending_review" ? (
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedPitch.id,
                          "PENDING_INSPECTION",
                          "PENDING_INSPECTION",
                        )
                      }
                      disabled={isUpdating}
                      className="w-full bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-app-base py-3 rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isUpdating
                        ? "Processing..."
                        : "Approve Details → Advance to Stage 2 Inspection"}
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedPitch.id, "ACTIVE", "ACTIVE")
                      }
                      disabled={isUpdating}
                      className="w-full bg-primary-lime hover:bg-primary-lime/90 text-accent-text py-3 rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isUpdating ? "Certifying..." : "Fast-Track & Fully Certify Pitch"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedPitch.id, "ACTIVE", "ACTIVE")
                    }
                    disabled={isUpdating}
                    className="w-full bg-primary-lime hover:bg-primary-lime/90 text-accent-text py-3 rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isUpdating ? "Certifying..." : "Pass Inspection & Certify Pitch"}
                  </button>
                )}

                {/* Change Request or Rejection Box */}
                <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-3">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                    Request Changes or Reject
                  </span>

                  {/* Preset quick templates */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickChangeTemplates.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => setRejectionReason(tpl)}
                        className="text-[10px] text-text-secondary hover:text-text-primary bg-surface-card hover:bg-border-subtle px-2 py-1 rounded-lg border border-border-subtle transition-colors text-left"
                      >
                        + {tpl.substring(0, 35)}...
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide specific details or feedback for the pitch owner..."
                    className="w-full bg-surface-card border border-border-subtle rounded-xl p-3 text-xs text-text-primary font-medium outline-none focus:border-[#A78BFA] transition-colors resize-none"
                    rows={3}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedPitch.id,
                          "changes_requested",
                          "changes_requested",
                          rejectionReason,
                        )
                      }
                      disabled={isUpdating}
                      className="flex-1 bg-[#FACC15]/10 hover:bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/30 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedPitch.id,
                          "REJECTED",
                          "REJECTED",
                          rejectionReason,
                        )
                      }
                      disabled={isUpdating}
                      className="flex-1 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject Submission
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 z-50 bg-app-base/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-6 w-10 h-10 bg-surface-card hover:bg-surface-raised border border-border-subtle rounded-full flex items-center justify-center text-text-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={enlargedImage}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            alt="Pitch Enlarged"
          />
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
