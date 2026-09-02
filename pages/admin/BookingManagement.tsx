import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import { BookingStatus } from "../../types";
import {
  Search,
  Filter,
  CalendarDays,
  ShieldAlert,
  Ban,
  Clock,
  Unlock,
  AlertCircle,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  MapPin,
  User,
  CreditCard,
  Building,
  ChevronRight,
  Download,
} from "lucide-react";

export const BookingManagement: React.FC = () => {
  const { isAdmin, user, loading: authLoading } = useUser();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [slotLock, setSlotLock] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listBookings();
      setBookings(data);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Error fetching bookings", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreBookings = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listBookings(lastDoc);
      setBookings((prev) => [...prev, ...data]);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Error fetching more bookings", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) fetchBookings();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    let result = bookings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          (b.id && b.id.toLowerCase().includes(q)) ||
          (b.playerName && b.playerName.toLowerCase().includes(q)) ||
          (b.playerEmail && b.playerEmail.toLowerCase().includes(q)) ||
          (b.ownerName && b.ownerName.toLowerCase().includes(q)) ||
          (b.turfName && b.turfName.toLowerCase().includes(q)),
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter(
        (b) => (b.status || "").toUpperCase() === statusFilter.toUpperCase(),
      );
    }
    if (paymentFilter !== "ALL") {
      result = result.filter(
        (b) =>
          (b.paymentStatus || "").toUpperCase() === paymentFilter.toUpperCase(),
      );
    }
    setFilteredBookings(result);
  }, [searchQuery, statusFilter, paymentFilter, bookings]);

  const handleSelectBooking = async (booking: any) => {
    setSelectedBooking(booking);
    setLoadingDetails(true);
    try {
      const [lock, notes] = await Promise.all([
        adminService.getSlotLockForBooking(booking.id),
        adminService.getBookingAdminNotes(booking.id),
      ]);
      setSlotLock(lock);
      setAdminNotes(notes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const [modalAction, setModalAction] = useState<{
    type: "CANCEL" | "RELEASE_LOCK" | "MARK_PAID" | "CONFIRM";
    title: string;
    description: string;
    requiresInput?: boolean;
    inputPlaceholder?: string;
  } | null>(null);
  const [modalInput, setModalInput] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExecuteModalAction = async () => {
    if (!user || !selectedBooking || !modalAction) return;
    setIsUpdating(true);

    try {
      if (modalAction.type === "CANCEL") {
        const reason = modalInput.trim() || "Administrative cancellation by platform admin.";
        await adminService.cancelBookingAsAdmin(selectedBooking.id, user.uid);
        const updated = bookings.map((b) =>
          b.id === selectedBooking.id
            ? { ...b, status: BookingStatus.CANCELLED, cancellationReason: reason }
            : b,
        );
        setBookings(updated);
        setSelectedBooking({
          ...selectedBooking,
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
        });
        showToast("success", "Booking cancelled successfully.");
      } else if (modalAction.type === "RELEASE_LOCK") {
        if (slotLock?.id) {
          await adminService.releaseSlotLock(slotLock.id);
          setSlotLock(null);
          showToast("success", "Slot lock released.");
        }
      } else if (modalAction.type === "CONFIRM") {
        const { bookingService } = await import("../../services/bookingService");
        await bookingService.update(selectedBooking.id, {
          status: BookingStatus.CONFIRMED,
          approvedAt: new Date().toISOString(),
        });
        const updated = bookings.map((b) =>
          b.id === selectedBooking.id
            ? { ...b, status: BookingStatus.CONFIRMED }
            : b,
        );
        setBookings(updated);
        setSelectedBooking({
          ...selectedBooking,
          status: BookingStatus.CONFIRMED,
        });
        showToast("success", "Booking marked as Confirmed.");
      }
    } catch (error: any) {
      console.error(error);
      showToast("error", error?.message || "Action failed to execute.");
    } finally {
      setIsUpdating(false);
      setModalAction(null);
      setModalInput("");
    }
  };

  const handleForceCancel = () => {
    setModalInput("");
    setModalAction({
      type: "CANCEL",
      title: "Force Cancel Booking",
      description: "Cancel this match booking and release the pitch slot back to availability.",
      requiresInput: true,
      inputPlaceholder: "Enter reason for cancellation...",
    });
  };

  const handleReleaseLock = () => {
    setModalAction({
      type: "RELEASE_LOCK",
      title: "Release Slot Lock",
      description: "Manually unlock this timeslot so other players can reserve it.",
    });
  };

  const handleConfirmBooking = () => {
    setModalAction({
      type: "CONFIRM",
      title: "Confirm Match Reservation",
      description: "Mark this booking as active and confirmed on the system.",
    });
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user || !selectedBooking) return;
    setIsUpdating(true);
    try {
      await adminService.addBookingAdminNote(selectedBooking.id, user.uid, newNote);
      setNewNote("");
      const notes = await adminService.getBookingAdminNotes(selectedBooking.id);
      setAdminNotes(notes);
      showToast("success", "Admin note logged.");
    } catch (error) {
      showToast("error", "Failed to add note.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID,PlayerName,PitchName,Date,Time,Price,Status,PaymentStatus"];
    const rows = filteredBookings.map((b) =>
      [
        `"${b.id || ""}"`,
        `"${b.playerName || b.userName || ""}"`,
        `"${b.turfName || ""}"`,
        `"${b.date || ""}"`,
        `"${b.timeCode || b.time || ""}"`,
        `"${b.price || b.totalPrice || 0}"`,
        `"${b.status || ""}"`,
        `"${b.paymentStatus || ""}"`,
      ].join(","),
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pitchly-bookings-${new Date().toISOString().split("T")[0]}.csv`);
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
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 uppercase tracking-wider">
              Match Operations
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Reservation Ledger &amp; Slot Overrides
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Booking Management
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Inspect reservation states, force-cancel fraudulent bookings, release locked slots, and audit match notes.
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
              placeholder="Search by player, turf name, booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary font-semibold outline-none focus:border-[#38BDF8] transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="ALL">All Match Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 text-center border border-border-subtle max-w-lg mx-auto">
          <CalendarDays size={40} className="text-text-tertiary mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-bold text-text-primary mb-1">No bookings match criteria</h2>
          <p className="text-xs text-text-secondary">
            Try adjusting your search terms or filter selections.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-raised border-b border-border-subtle">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Match &amp; Turf
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Player
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Date &amp; Slot
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Amount
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
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-surface-raised/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-text-primary text-xs truncate max-w-[160px]">
                        {b.turfName || "Pitch Venue"}
                      </div>
                      <div className="text-[10px] text-text-tertiary font-mono truncate">
                        ID: {b.id.substring(0, 8)}...
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs font-bold text-text-primary truncate max-w-[140px]">
                        {b.playerName || b.userName || "Player"}
                      </div>
                      <div className="text-[10px] text-text-secondary truncate max-w-[140px]">
                        {b.playerEmail || b.playerPhone || "No email"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs font-semibold text-text-primary">
                        {b.date}
                      </div>
                      <div className="text-[10px] text-text-secondary font-mono">
                        {b.timeCode || b.time || "Slot"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs font-extrabold text-primary-lime font-mono">
                        UGX {Number(b.price || b.totalPrice || 0).toLocaleString()}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          (b.status || "").toUpperCase() === "CONFIRMED" ||
                          (b.status || "").toUpperCase() === "COMPLETED"
                            ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                            : (b.status || "").toUpperCase() === "CANCELLED"
                              ? "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"
                              : "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30"
                        }`}
                      >
                        {(b.status || "PENDING").replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleSelectBooking(b)}
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

          {hasMore && (
            <div className="p-4 flex justify-center border-t border-border-subtle bg-surface-card">
              <button
                onClick={fetchMoreBookings}
                disabled={loadingMore}
                className="bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Bookings"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-app-base/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface-card w-full max-w-lg h-full border-l border-border-subtle flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-raised shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 uppercase tracking-wider">
                  Reservation Detail
                </span>
                <h2 className="text-sm font-bold text-text-primary truncate max-w-[240px]">
                  {selectedBooking.turfName || "Booking Info"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {/* Financial & Status Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                    Match Amount
                  </span>
                  <div className="text-base font-extrabold text-primary-lime font-mono">
                    UGX {Number(selectedBooking.price || selectedBooking.totalPrice || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                    Booking Status
                  </span>
                  <div className="text-xs font-bold text-text-primary uppercase">
                    {(selectedBooking.status || "").replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {/* Match & Parties Details */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Match Details &amp; Parties
                </h3>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between border-b border-border-subtle pb-1.5">
                    <span className="text-text-secondary">Date &amp; Slot:</span>
                    <span className="font-bold text-text-primary">
                      {selectedBooking.date} ({selectedBooking.timeCode || selectedBooking.time})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle pb-1.5">
                    <span className="text-text-secondary">Player Name:</span>
                    <span className="font-bold text-text-primary">
                      {selectedBooking.playerName || selectedBooking.userName || "Player"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle pb-1.5">
                    <span className="text-text-secondary">Pitch Facility:</span>
                    <span className="font-bold text-text-primary">
                      {selectedBooking.turfName || "Pitch"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Booking UID:</span>
                    <span className="font-mono text-text-tertiary">{selectedBooking.id}</span>
                  </div>
                </div>
              </div>

              {/* Slot Lock Status */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Slot Lock Status
                  </h4>
                  {slotLock ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                      Locked
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                      Free / Clear
                    </span>
                  )}
                </div>

                {slotLock && (
                  <div className="text-xs text-text-secondary space-y-1">
                    <p>Locked by: {slotLock.lockedBy}</p>
                    <button
                      onClick={handleReleaseLock}
                      disabled={isUpdating}
                      className="mt-2 w-full bg-surface-card hover:bg-border-subtle text-text-primary border border-border-subtle py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Force Release Slot Lock
                    </button>
                  </div>
                )}
              </div>

              {/* Administrative Actions */}
              <div className="space-y-2">
                {selectedBooking.status !== BookingStatus.CONFIRMED && selectedBooking.status !== BookingStatus.CANCELLED && (
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isUpdating}
                    className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Confirm Reservation</span>
                  </button>
                )}

                <button
                  onClick={handleForceCancel}
                  disabled={isUpdating || selectedBooking.status === "CANCELLED"}
                  className="w-full bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Force Cancel Reservation
                </button>
              </div>

              {/* Admin Audit Notes */}
              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 border-b border-border-subtle pb-1.5">
                  Administrative Notes &amp; Logs
                </h4>
                <div className="space-y-2 mb-3">
                  {adminNotes.length === 0 ? (
                    <div className="text-xs text-text-tertiary p-3 bg-surface-raised rounded-xl border border-border-subtle">
                      No administrative notes logged for this match.
                    </div>
                  ) : (
                    adminNotes.map((n, i) => (
                      <div
                        key={i}
                        className="p-3 bg-surface-raised rounded-xl border border-border-subtle text-xs"
                      >
                        <p className="text-text-primary font-medium">{n.note}</p>
                        <span className="text-[10px] text-text-tertiary block mt-1">
                          By admin • {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add operational note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={isUpdating || !newNote.trim()}
                    className="bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-app-base px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Action Modal */}
      {modalAction && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setModalAction(null)}
        >
          <div
            className="bg-surface-card border border-border-subtle rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-text-primary">
                  {modalAction.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {modalAction.description}
                </p>
              </div>
              <button
                onClick={() => setModalAction(null)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            {modalAction.requiresInput && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder={modalAction.inputPlaceholder || "Enter details..."}
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-primary-lime"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                onClick={() => setModalAction(null)}
                className="px-4 py-2 rounded-xl bg-surface-raised text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteModalAction}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdating && <Loader2 size={13} className="animate-spin" />}
                <span>Proceed</span>
              </button>
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
