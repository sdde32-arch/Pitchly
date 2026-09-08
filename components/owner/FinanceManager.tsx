import React, { useEffect, useState } from "react";
import { OwnerService } from "../../services/owner";
import { useUser } from "../../context/UserContext";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  Wallet,
  CreditCard,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { Payout, Transaction } from "../../types";

export const FinanceManager: React.FC = () => {
  const { loading: authLoading } = useUser();
  const [financials, setFinancials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "payouts">("transactions");

  useEffect(() => {
    if (!authLoading) loadFinancials();
  }, [authLoading]);

  const loadFinancials = async () => {
    try {
      setFinancials(await OwnerService.getFinancials());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (customAmount?: number) => {
    const amount = customAmount ?? Number(payoutAmount);
    if (!amount || amount <= 0 || amount > (financials?.balance || 0)) {
      alert("Please enter a valid amount within your available balance.");
      return;
    }
    setRequesting(true);
    setPayoutSuccess(false);
    try {
      await OwnerService.requestPayout(amount);
      setPayoutAmount("");
      setPayoutSuccess(true);
      await loadFinancials();
      setTimeout(() => setPayoutSuccess(false), 4000);
    } catch (e) {
      console.error(e);
      alert("Failed to process payout request. Please try again.");
    } finally {
      setRequesting(false);
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

  const totalRevenue = financials?.totalRevenue || 0;
  const balance = financials?.balance || 0;
  const transactions: Transaction[] = financials?.transactions || [];
  const payouts: Payout[] = financials?.payouts || [];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7);

  const monthlyRevenue = transactions
    .filter((t) => t.date?.startsWith(thisMonth))
    .reduce((s, t) => s + (t.amount || 0), 0);

  const lastMonthRevenue = transactions
    .filter((t) => t.date?.startsWith(lastMonth))
    .reduce((s, t) => s + (t.amount || 0), 0);

  const monthChange =
    lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

  const avgPerBooking =
    transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0;

  const daySales: Record<string, number> = {};
  transactions.forEach((t) => {
    const day = new Date(t.date).toLocaleDateString("en-US", {
      weekday: "short",
    });
    daySales[day] = (daySales[day] || 0) + (t.amount || 0);
  });

  const bestDay =
    Object.entries(daySales).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sat";

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full">
      {/* Top Financial Bento Grid: 2 columns on Laptop, stacked on Tablet/Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Hero: Monthly Revenue & Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-surface-card border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Current Month Earnings
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${
                  monthChange >= 0
                    ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                    : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                }`}
              >
                {monthChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>{monthChange >= 0 ? `+${monthChange}%` : `${monthChange}%`}</span>
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                UGX {(monthlyRevenue || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              vs last month: UGX {(lastMonthRevenue || 0).toLocaleString()}
            </p>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-surface-raised rounded-xl p-4 border border-border-subtle/80 space-y-3">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
              Revenue Stream Breakdown
            </span>

            <div className="space-y-2.5">
              {/* Standard */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-text-secondary">App Bookings</span>
                  <span className="text-text-primary">
                    UGX {Math.round(monthlyRevenue * 0.6).toLocaleString()}{" "}
                    <span className="text-text-tertiary text-[10px] font-normal">(60%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                  <div className="h-full bg-primary-lime w-[60%]" />
                </div>
              </div>

              {/* Corporate */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-text-secondary">Corporate / Tournaments</span>
                  <span className="text-text-primary">
                    UGX {Math.round(monthlyRevenue * 0.3).toLocaleString()}{" "}
                    <span className="text-text-tertiary text-[10px] font-normal">(30%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                  <div className="h-full bg-[#38BDF8] w-[30%]" />
                </div>
              </div>

              {/* Walk-in Cash */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-text-secondary">Walk-in Cash</span>
                  <span className="text-text-primary">
                    UGX {Math.round(monthlyRevenue * 0.1).toLocaleString()}{" "}
                    <span className="text-text-tertiary text-[10px] font-normal">(10%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                  <div className="h-full bg-[#FACC15] w-[10%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack: Balance & Payout Action (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Balance Cards: 1 col on mobile, 2 cols on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 bg-primary-lime/10 text-primary-lime rounded-xl flex items-center justify-center mb-2 border border-primary-lime/20">
                <DollarSign size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Total Gross
                </span>
                <span className="text-base sm:text-lg font-extrabold text-text-primary">
                  UGX {(totalRevenue || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-sm flex flex-col justify-between">
              <div className="w-9 h-9 bg-[#38BDF8]/10 text-[#38BDF8] rounded-xl flex items-center justify-center mb-2 border border-[#38BDF8]/20">
                <Wallet size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Available Payout
                </span>
                <span className="text-base sm:text-lg font-extrabold text-[#38BDF8]">
                  UGX {(balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-surface-card rounded-2xl p-3.5 border border-border-subtle grid grid-cols-3 gap-2 text-center shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                Avg Match
              </span>
              <span className="text-xs font-black text-text-primary mt-0.5 block">
                UGX {avgPerBooking.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                Peak Day
              </span>
              <span className="text-xs font-black text-text-primary mt-0.5 block">
                {bestDay}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                Payout Method
              </span>
              <span className="text-xs font-black text-[#22C55E] mt-0.5 block">
                MTN MoMo
              </span>
            </div>
          </div>

          {/* Request Payout Module */}
          <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                Instant Payout Request
              </span>
              <span className="text-[11px] text-text-tertiary font-medium">
                Direct to Mobile Money
              </span>
            </div>

            {payoutSuccess && (
              <div className="p-3 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={16} />
                <span>Payout request submitted successfully!</span>
              </div>
            )}

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[50000, 100000, 250000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPayoutAmount(String(amt))}
                  className="px-2.5 py-1 bg-surface-raised hover:bg-border-subtle border border-border-subtle rounded-lg text-[11px] font-bold text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer"
                >
                  {(amt / 1000)}k
                </button>
              ))}
              {balance > 0 && (
                <button
                  type="button"
                  onClick={() => setPayoutAmount(String(balance))}
                  className="px-2.5 py-1 bg-primary-lime/10 hover:bg-primary-lime/20 border border-primary-lime/30 text-primary-lime rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Full Balance
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder={`Max: UGX ${(balance || 0).toLocaleString()}`}
                className="flex-1 bg-surface-raised border border-border-subtle text-text-primary rounded-lg px-3.5 h-11 text-xs font-bold outline-none focus:border-border-prominent placeholder:text-text-tertiary"
              />
              <button
                onClick={() => handleRequestPayout()}
                disabled={requesting || !payoutAmount || Number(payoutAmount) <= 0}
                className="px-4 h-11 bg-primary-lime hover:bg-[#96E600] text-black font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
              >
                {requesting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight size={15} strokeWidth={2.5} />
                    <span>Withdraw</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions & Payouts Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "transactions"
                ? "bg-primary-lime text-black font-extrabold shadow-sm"
                : "bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            Recent Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("payouts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "payouts"
                ? "bg-primary-lime text-black font-extrabold shadow-sm"
                : "bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            Payout History ({payouts.length})
          </button>
        </div>

        {/* Transaction History List */}
        {activeTab === "transactions" && (
          <div className="space-y-2.5">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-text-secondary bg-surface-card rounded-2xl border border-border-subtle">
                <CreditCard size={36} className="mx-auto mb-2.5 opacity-40 text-text-tertiary" />
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  No recorded transactions yet
                </p>
              </div>
            ) : (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-surface-card rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border border-border-subtle hover:border-border-prominent transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-[#22C55E]/10 text-[#22C55E] rounded-lg flex items-center justify-center border border-[#22C55E]/20 shrink-0">
                      <ArrowDownLeft size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                        {txn.description}
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {new Date(txn.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs sm:text-sm font-black text-[#22C55E] shrink-0">
                    +UGX {(txn.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Payout History List */}
        {activeTab === "payouts" && (
          <div className="space-y-2.5">
            {payouts.length === 0 ? (
              <div className="p-12 text-center text-text-secondary bg-surface-card rounded-2xl border border-border-subtle">
                <Clock size={36} className="mx-auto mb-2.5 opacity-40 text-text-tertiary" />
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  No payout history yet
                </p>
              </div>
            ) : (
              payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="bg-surface-card rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border border-border-subtle hover:border-border-prominent transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${
                        payout.status === "PAID"
                          ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                          : "bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]"
                      }`}
                    >
                      <Clock size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-text-primary">
                        UGX {(payout.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {payout.requestDate?.split("T")[0]} · {payout.method}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border shrink-0 ${
                      payout.status === "PAID"
                        ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                        : "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30"
                    }`}
                  >
                    {payout.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
