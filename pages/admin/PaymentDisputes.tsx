import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import {
  Search,
  Filter,
  Receipt,
  ShieldAlert,
  Ban,
  Clock,
  Unlock,
  AlertCircle,
  X,
  Plus,
  CheckCircle,
  Image as ImageIcon,
  CreditCard,
  Building,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Download,
} from "lucide-react";

export const PaymentDisputes: React.FC = () => {
  const { isAdmin, user, loading: authLoading } = useUser();
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bookingFilter, setBookingFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [disputeInfo, setDisputeInfo] = useState<any | null>(null);
  const [newNote, setNewNote] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listPaymentSubmissions();
      setPayments(data);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Error fetching payments", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMorePayments = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listPaymentSubmissions(lastDoc);
      setPayments((prev) => [...prev, ...data]);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Error fetching more payments", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) fetchPayments();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    let result = payments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          (b.id && b.id.toLowerCase().includes(q)) ||
          (b.playerName && b.playerName.toLowerCase().includes(q)) ||
          (b.playerEmail && b.playerEmail.toLowerCase().includes(q)) ||
          (b.ownerName && b.ownerName.toLowerCase().includes(q)) ||
          (b.ownerEmail && b.ownerEmail.toLowerCase().includes(q)) ||
          (b.turfName && b.turfName.toLowerCase().includes(q)),
      );
    }
    if (statusFilter !== "ALL") {
      result = result.filter(
        (b) =>
          (b.paymentStatus || "PENDING").toUpperCase() === statusFilter.toUpperCase(),
      );
    }
    if (bookingFilter !== "ALL") {
      result = result.filter(
        (b) => (b.status || "PENDING").toUpperCase() === bookingFilter.toUpperCase(),
      );
    }
    if (methodFilter !== "ALL") {
      result = result.filter(
        (b) =>
          (b.paymentMethod || "UNKNOWN").toUpperCase() === methodFilter.toUpperCase(),
      );
    }
    setFilteredPayments(result);
  }, [searchQuery, statusFilter, bookingFilter, methodFilter, payments]);

  const handleSelectPayment = async (payment: any) => {
    setSelectedPayment(payment);
    setLoadingDetails(true);
    setDisputeInfo(null);
    try {
      const allDisputes = await adminService.listDisputedBookings();
      const currentDispute = allDisputes.find((d: any) => d.bookingId === payment.id);
      if (currentDispute) {
        setDisputeInfo(currentDispute);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const [resolveModal, setResolveModal] = useState<{
    action: "REFUND_PLAYER" | "RELEASE_TO_OWNER" | "REJECT_DISPUTE";
    title: string;
    description: string;
  } | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user || !disputeInfo) return;
    setIsUpdating(true);
    try {
      await adminService.addDisputeNote(disputeInfo.id, user.uid, newNote);
      setNewNote("");
      const updatedDispute = await adminService.getPaymentDisputeDetails(disputeInfo.id);
      setDisputeInfo(updatedDispute);
      showToast("success", "Dispute note logged.");
    } catch (error) {
      showToast("error", "Failed to add note.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExecuteResolution = async () => {
    if (!user || !disputeInfo || !resolveModal) return;
    setIsUpdating(true);
    const notes = resolutionNotes.trim() || "Resolved administratively.";
    try {
      await adminService.resolveDispute(disputeInfo.id, user.uid, `${resolveModal.action}: ${notes}`);
      showToast("success", "Dispute resolved successfully.");
      setSelectedPayment(null);
      setResolveModal(null);
      setResolutionNotes("");
      fetchPayments();
    } catch (error: any) {
      showToast("error", error?.message || "Failed to resolve dispute.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveDispute = (action: "REFUND_PLAYER" | "RELEASE_TO_OWNER" | "REJECT_DISPUTE") => {
    setResolutionNotes("");
    setResolveModal({
      action,
      title:
        action === "REFUND_PLAYER"
          ? "Refund Amount to Player"
          : action === "RELEASE_TO_OWNER"
          ? "Release Funds to Turf Owner"
          : "Reject / Dismiss Dispute",
      description:
        action === "REFUND_PLAYER"
          ? "Approve the dispute in favor of the player and initiate a refund transaction."
          : action === "RELEASE_TO_OWNER"
          ? "Disburse the reserved amount to the turf owner's wallet."
          : "Close dispute without financial adjustments.",
    });
  };

  const handleExportCSV = () => {
    const headers = ["ID,Turf,Player,Amount,Method,PaymentStatus,BookingStatus,Date"];
    const rows = filteredPayments.map((p) =>
      [
        `"${p.id || ""}"`,
        `"${p.turfName || ""}"`,
        `"${p.playerName || p.userName || ""}"`,
        `"${p.price || p.totalPrice || 0}"`,
        `"${p.paymentMethod || "MOMO"}"`,
        `"${p.paymentStatus || "PENDING"}"`,
        `"${p.status || "PENDING"}"`,
        `"${p.date || ""}"`,
      ].join(","),
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pitchly-payments-${new Date().toISOString().split("T")[0]}.csv`);
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
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 uppercase tracking-wider">
              Financial Escrow &amp; Arbitration
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Payment Auditing &amp; Dispute Resolution
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Payments &amp; Disputes
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Verify Mobile Money submissions, audit proof receipts, and arbitrate booking financial conflicts.
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
              placeholder="Search by transaction ID, player, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary font-semibold outline-none focus:border-[#EF4444] transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-[#EF4444] cursor-pointer"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="DISPUTED">Disputed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-[#EF4444] cursor-pointer"
            >
              <option value="ALL">All Payment Rails</option>
              <option value="MTN_MOMO">MTN MoMo</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
              <option value="CASH">Cash at Turf</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 text-center border border-border-subtle max-w-lg mx-auto">
          <Receipt size={40} className="text-text-tertiary mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-bold text-text-primary mb-1">No payment transactions found</h2>
          <p className="text-xs text-text-secondary">
            Adjust your search query or filter selection.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-raised border-b border-border-subtle">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Transaction &amp; Turf
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Player / Owner
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Payment Method
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
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-raised/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-text-primary text-xs truncate max-w-[160px]">
                        {p.turfName || "Pitch Venue"}
                      </div>
                      <div className="text-[10px] text-text-tertiary font-mono truncate">
                        ID: {p.id.substring(0, 8)}...
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs font-bold text-text-primary truncate max-w-[140px]">
                        {p.playerName || p.userName || "Player"}
                      </div>
                      <div className="text-[10px] text-text-secondary truncate max-w-[140px]">
                        {p.playerEmail || p.ownerName || "No contact"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-text-primary bg-surface-raised border border-border-subtle px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {p.paymentMethod || "MOMO"}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs font-extrabold text-primary-lime font-mono">
                        UGX {Number(p.price || p.totalPrice || 0).toLocaleString()}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          (p.paymentStatus || "").toUpperCase() === "PAID"
                            ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                            : (p.paymentStatus || "").toUpperCase() === "DISPUTED"
                              ? "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30"
                              : "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30"
                        }`}
                      >
                        {p.paymentStatus || "PENDING"}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleSelectPayment(p)}
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
                onClick={fetchMorePayments}
                disabled={loadingMore}
                className="bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Transactions"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment Inspection Drawer */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-app-base/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface-card w-full max-w-lg h-full border-l border-border-subtle flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-raised shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 uppercase tracking-wider">
                  Payment Supervision
                </span>
                <h2 className="text-sm font-bold text-text-primary truncate max-w-[240px]">
                  {selectedPayment.turfName || "Transaction Details"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {/* Financial Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                    Amount Transacted
                  </span>
                  <div className="text-base font-extrabold text-primary-lime font-mono">
                    UGX {Number(selectedPayment.price || selectedPayment.totalPrice || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                    Method &amp; Network
                  </span>
                  <div className="text-xs font-bold text-text-primary uppercase">
                    {selectedPayment.paymentMethod || "MTN / AIRTEL MOMO"}
                  </div>
                </div>
              </div>

              {/* Dispute Warning if active */}
              {disputeInfo && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#EF4444]">
                    <ShieldAlert size={18} />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider">
                      Active Dispute Under Review
                    </h3>
                  </div>
                  <p className="text-xs text-text-primary font-medium">
                    Reason: {disputeInfo.reason || "Payment not credited / incorrect amount"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleResolveDispute("REFUND_PLAYER")}
                      disabled={isUpdating}
                      className="bg-[#EF4444] text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Refund Player
                    </button>
                    <button
                      onClick={() => handleResolveDispute("RELEASE_TO_OWNER")}
                      disabled={isUpdating}
                      className="bg-primary-lime text-accent-text py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Release to Owner
                    </button>
                  </div>
                </div>
              )}

              {/* Transaction Proof / Receipt Attachment */}
              {selectedPayment.paymentProofImage && (
                <div>
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Submitted Proof Receipt
                  </h4>
                  <div
                    className="w-full h-48 rounded-xl overflow-hidden bg-surface-raised border border-border-subtle cursor-pointer relative group"
                    onClick={() => setExpandedImage(selectedPayment.paymentProofImage)}
                  >
                    <img
                      src={selectedPayment.paymentProofImage}
                      alt="Proof"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-app-base/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-text-primary">Click to view full</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Parties Data */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-2 text-xs">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                  Transaction Metadata
                </h4>
                <div className="flex justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-text-secondary">Player Name:</span>
                  <span className="font-bold text-text-primary">
                    {selectedPayment.playerName || selectedPayment.userName || "Player"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-text-secondary">Owner / Pitch:</span>
                  <span className="font-bold text-text-primary">
                    {selectedPayment.turfName || "Pitch Venue"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Transaction ID:</span>
                  <span className="font-mono text-text-tertiary">{selectedPayment.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 bg-app-base/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-6 w-10 h-10 bg-surface-card hover:bg-surface-raised border border-border-subtle rounded-full flex items-center justify-center text-text-primary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={expandedImage}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            alt="Proof Receipt"
          />
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {resolveModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setResolveModal(null)}
        >
          <div
            className="bg-surface-card border border-border-subtle rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-text-primary">
                  {resolveModal.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {resolveModal.description}
                </p>
              </div>
              <button
                onClick={() => setResolveModal(null)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block">
                Resolution Explanation &amp; Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the outcome, audit checks made, or transaction reference..."
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-xs text-text-primary outline-none focus:border-primary-lime min-h-[80px]"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                onClick={() => setResolveModal(null)}
                className="px-4 py-2 rounded-xl bg-surface-raised text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteResolution}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Processing..." : "Confirm Resolution"}
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
              <CheckCircle size={16} className="shrink-0 text-[#22C55E]" />
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
