import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  CalendarDays,
  ShieldCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  Users,
  Building,
  CreditCard,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  ChevronRight,
  Percent,
} from "lucide-react";

export const Overview: React.FC = () => {
  const { isAdmin, userProfile, loading: authLoading } = useUser();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<{
    totalGrossVolume: number;
    estimatedCommission: number;
    totalBookingsCount: number;
    confirmedBookingsCount: number;
    pendingBookingsCount: number;
    activePitchesCount: number;
    pendingPitchesCount: number;
    totalUsersCount: number;
    totalOwnersCount: number;
    openDisputesCount: number;
    openReportsCount: number;
    recentBookings: any[];
    recentPitches: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    if (!isAdmin) return;
    try {
      const data = await adminService.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Error loading admin metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin, authLoading]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  if (!isAdmin) return null;

  const totalUrgentItems =
    (metrics?.pendingPitchesCount || 0) +
    (metrics?.openDisputesCount || 0) +
    (metrics?.openReportsCount || 0) +
    (metrics?.pendingBookingsCount || 0);

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-text-primary">
      {/* Header with Admin Badge & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30 uppercase tracking-wider">
              Admin Portal
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Platform Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            System Overview
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Live metrics, revenue supervision, inspection queues, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-primary-lime" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Urgent Attention Alert Banner (if pending items exist) */}
      {totalUrgentItems > 0 && (
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#FACC15] flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>{totalUrgentItems} Actionable Item{totalUrgentItems > 1 ? "s" : ""} Requiring Review</span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                {metrics?.pendingPitchesCount || 0} pitches waiting certification • {metrics?.openDisputesCount || 0} open disputes • {metrics?.openReportsCount || 0} user reports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {(metrics?.pendingPitchesCount || 0) > 0 && (
              <button
                onClick={() => navigate("/admin/pitches")}
                className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30 hover:bg-[#A78BFA]/25 transition-all cursor-pointer text-center"
              >
                Review Pitches ({metrics?.pendingPitchesCount})
              </button>
            )}
            {(metrics?.openDisputesCount || 0) > 0 && (
              <button
                onClick={() => navigate("/admin/payments")}
                className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/25 transition-all cursor-pointer text-center"
              >
                Disputes ({metrics?.openDisputesCount})
              </button>
            )}
            {(metrics?.openReportsCount || 0) > 0 && (
              <button
                onClick={() => navigate("/admin/reports")}
                className="flex-1 md:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FACC15]/15 text-[#FACC15] border border-[#FACC15]/30 hover:bg-[#FACC15]/25 transition-all cursor-pointer text-center"
              >
                Reports ({metrics?.openReportsCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Gross Platform Revenue */}
        <div
          onClick={() => navigate("/admin/payments")}
          className="bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border-subtle flex flex-col justify-between hover:border-border-prominent transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Gross Platform GMV
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-primary-lime group-hover:scale-105 transition-transform">
              <Wallet size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              UGX {(metrics?.totalGrossVolume || 0).toLocaleString()}
            </div>
            <p className="text-xs text-text-tertiary font-medium">
              Confirmed match transaction volume
            </p>
          </div>
        </div>

        {/* Estimated Platform Take */}
        <div
          onClick={() => navigate("/admin/settings")}
          className="bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border-subtle flex flex-col justify-between hover:border-border-prominent transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Est. Commission Take
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-[#38BDF8] group-hover:scale-105 transition-transform">
              <Percent size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                UGX {(metrics?.estimatedCommission || 0).toLocaleString()}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                10% Take
              </span>
            </div>
            <p className="text-xs text-text-tertiary font-medium">
              Calculated platform earnings
            </p>
          </div>
        </div>

        {/* Pitch Facilities */}
        <div
          onClick={() => navigate("/admin/pitches")}
          className="bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border-subtle flex flex-col justify-between hover:border-border-prominent transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Pitch Facilities
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                {metrics?.activePitchesCount || 0} Active
              </span>
              {(metrics?.pendingPitchesCount || 0) > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30">
                  +{metrics?.pendingPitchesCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-text-tertiary font-medium">
              Verified football turfs in Kampala
            </p>
          </div>
        </div>

        {/* User Ecosystem */}
        <div
          onClick={() => navigate("/admin/users")}
          className="bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border-subtle flex flex-col justify-between hover:border-border-prominent transition-all group shadow-xs cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Community Ecosystem
            </span>
            <div className="w-9 h-9 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center text-[#22C55E] group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                {(metrics?.totalUsersCount || 0) + (metrics?.totalOwnersCount || 0)} Accounts
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-raised text-text-secondary border border-border-subtle">
                {metrics?.totalOwnersCount || 0} Owners
              </span>
            </div>
            <p className="text-xs text-text-tertiary font-medium">
              {metrics?.totalUsersCount || 0} registered players
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation / Action Hub */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Supervision Hub</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Direct access to platform moderation, inspections, and dispute settlement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => navigate("/admin/pitches")}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ShieldCheck size={18} />
            </div>
            <span className="text-xs font-bold text-text-primary">Pitch Reviews</span>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              {metrics?.pendingPitchesCount || 0} waiting
            </span>
          </button>

          <button
            onClick={() => navigate("/admin/bookings")}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CalendarDays size={18} />
            </div>
            <span className="text-xs font-bold text-text-primary">Bookings</span>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              {metrics?.totalBookingsCount || 0} total
            </span>
          </button>

          <button
            onClick={() => navigate("/admin/payments")}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CreditCard size={18} />
            </div>
            <span className="text-xs font-bold text-text-primary">Payments</span>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              {metrics?.openDisputesCount || 0} disputes
            </span>
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
            <span className="text-xs font-bold text-text-primary">Players</span>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              {metrics?.totalUsersCount || 0} players
            </span>
          </button>

          <button
            onClick={() => navigate("/admin/owners")}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-lime/10 text-primary-lime border border-primary-lime/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Building size={18} />
            </div>
            <span className="text-xs font-bold text-text-primary">Owners</span>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              {metrics?.totalOwnersCount || 0} venues
            </span>
          </button>

          <button
            onClick={() => navigate("/admin/reports")}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ShieldAlert size={18} />
            </div>
            <span className="text-xs font-bold text-text-primary">Reports</span>
            <span className="text-[10px] text-text-tertiary mt-0.5">
              {metrics?.openReportsCount || 0} open
            </span>
          </button>
        </div>
      </div>

      {/* Two-Column Grid: Recent Platform Bookings & Pending Pitch Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Platform Bookings */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-text-primary">Recent Booking Activity</h3>
              </div>
              <button
                onClick={() => navigate("/admin/bookings")}
                className="text-xs font-bold text-primary-lime hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-text-tertiary">
                Loading recent bookings...
              </div>
            ) : (metrics?.recentBookings || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-text-tertiary">
                No recent booking transactions recorded.
              </div>
            ) : (
              <div className="space-y-2">
                {(metrics?.recentBookings || []).slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate("/admin/bookings")}
                    className="p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {b.playerName || b.userName || "Player"}
                        </span>
                        <span className="text-[10px] text-text-tertiary">→</span>
                        <span className="text-xs font-medium text-text-secondary truncate">
                          {b.turfName || "Pitch"}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">
                        {b.date} • {b.timeCode || b.time || "Slot"}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-text-primary font-mono">
                        UGX {Number(b.price || b.totalPrice || 0).toLocaleString()}
                      </div>
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          b.status === "CONFIRMED" || b.status === "COMPLETED" || b.status === "CHECKED_IN"
                            ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                            : b.status === "CANCELLED" || b.status === "REJECTED"
                              ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                              : "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30"
                        }`}
                      >
                        {(b.status || "PENDING").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Pitch Certifications */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#A78BFA]" />
                <h3 className="text-sm font-bold text-text-primary">Pitches Awaiting Approval</h3>
              </div>
              <button
                onClick={() => navigate("/admin/pitches")}
                className="text-xs font-bold text-[#A78BFA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Review Queue</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-text-tertiary">
                Loading pending pitches...
              </div>
            ) : (metrics?.recentPitches || []).length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={32} className="text-[#22C55E] mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-text-primary">All caught up!</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  No pitches waiting in the certification queue.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(metrics?.recentPitches || []).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate("/admin/pitches")}
                    className="p-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-card shrink-0 border border-border-subtle">
                        <img
                          src={(p.images && p.images[0]) || "/placeholder-pitch.png"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-pitch.png";
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-text-primary truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-text-secondary truncate mt-0.5">
                          {p.location || "Kampala"} • UGX {Number(p.pricePerHour || 0).toLocaleString()}/hr
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30 shrink-0">
                      {(p.status || "PENDING").replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
