import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Plus, 
  Loader2, 
  Building2, 
  Lock, 
  Unlock, 
  Activity, 
  Wrench, 
  ChevronRight,
  TrendingUp,
  Phone,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pitchService } from '../../services/pitchService';
import { bookingService } from '../../services/bookingService';
import { useUser } from '../../context/UserContext';
import { Pitch, SlotAvailability } from '../../types/firebase';
import { WeeklyOccupancyHeatmap } from './WeeklyOccupancyHeatmap';

interface BentoKpiProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  accentColor: string;
  badgeText?: string;
  badgeBg?: string;
  onClick?: () => void;
}

const BentoKpiCard: React.FC<BentoKpiProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
  badgeText,
  badgeBg = 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
  onClick
}) => (
  <div 
    id={id} 
    onClick={onClick}
    className={`bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border-subtle flex flex-col justify-between hover:border-border-prominent transition-all group shadow-sm ${
      onClick ? 'cursor-pointer active:scale-[0.98]' : ''
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider font-sans">
        {title}
      </span>
      <div className={`w-9 h-9 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center ${accentColor} transition-transform group-hover:scale-105`}>
        <Icon size={18} />
      </div>
    </div>
    
    <div className="space-y-1">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl sm:text-2xl font-extrabold text-text-primary tracking-tight font-sans">
          {value}
        </span>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${badgeBg}`}>
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-text-tertiary font-medium font-sans truncate">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

export const OwnerOverview: React.FC = () => {
  const { user, userProfile, loading: authLoading } = useUser();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Live Slot Toggle Grid State
  const [selectedPitchId, setSelectedPitchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [slotFilter, setSlotFilter] = useState<'ALL' | 'OPEN' | 'LOCKED' | 'BOOKED'>('ALL');
  const [slotsAvailability, setSlotsAvailability] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        const uId = userProfile?.id || user?.uid;
        if (!uId) return;

        const [realPitches, realBookings] = await Promise.all([
          pitchService.listByOwner(uId),
          bookingService.listByOwner(uId)
        ]);

        setPitches(realPitches);
        setBookings(realBookings);

        if (realPitches.length > 0 && !selectedPitchId) {
          setSelectedPitchId(realPitches[0].id);
        }
        setLoading(false);
      } catch (e) {
        console.error('Dashboard load error:', e);
        setLoading(false);
      }
    };
    load();
  }, [user, userProfile, authLoading]);

  // Subscribe to live slot availability for selected pitch and date
  useEffect(() => {
    if (!selectedPitchId || !selectedDate) return;

    setLoadingSlots(true);
    const unsubscribe = bookingService.subscribeSlotAvailability(
      selectedPitchId,
      selectedDate,
      (availList) => {
        setSlotsAvailability(availList);
        setLoadingSlots(false);
      },
      (err) => {
        console.error('Error subscribing to owner slot grid:', err);
        setLoadingSlots(false);
      }
    );

    return () => unsubscribe();
  }, [selectedPitchId, selectedDate]);

  const activePitch = pitches.find(p => p.id === selectedPitchId) || pitches[0];

  // Generate standard operating slots for pitch
  const operatingTimes = React.useMemo(() => {
    const open = activePitch?.openingHour || "07:00";
    const close = activePitch?.closingHour || "23:00";
    const openH = parseInt(open.split(':')[0], 10) || 7;
    const closeH = parseInt(close.split(':')[0], 10) || 23;
    const list: string[] = [];
    for (let h = openH; h < closeH; h++) {
      list.push(`${String(h).padStart(2, '0')}:00`);
    }
    return list;
  }, [activePitch]);

  const handleToggleSlotLock = async (time: string, currentStatus: string) => {
    if (!selectedPitchId || !selectedDate) return;
    const isCurrentlyBlocked = currentStatus === 'blocked';
    const newBlockedState = !isCurrentlyBlocked;

    setTogglingSlot(time);
    try {
      await bookingService.toggleSlotBlock(
        selectedPitchId,
        selectedDate,
        time,
        newBlockedState,
        'walk-in-maintenance'
      );
    } catch (err) {
      console.error('Failed to toggle slot lock state', err);
    } finally {
      setTogglingSlot(null);
    }
  };

  const setDateToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const setDateTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-card rounded-2xl p-4 border border-border-subtle h-28 animate-pulse" />
          ))}
        </div>
        <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle h-72 animate-pulse" />
      </div>
    );
  }

  // Empty state when owner has zero pitches
  if (pitches.length === 0) {
    return (
      <div id="owner-empty-state" className="bg-surface-card rounded-2xl p-6 sm:p-10 border border-border-subtle text-center max-w-xl mx-auto my-8 sm:my-12 shadow-md flex flex-col items-center">
        <div className="w-16 h-16 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-2xl flex items-center justify-center mb-5 text-[#38BDF8]">
          <Building2 size={32} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 uppercase tracking-wider mb-3">
          Owner Portal
        </div>
        <h2 id="empty-state-title" className="text-xl sm:text-2xl font-extrabold text-text-primary mb-2">
          List your first sports pitch
        </h2>
        <p id="empty-state-description" className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
          Start receiving player bookings, view live revenue KPIs, and manage slot locks for walk-ins and pitch maintenance.
        </p>
        <button
          id="btn-add-first-pitch"
          onClick={() => navigate('/owner/add-pitch')}
          className="w-full sm:w-auto px-6 py-3.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary-lime/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Your Pitch
        </button>
      </div>
    );
  }

  // KPI Calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const activeBookings = bookings.filter(b => 
    b.status !== 'CANCELLED' && 
    b.status?.toUpperCase() !== 'CANCELLED' && 
    b.status !== 'REJECTED' && 
    b.status?.toUpperCase() !== 'REJECTED'
  );

  const todaysBookings = activeBookings.filter(b => b.date === todayStr);
  const todaysBookingsCount = todaysBookings.length;

  const revenueThisMonth = activeBookings
    .filter(b => {
      const isCurrentMonth = b.date && b.date.startsWith(currentYearMonth);
      const isConfirmedOrPaid = 
        b.status === 'CONFIRMED' || 
        b.status === 'CHECKED_IN' || 
        b.status === 'COMPLETED' || 
        b.paymentStatus === 'PAID' || 
        b.paymentStatus === 'APPROVED';
      return isCurrentMonth && isConfirmedOrPaid;
    })
    .reduce((sum, b) => sum + (b.price || b.totalPrice || 0), 0);

  // Pitch Utilization Calculation
  const totalOperatingSlotsToday = (pitches.length || 1) * 14;
  const pitchUtilizationRate = Math.min(100, Math.round((todaysBookingsCount / (totalOperatingSlotsToday || 1)) * 100));

  // Filtered Slots for the Live Matrix
  const filteredOperatingTimes = operatingTimes.filter(time => {
    if (slotFilter === 'ALL') return true;
    const slotInfo = slotsAvailability.find(s => s.time === time);
    const status = slotInfo?.status || 'open';
    if (slotFilter === 'OPEN') return status === 'open';
    if (slotFilter === 'LOCKED') return status === 'blocked';
    if (slotFilter === 'BOOKED') return status === 'booked' || status === 'held';
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn font-sans">
      {/* Top Banner with Quick Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 uppercase tracking-wider">
              Pitch Owner Hub
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#22C55E] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
              Live Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Facility Overview
          </h1>
          <p className="text-xs text-text-secondary">
            {pitches.length} active {pitches.length === 1 ? 'pitch' : 'pitches'} · Kampala, Uganda
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <button
            onClick={() => navigate('/owner?tab=Bookings')}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 text-center"
          >
            All Bookings
          </button>
          <button
            onClick={() => navigate('/owner/add-pitch')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-primary-lime/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Pitch</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid: Stacks gracefully on mobile (1 col), tablet (2 col), desktop (4 col) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <BentoKpiCard
          id="kpi-todays-bookings"
          title="Today's Matches"
          value={todaysBookingsCount}
          subtitle={`${todaysBookings.filter(b => b.status === 'CONFIRMED').length} confirmed`}
          icon={Calendar}
          accentColor="text-[#38BDF8]"
          badgeText="Live"
          badgeBg="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
          onClick={() => navigate('/owner?tab=Bookings')}
        />

        <BentoKpiCard
          id="kpi-revenue"
          title="Monthly Revenue"
          value={`UGX ${(revenueThisMonth / 1000).toFixed(0)}k`}
          subtitle={`UGX ${revenueThisMonth.toLocaleString()} gross`}
          icon={DollarSign}
          accentColor="text-primary-lime"
          badgeText="UGX"
          badgeBg="bg-primary-lime/10 text-primary-lime border-primary-lime/30"
          onClick={() => navigate('/owner?tab=Finances')}
        />

        <BentoKpiCard
          id="kpi-utilization"
          title="Pitch Utilization"
          value={`${pitchUtilizationRate}%`}
          subtitle={`${todaysBookingsCount} of ${totalOperatingSlotsToday} slots`}
          icon={Activity}
          accentColor="text-[#A78BFA]"
          badgeText={pitchUtilizationRate > 50 ? "High" : "Normal"}
          badgeBg="bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30"
        />

        <BentoKpiCard
          id="kpi-facilities"
          title="Active Grounds"
          value={pitches.length}
          subtitle="Managed turf arenas"
          icon={Building2}
          accentColor="text-[#FACC15]"
          badgeText="Active"
          badgeBg="bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30"
          onClick={() => navigate('/owner/pitches')}
        />
      </div>

      {/* Weekly Occupancy Heatmap Grid */}
      <WeeklyOccupancyHeatmap pitches={pitches} bookings={bookings} />

      {/* Live Slot Toggle Matrix (Maintenance & Walk-ins) */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-5 shadow-sm">
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-[#38BDF8]" />
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                Live Slot Control
              </h2>
            </div>
            <p className="text-xs text-text-secondary max-w-xl">
              Tap any slot to lock/unlock for walk-in cash players or pitch repairs in real time.
            </p>
          </div>

          {/* Facility & Date Selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {pitches.length > 1 && (
              <select
                value={selectedPitchId}
                onChange={(e) => setSelectedPitchId(e.target.value)}
                className="flex-1 sm:flex-initial bg-surface-raised border border-border-subtle text-text-primary text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#38BDF8] min-h-[40px]"
              >
                {pitches.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            {/* Quick Today/Tomorrow Pills */}
            <div className="flex items-center bg-surface-raised p-1 rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={setDateToday}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedDate === todayStr 
                    ? "bg-primary-lime text-accent-text font-extrabold" 
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={setDateTomorrow}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  selectedDate !== todayStr 
                    ? "bg-primary-lime text-accent-text font-extrabold" 
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Date Picker Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface-raised border border-border-subtle text-text-primary text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-[#38BDF8] min-h-[40px]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['ALL', 'OPEN', 'LOCKED', 'BOOKED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setSlotFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                slotFilter === f
                  ? "bg-text-primary text-app-base font-extrabold"
                  : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              {f === 'ALL' ? 'All Slots' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
          <span className="text-[11px] text-text-tertiary ml-auto hidden sm:inline">
            Showing {filteredOperatingTimes.length} of {operatingTimes.length} slots
          </span>
        </div>

        {/* Slot Grid: 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
        {loadingSlots ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-text-secondary">
            <Loader2 size={20} className="animate-spin text-[#38BDF8]" />
            <span>Loading real-time availability...</span>
          </div>
        ) : filteredOperatingTimes.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-tertiary bg-surface-raised rounded-xl border border-border-subtle">
            No slots match the "{slotFilter}" filter for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {filteredOperatingTimes.map((time) => {
              const slotInfo = slotsAvailability.find(s => s.time === time);
              const status = slotInfo?.status || 'open';
              const isBlocked = status === 'blocked';
              const isBooked = status === 'booked';
              const isHeld = status === 'held';
              const isToggling = togglingSlot === time;

              let badgeStyle = "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30";
              let statusLabel = "Available for Players";
              let cardBg = "bg-surface-raised/60 hover:bg-surface-raised border-border-subtle";

              if (isBlocked) {
                badgeStyle = "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30";
                statusLabel = "Locked (Maintenance/Walk-in)";
                cardBg = "bg-[#FACC15]/5 border-[#FACC15]/30";
              } else if (isBooked) {
                badgeStyle = "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
                statusLabel = "Booked by Player";
                cardBg = "bg-surface-card border-border-subtle opacity-80";
              } else if (isHeld) {
                badgeStyle = "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30";
                statusLabel = "In Player Checkout Cart";
                cardBg = "bg-[#38BDF8]/5 border-[#38BDF8]/30";
              }

              const startHour = parseInt(time.split(':')[0], 10);
              const nextHourStr = `${String(startHour + 1).padStart(2, '0')}:00`;

              return (
                <div
                  key={time}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-text-tertiary" />
                      <span className="text-sm font-bold text-text-primary">
                        {time} – {nextHourStr}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
                      {isBlocked ? "Locked" : isBooked ? "Booked" : isHeld ? "In Cart" : "Open"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs gap-2">
                    <span className="text-[11px] text-text-secondary truncate">
                      {statusLabel}
                    </span>

                    {/* Toggle Button for Owner */}
                    {!isBooked ? (
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleSlotLock(time, status)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px] shrink-0 ${
                          isBlocked
                            ? "bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30"
                            : "bg-[#FACC15]/15 hover:bg-[#FACC15]/25 text-[#FACC15] border border-[#FACC15]/30"
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : isBlocked ? (
                          <>
                            <Unlock size={13} />
                            <span>Unlock</span>
                          </>
                        ) : (
                          <>
                            <Lock size={13} />
                            <span>Lock Slot</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#EF4444] font-bold uppercase tracking-wider px-2 py-1 bg-[#EF4444]/10 rounded-md">
                        Reserved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Match Queue */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-lime" />
            <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
              Today's Scheduled Matches
            </h2>
          </div>
          <button
            onClick={() => navigate('/owner?tab=Bookings')}
            className="text-xs font-bold text-[#38BDF8] hover:underline flex items-center gap-1"
          >
            <span>View All ({todaysBookings.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {todaysBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todaysBookings.slice(0, 6).map((b) => (
              <div 
                key={b.id} 
                className="flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-border-subtle hover:border-border-prominent transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-center text-[#38BDF8] shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {b.userName || b.playerName || 'Player Match'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {b.time} · {pitches.find(p => p.id === b.pitchId)?.name || 'Main Turf'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
                      ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30' 
                      : 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30'
                  }`}>
                    {b.status}
                  </span>
                  {b.userPhone && (
                    <a
                      href={`tel:${b.userPhone}`}
                      className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary"
                      title="Call Player"
                    >
                      <Phone size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-surface-raised rounded-xl border border-border-subtle text-xs text-text-secondary">
            No player bookings scheduled for today yet.
          </div>
        )}
      </div>
    </div>
  );
};
