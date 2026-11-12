import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OwnerService } from "../../services/owner";
import { useUser } from "../../context/UserContext";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowDownLeft,
  ChevronRight,
  Info,
  AlertCircle,
  Building,
  ShieldCheck,
  Smartphone,
  Search,
  Filter,
  Check,
  ExternalLink,
} from "lucide-react";

export const FinanceManager: React.FC = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useUser();
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading) loadFinancials();
  }, [authLoading]);

  const loadFinancials = async () => {
    try {
      setFinancials(await OwnerService.getFinancials());
    } catch (e) {
      console.error("Error loading financials:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle h-64 animate-pulse" />
          <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  const confirmedRevenue = financials?.confirmedRevenue || 0;
  const pendingRevenue = financials?.pendingRevenue || 0;
  const confirmedCount = financials?.confirmedCount || 0;
  const pendingCount = financials?.pendingCount || 0;
  const totalBookingsCount = financials?.totalBookingsCount || 0;

  const momoRevenue = financials?.momoRevenue || 0;
  const airtelRevenue = financials?.airtelRevenue || 0;
  const cashRevenue = financials?.cashRevenue || 0;

  const rawTransactions: any[] = financials?.transactions || [];

  const filteredTransactions = rawTransactions.filter((txn) => {
    const matchesMethod =
      filterMethod === "ALL" ||
      (filterMethod === "MTN" && (txn.paymentMethod?.includes("MTN") || txn.paymentMethod?.includes("MOBILE_MONEY"))) ||
      (filterMethod === "AIRTEL" && txn.paymentMethod?.includes("AIRTEL")) ||
      (filterMethod === "CASH" && (txn.paymentMethod?.includes("CASH") || !txn.paymentMethod)) ||
      (filterMethod === "PENDING" && (txn.status === "PAYMENT_SUBMITTED" || txn.status === "TENTATIVE"));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      txn.turfName?.toLowerCase().includes(q) ||
      txn.userName?.toLowerCase().includes(q) ||
      txn.transactionRef?.toLowerCase().includes(q) ||
      txn.playerPhone?.includes(q);

    return matchesMethod && matchesSearch;
  });

  const getMethodBadge = (method: string) => {
    const m = (method || "").toUpperCase();
    if (m.includes("MTN") || m.includes("MOBILE_MONEY")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30">
          <Smartphone size={10} /> MTN MoMo
        </span>
      );
    }
    if (m.includes("AIRTEL")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
          <Smartphone size={10} /> Airtel Money
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-surface-raised text-text-secondary border border-border-subtle">
        <DollarSign size={10} /> Cash at Venue
      </span>
    );
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === "CONFIRMED" || status === "CHECKED_IN" || status === "COMPLETED" || paymentStatus === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
          <CheckCircle2 size={11} /> Settled Direct
        </span>
      );
    }
    if (status === "DEPOSIT_PAID" || paymentStatus === "PARTIAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
          <Check size={11} /> Deposit Received
        </span>
      );
    }
    if (status === "PAYMENT_SUBMITTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 animate-pulse">
          <Clock size={11} /> Needs Verification
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-raised text-text-tertiary border border-border-subtle">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full">
      {/* DIRECT SETTLEMENT ARCHITECTURE EDUCATIONAL HERO */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary-lime/15 text-primary-lime border border-primary-lime/30">
              <ShieldCheck size={12} /> Direct Non-Custodial Marketplace
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
              Direct Settlement Ledger & Revenue Telemetry
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Pitchly holds <strong>zero customer funds in escrow</strong>. All player payments are transferred directly
              to your registered MTN Mobile Money, Airtel Money account, or paid in cash at your venue. You maintain 100%
              instant control of all match revenues.
            </p>
          </div>

          <button
            onClick={() => navigate("/owner-profile")}
            className="px-4 py-2.5 bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95"
          >
            <Building size={14} className="text-primary-lime" />
            <span>Update Payout Numbers</span>
            <ChevronRight size={14} className="text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* METRIC KPI BENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Confirmed Revenue */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Confirmed Direct Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center border border-[#22C55E]/20">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              UGX {confirmedRevenue.toLocaleString()}
            </span>
            <p className="text-[11px] text-[#22C55E] font-semibold mt-0.5">
              Across {confirmedCount} confirmed matches
            </p>
          </div>
        </div>

        {/* Card 2: Pending Owner Verification */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Pending Verification
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FACC15]/10 text-[#FACC15] flex items-center justify-center border border-[#FACC15]/20">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#FACC15] tracking-tight">
              UGX {pendingRevenue.toLocaleString()}
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-text-tertiary">
                {pendingCount} awaiting approval
              </p>
              {pendingCount > 0 && (
                <button
                  onClick={() => navigate("/owner?tab=Bookings")}
                  className="text-[10px] font-bold text-primary-lime hover:underline cursor-pointer"
                >
                  Verify Now &rarr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Mobile Money Volume (MTN + Airtel) */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Direct Mobile Money
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/20">
              <Smartphone size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              UGX {(momoRevenue + airtelRevenue).toLocaleString()}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-text-tertiary">
              <span>MTN: UGX {momoRevenue.toLocaleString()}</span>
              <span>·</span>
              <span>Airtel: UGX {airtelRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cash at Venue */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Direct Cash at Pitch
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-raised text-text-secondary flex items-center justify-center border border-border-subtle">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              UGX {cashRevenue.toLocaleString()}
            </span>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Settled directly at facility gates
            </p>
          </div>
        </div>
      </div>

      {/* REVENUE TRANSACTIONS LEDGER */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        {/* Ledger Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-text-primary tracking-tight">
              Direct Payment Transactions ({filteredTransactions.length})
            </h3>
            <p className="text-[11px] text-text-tertiary">
              All direct reservations logged across your sports facilities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player, pitch, TxID..."
                className="w-full bg-surface-raised border border-border-subtle text-text-primary rounded-xl pl-9 pr-3 py-2 text-xs font-medium outline-none focus:border-border-prominent placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "ALL", label: "All Direct Payments" },
            { id: "MTN", label: "MTN MoMo" },
            { id: "AIRTEL", label: "Airtel Money" },
            { id: "CASH", label: "Cash at Pitch" },
            { id: "PENDING", label: `Pending Verification (${pendingCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMethod(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMethod === f.id
                  ? "bg-primary-lime text-black font-extrabold shadow-xs"
                  : "bg-surface-raised hover:bg-border-subtle text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction Rows */}
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-text-secondary bg-surface-raised/40 rounded-xl border border-border-subtle">
            <CreditCard size={36} className="mx-auto mb-2.5 opacity-40 text-text-tertiary" />
            <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
              No matching direct transactions found
            </p>
            <p className="text-[11px] text-text-tertiary mt-1">
              Transactions will appear here when players book your facilities.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className="bg-surface-raised/60 hover:bg-surface-raised rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border-subtle hover:border-border-prominent transition-all shadow-xs"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center shrink-0 text-text-secondary mt-0.5 sm:mt-0">
                    <ArrowDownLeft size={18} className="text-primary-lime" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-extrabold text-text-primary truncate">
                        {txn.turfName}
                      </p>
                      {getMethodBadge(txn.paymentMethod)}
                      {getStatusBadge(txn.status, txn.paymentStatus)}
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Booked by <strong className="text-text-primary">{txn.userName}</strong>
                      {txn.playerPhone ? ` (${txn.playerPhone})` : ""} · Kickoff: {txn.date} at {txn.time}
                    </p>
                    {txn.transactionRef && (
                      <p className="text-[10px] text-text-tertiary font-mono">
                        MoMo Ref / TxID: <span className="text-[#FACC15]">{txn.transactionRef}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border-subtle/50 shrink-0 gap-1">
                  <span className="text-sm sm:text-base font-black text-text-primary">
                    +UGX {(txn.amount || 0).toLocaleString()}
                  </span>
                  {txn.status === "PAYMENT_SUBMITTED" ? (
                    <button
                      onClick={() => navigate("/owner?tab=Bookings")}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-lime hover:underline cursor-pointer"
                    >
                      <span>Verify Booking</span>
                      <ExternalLink size={10} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-text-tertiary">Direct Settlement</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
