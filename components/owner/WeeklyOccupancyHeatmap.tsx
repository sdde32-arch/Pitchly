import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Info, 
  X, 
  Phone, 
  CheckCircle2, 
  DollarSign, 
  Sparkles, 
  Sun, 
  Moon, 
  Sunset, 
  Building2,
  Users,
  Layers
} from 'lucide-react';
import { Pitch } from '../../types/firebase';

interface WeeklyOccupancyHeatmapProps {
  pitches: Pitch[];
  bookings: any[];
}

export const WeeklyOccupancyHeatmap: React.FC<WeeklyOccupancyHeatmapProps> = ({
  pitches,
  bookings
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedPitchId, setSelectedPitchId] = useState<string>('ALL');
  const [selectedCell, setSelectedCell] = useState<{
    dateStr: string;
    dayLabel: string;
    formattedDate: string;
    time: string;
    occupancyRate: number;
    bookings: any[];
    capacity: number;
  } | null>(null);

  const [activeMobileDayIndex, setActiveMobileDayIndex] = useState<number>(() => {
    const today = new Date().getDay(); // 0 is Sun, 1 is Mon...
    return today === 0 ? 6 : today - 1; // 0 for Mon ... 6 for Sun
  });

  // Calculate dates for Monday through Sunday based on weekOffset
  const weekDays = useMemo(() => {
    const now = new Date();
    // Get current day of week (0-6, where 0 is Sunday)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push({
        index: i,
        dayName: dayNames[i],
        fullDayName: fullDayNames[i],
        dateStr,
        formattedDate,
        dayNumber: d.getDate(),
        isToday,
        dateObj: d
      });
    }
    return days;
  }, [weekOffset]);

  // Determine earliest open and latest close across pitches
  const operatingTimes = useMemo(() => {
    let minHour = 7;
    let maxHour = 23;

    if (selectedPitchId !== 'ALL') {
      const targetPitch = pitches.find(p => p.id === selectedPitchId);
      if (targetPitch) {
        const o = parseInt((targetPitch.openingHour || '07:00').split(':')[0], 10) || 7;
        const c = parseInt((targetPitch.closingHour || '23:00').split(':')[0], 10) || 23;
        minHour = o;
        maxHour = c;
      }
    }

    const times: string[] = [];
    for (let h = minHour; h < maxHour; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
    }
    return times;
  }, [pitches, selectedPitchId]);

  // Filter relevant bookings (exclude cancelled/rejected)
  const activeBookings = useMemo(() => {
    return bookings.filter(b => {
      const status = (b.status || '').toUpperCase();
      const isCancelled = status === 'CANCELLED' || status === 'REJECTED';
      if (isCancelled) return false;
      if (selectedPitchId !== 'ALL' && b.pitchId !== selectedPitchId && b.turfId !== selectedPitchId) {
        return false;
      }
      return true;
    });
  }, [bookings, selectedPitchId]);

  // Capacity per slot
  const capacity = useMemo(() => {
    if (selectedPitchId !== 'ALL') return 1;
    return Math.max(1, pitches.length || 1);
  }, [pitches, selectedPitchId]);

  // Matrix Data: Map of `${dateStr}_${time}` -> { count, occupancyRate, bookings, revenue }
  const slotMatrix = useMemo(() => {
    const map: Record<string, { count: number; occupancyRate: number; slotBookings: any[]; revenue: number }> = {};

    weekDays.forEach(day => {
      operatingTimes.forEach(time => {
        const key = `${day.dateStr}_${time}`;
        // Find bookings matching this date and time
        const matching = activeBookings.filter(b => {
          if (b.date !== day.dateStr) return false;
          // Check if time matches or if slots array includes it
          if (b.slots && Array.isArray(b.slots) && b.slots.length > 0) {
            return b.slots.includes(time);
          }
          return b.time === time || b.time?.startsWith(time);
        });

        const count = matching.length;
        const occupancyRate = Math.min(100, Math.round((count / capacity) * 100));
        const revenue = matching.reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0);

        map[key] = {
          count,
          occupancyRate,
          slotBookings: matching,
          revenue
        };
      });
    });

    return map;
  }, [weekDays, operatingTimes, activeBookings, capacity]);

  // Compute Weekly Highlights & Metrics
  const weeklyMetrics = useMemo(() => {
    let totalSlots = weekDays.length * operatingTimes.length * capacity;
    let totalBooked = 0;
    let totalWeeklyRevenue = 0;
    const peakSlots: Array<{ dayName: string; formattedDate: string; time: string; count: number; rate: number }> = [];

    // Daily occupancy stats
    const dailyOccupancy: Record<string, { booked: number; total: number; dayName: string }> = {};
    weekDays.forEach(d => {
      dailyOccupancy[d.dateStr] = { booked: 0, total: operatingTimes.length * capacity, dayName: d.dayName };
    });

    weekDays.forEach(day => {
      operatingTimes.forEach(time => {
        const key = `${day.dateStr}_${time}`;
        const slotData = slotMatrix[key];
        if (slotData) {
          totalBooked += slotData.count;
          totalWeeklyRevenue += slotData.revenue;
          if (dailyOccupancy[day.dateStr]) {
            dailyOccupancy[day.dateStr].booked += slotData.count;
          }
          if (slotData.occupancyRate >= 75) {
            peakSlots.push({
              dayName: day.dayName,
              formattedDate: day.formattedDate,
              time,
              count: slotData.count,
              rate: slotData.occupancyRate
            });
          }
        }
      });
    });

    const avgOccupancy = totalSlots > 0 ? Math.min(100, Math.round((totalBooked / totalSlots) * 100)) : 0;

    // Find busiest day
    let busiestDayName = 'Friday';
    let highestDayRate = 0;
    Object.values(dailyOccupancy).forEach(d => {
      const rate = d.total > 0 ? (d.booked / d.total) * 100 : 0;
      if (rate > highestDayRate) {
        highestDayRate = rate;
        busiestDayName = d.dayName;
      }
    });

    // Top Peak Hours summary
    peakSlots.sort((a, b) => b.rate - a.rate);

    return {
      avgOccupancy,
      totalBooked,
      totalWeeklyRevenue,
      busiestDayName: highestDayRate > 0 ? busiestDayName : 'Fri & Sat',
      peakSlotsCount: peakSlots.length,
      topPeaks: peakSlots.slice(0, 3)
    };
  }, [weekDays, operatingTimes, capacity, slotMatrix]);

  // Color & Intensity Helper
  const getCellIntensity = (rate: number) => {
    if (rate === 0) {
      return {
        bg: 'bg-surface-raised/40 hover:bg-surface-raised border-border-subtle/50 text-text-tertiary',
        label: 'Empty',
        pill: 'bg-surface-raised text-text-tertiary'
      };
    }
    if (rate <= 33) {
      return {
        bg: 'bg-[#38BDF8]/15 hover:bg-[#38BDF8]/30 border-[#38BDF8]/30 text-[#38BDF8]',
        label: 'Low',
        pill: 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
      };
    }
    if (rate <= 66) {
      return {
        bg: 'bg-[#FACC15]/20 hover:bg-[#FACC15]/35 border-[#FACC15]/40 text-[#FACC15]',
        label: 'Moderate',
        pill: 'bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/40'
      };
    }
    if (rate < 100) {
      return {
        bg: 'bg-[#FB923C]/25 hover:bg-[#FB923C]/40 border-[#FB923C]/50 text-[#FB923C]',
        label: 'High Demand',
        pill: 'bg-[#FB923C]/25 text-[#FB923C] border border-[#FB923C]/50'
      };
    }
    return {
      bg: 'bg-primary-lime/25 hover:bg-primary-lime/40 border-primary-lime/60 text-primary-lime font-black shadow-xs',
      label: '100% Peak',
      pill: 'bg-primary-lime/25 text-primary-lime border border-primary-lime/60'
    };
  };

  const weekRangeLabel = `${weekDays[0].formattedDate} – ${weekDays[6].formattedDate}, ${weekDays[0].dateObj.getFullYear()}`;

  const getTimePeriodIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return <Sun size={12} className="text-[#FACC15]" />;
    if (hour < 17) return <Sun size={12} className="text-[#FB923C]" />;
    if (hour < 21) return <Sunset size={12} className="text-[#38BDF8]" />;
    return <Moon size={12} className="text-[#A78BFA]" />;
  };

  return (
    <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle space-y-5 shadow-sm font-sans animate-fadeIn w-full overflow-hidden">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-lime/10 text-primary-lime border border-primary-lime/30 flex items-center justify-center">
              <Flame size={16} />
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight">
              Weekly Occupancy & Demand Heatmap
            </h2>
          </div>
          <p className="text-xs text-text-secondary max-w-xl">
            Visual pattern of slot booking density across the week. Identifies prime rush hours and unbooked off-peak slots.
          </p>
        </div>

        {/* Filters & Week Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Pitch Selector */}
          {pitches.length > 1 && (
            <div className="flex items-center bg-surface-raised rounded-xl px-2.5 py-1 border border-border-subtle">
              <Building2 size={14} className="text-text-tertiary mr-1.5 shrink-0" />
              <select
                value={selectedPitchId}
                onChange={(e) => setSelectedPitchId(e.target.value)}
                className="bg-transparent text-text-primary text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Pitches ({pitches.length})</option>
                {pitches.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Week Navigation Controls */}
          <div className="flex items-center bg-surface-raised rounded-xl p-1 border border-border-subtle">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-card transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => setWeekOffset(0)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                weekOffset === 0
                  ? "bg-primary-lime text-accent-text font-extrabold shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {weekOffset === 0 ? "This Week" : weekRangeLabel}
            </button>

            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-card transition-colors cursor-pointer"
              title="Next Week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Highlights & Analytics Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
            Weekly Occupancy
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-extrabold text-text-primary">
              {weeklyMetrics.avgOccupancy}%
            </span>
            <span className="text-[11px] text-text-secondary font-medium">
              ({weeklyMetrics.totalBooked} matches)
            </span>
          </div>
        </div>

        <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
            Week Revenue
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-extrabold text-primary-lime">
              UGX {(weeklyMetrics.totalWeeklyRevenue / 1000).toFixed(0)}k
            </span>
          </div>
        </div>

        <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
            Peak Demand Days
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-extrabold text-[#FB923C]">
              {weeklyMetrics.busiestDayName}
            </span>
            <Flame size={14} className="text-[#FB923C]" />
          </div>
        </div>

        <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
            Peak Slots (&gt;75%)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-extrabold text-[#38BDF8]">
              {weeklyMetrics.peakSlotsCount}
            </span>
            <span className="text-[11px] text-text-secondary">prime hours</span>
          </div>
        </div>
      </div>

      {/* MOBILE DAY SELECTOR (Shown on small screens for easy touch navigation) */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-text-secondary px-1">
          <span>Tap Day to Inspect</span>
          <span className="text-primary-lime text-[11px]">Swipe or tap</span>
        </div>
        <div className="grid grid-cols-7 gap-1 bg-surface-raised p-1 rounded-xl border border-border-subtle">
          {weekDays.map((d, i) => (
            <button
              key={d.dateStr}
              onClick={() => setActiveMobileDayIndex(i)}
              className={`py-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                activeMobileDayIndex === i
                  ? "bg-primary-lime text-accent-text font-black shadow-xs"
                  : d.isToday
                  ? "bg-surface-card text-text-primary border border-primary-lime/40"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="text-[9px] uppercase font-bold">{d.dayName}</span>
              <span className="text-xs font-extrabold">{d.dayNumber}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HEATMAP GRID: Responsive Full Matrix with Time Labels */}
      <div className="relative">
        <div className="overflow-x-auto no-scrollbar rounded-xl border border-border-subtle bg-surface-raised/30">
          <div className="min-w-[640px] p-2 sm:p-3">
            {/* Column Headers (Days of Week) */}
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2 mb-2 sticky top-0 bg-surface-card/95 backdrop-blur-sm z-10 py-1 rounded-lg border border-border-subtle/50 px-1">
              <div className="text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider flex items-center justify-center">
                Time
              </div>
              {weekDays.map((d, i) => (
                <div
                  key={d.dateStr}
                  onClick={() => setActiveMobileDayIndex(i)}
                  className={`text-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
                    d.isToday 
                      ? "bg-primary-lime/10 border border-primary-lime/30 text-primary-lime" 
                      : "text-text-primary"
                  }`}
                >
                  <div className="text-[11px] font-extrabold uppercase tracking-tight">
                    {d.dayName}
                  </div>
                  <div className="text-[10px] text-text-secondary font-medium">
                    {d.formattedDate}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="space-y-1.5 sm:space-y-2">
              {operatingTimes.map((time) => {
                const hourNum = parseInt(time.split(':')[0], 10);
                const nextHourStr = `${String(hourNum + 1).padStart(2, '0')}:00`;
                const isPrimeTime = hourNum >= 18 && hourNum <= 21;

                return (
                  <div key={time} className="grid grid-cols-8 gap-1.5 sm:gap-2 items-center">
                    {/* Time Label */}
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-text-secondary px-1 py-1 rounded-lg bg-surface-raised border border-border-subtle/60">
                      {getTimePeriodIcon(time)}
                      <span className={isPrimeTime ? "text-primary-lime font-extrabold" : ""}>
                        {time}
                      </span>
                    </div>

                    {/* 7 Day Slot Cells */}
                    {weekDays.map((day) => {
                      const key = `${day.dateStr}_${time}`;
                      const slotData = slotMatrix[key] || { count: 0, occupancyRate: 0, slotBookings: [], revenue: 0 };
                      const intensity = getCellIntensity(slotData.occupancyRate);
                      const isSelected = selectedCell?.dateStr === day.dateStr && selectedCell?.time === time;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedCell({
                              dateStr: day.dateStr,
                              dayLabel: `${day.fullDayName}, ${day.formattedDate}`,
                              formattedDate: day.formattedDate,
                              time: `${time} – ${nextHourStr}`,
                              occupancyRate: slotData.occupancyRate,
                              bookings: slotData.slotBookings,
                              capacity
                            });
                          }}
                          className={`h-11 sm:h-12 rounded-xl border p-1 sm:p-1.5 flex flex-col items-center justify-between transition-all cursor-pointer active:scale-95 select-none ${intensity.bg} ${
                            isSelected ? "ring-2 ring-primary-lime ring-offset-2 ring-offset-surface-card" : ""
                          }`}
                          title={`${day.dayName} ${time}: ${slotData.occupancyRate}% (${slotData.count} bookings)`}
                        >
                          <div className="w-full flex items-center justify-between">
                            <span className="text-[10px] sm:text-[11px] font-black leading-none">
                              {slotData.occupancyRate > 0 ? `${slotData.occupancyRate}%` : "—"}
                            </span>
                            {slotData.occupancyRate === 100 ? (
                              <Flame size={11} className="text-primary-lime" />
                            ) : slotData.occupancyRate >= 66 ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C]" />
                            ) : null}
                          </div>

                          <div className="w-full flex items-center justify-between text-[9px] font-bold opacity-80">
                            <span>{slotData.count > 0 ? `${slotData.count} match` : "Open"}</span>
                            {slotData.revenue > 0 && (
                              <span className="hidden sm:inline font-extrabold text-[8.5px]">
                                {(slotData.revenue / 1000).toFixed(0)}k
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* HEATMAP LEGEND & INSIGHTS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
        {/* Legend */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
            Demand Intensity:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-surface-raised border border-border-subtle" />
            <span className="text-[11px] text-text-secondary">0% Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#38BDF8]/20 border border-[#38BDF8]/40" />
            <span className="text-[11px] text-text-secondary">1-33% Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#FACC15]/25 border border-[#FACC15]/50" />
            <span className="text-[11px] text-text-secondary">34-66% Med</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#FB923C]/30 border border-[#FB923C]/60" />
            <span className="text-[11px] text-text-secondary">67-99% High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-primary-lime/30 border border-primary-lime/70" />
            <span className="text-[11px] text-primary-lime font-bold">100% Sold Out</span>
          </div>
        </div>

        {/* Tip Tag */}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Sparkles size={13} className="text-[#38BDF8]" />
          <span>Click any slot cell to view player matches</span>
        </div>
      </div>

      {/* POPUP MODAL: Cell Inspection Details */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card border border-border-subtle w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-subtle pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                    getCellIntensity(selectedCell.occupancyRate).pill
                  }`}>
                    {getCellIntensity(selectedCell.occupancyRate).label}
                  </span>
                  <span className="text-xs font-bold text-text-tertiary">
                    {selectedCell.occupancyRate}% Occupancy
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-text-primary mt-1">
                  {selectedCell.dayLabel}
                </h3>
                <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                  <Clock size={12} className="text-[#38BDF8]" />
                  <span>{selectedCell.time}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedCell(null)}
                className="w-8 h-8 rounded-lg bg-surface-raised text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3">
              {selectedCell.bookings.length === 0 ? (
                <div className="py-8 text-center bg-surface-raised rounded-xl border border-border-subtle p-4 space-y-2">
                  <Clock size={28} className="mx-auto text-text-tertiary opacity-50" />
                  <p className="text-xs font-bold text-text-primary">
                    No bookings registered for this time slot
                  </p>
                  <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                    This slot is completely open for online player bookings or on-pitch walk-in games.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
                    Scheduled Matches ({selectedCell.bookings.length})
                  </span>
                  {selectedCell.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-surface-raised rounded-xl border border-border-subtle flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-text-primary truncate">
                          {b.userName || b.playerName || 'Player Match'}
                        </p>
                        <p className="text-[11px] text-text-secondary truncate">
                          {pitches.find(p => p.id === b.pitchId)?.name || 'Main Pitch'} · UGX {(b.totalPrice || b.price || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
                            ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                            : 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30'
                        }`}>
                          {b.status}
                        </span>
                        {b.userPhone && (
                          <a
                            href={`tel:${b.userPhone}`}
                            className="w-7 h-7 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary"
                            title="Call Player"
                          >
                            <Phone size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Total Revenue: <strong className="text-text-primary">UGX {selectedCell.bookings.reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0).toLocaleString()}</strong>
              </span>
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
