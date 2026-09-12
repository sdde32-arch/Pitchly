import React from "react";
import { Calendar } from "lucide-react";

interface MatchdayDateStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const MatchdayDateStrip: React.FC<MatchdayDateStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  // Generate next 7 matchdays starting from today
  const matchdays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const isoDate = d.toISOString().split("T")[0];
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNumber = d.getDate();
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });

      days.push({
        iso: isoDate,
        dayName,
        dayNumber,
        monthShort,
        isToday: i === 0,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  }, []);

  return (
    <div id="matchday-date-strip" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary tracking-tight">
          <Calendar size={14} className="text-primary-lime" />
          <span>Select Matchday</span>
        </div>
        <span className="text-[11px] font-semibold text-text-tertiary">
          Real-time pitch availability
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
        {matchdays.map((day) => {
          const isSelected = selectedDate === day.iso;
          return (
            <button
              key={day.iso}
              id={`date-pill-${day.iso}`}
              type="button"
              onClick={() => onSelectDate(day.iso)}
              className={`flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] h-[66px] rounded-2xl px-2.5 py-1.5 border transition-all duration-200 cursor-pointer shrink-0 select-none ${
                isSelected
                  ? "bg-primary-lime text-accent-text border-primary-lime shadow-md shadow-primary-lime/20 scale-[1.02] font-black"
                  : "bg-surface-card hover:bg-surface-raised border-border-subtle hover:border-border-prominent text-text-secondary hover:text-text-primary"
              }`}
            >
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  isSelected ? "text-accent-text/80" : day.isWeekend ? "text-[#38BDF8]" : "text-text-tertiary"
                }`}
              >
                {day.dayName}
              </span>
              <span
                className={`text-lg leading-tight font-black ${
                  isSelected ? "text-accent-text" : "text-text-primary"
                }`}
              >
                {day.dayNumber}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[10px] font-medium ${isSelected ? "text-accent-text/90" : "text-text-tertiary"}`}>
                  {day.monthShort}
                </span>
                {day.isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-accent-text" : "bg-primary-lime "
                    }`}
                    title="Live matchday"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
