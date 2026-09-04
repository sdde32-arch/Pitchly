import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  Loader2,
} from "lucide-react";
import { weatherService, SlotWeatherForecast } from "../../services/weatherService";

interface MatchWeatherWidgetProps {
  selectedDate: string;
  selectedTime?: string | null;
  endTime?: string | null;
  pitchName?: string;
  latitude?: number;
  longitude?: number;
  compact?: boolean;
  className?: string;
}

export const MatchWeatherWidget: React.FC<MatchWeatherWidgetProps> = ({
  selectedDate,
  selectedTime,
  endTime,
  pitchName,
  latitude,
  longitude,
  compact = false,
  className = "",
}) => {
  const [forecast, setForecast] = useState<SlotWeatherForecast | null>(null);
  const [dayOverview, setDayOverview] = useState<{
    date: string;
    avgTemp: number;
    maxPrecipProb: number;
    condition: string;
    summaryTip: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!selectedDate) return;

    setLoading(true);

    if (selectedTime) {
      weatherService
        .getSlotWeather(selectedDate, selectedTime, latitude, longitude)
        .then((data) => {
          if (isMounted) {
            setForecast(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn("Error fetching slot weather:", err);
          if (isMounted) setLoading(false);
        });
    } else {
      weatherService
        .getDayOverview(selectedDate, latitude, longitude)
        .then((overview) => {
          if (isMounted) {
            setDayOverview(overview);
            setForecast(null);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn("Error fetching day overview:", err);
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedTime, latitude, longitude]);

  const renderWeatherIcon = (
    type?: SlotWeatherForecast["iconType"],
    size: number = 22
  ) => {
    switch (type) {
      case "sun":
        return <Sun size={size} className="text-amber-400 fill-amber-400" />;
      case "moon":
        return <Moon size={size} className="text-indigo-300 fill-indigo-400/30" />;
      case "cloud-sun":
        return <CloudSun size={size} className="text-amber-300" />;
      case "cloud-moon":
        return <CloudMoon size={size} className="text-indigo-300" />;
      case "cloud":
        return <Cloud size={size} className="text-slate-300 fill-slate-400/20" />;
      case "drizzle":
        return <CloudDrizzle size={size} className="text-sky-300" />;
      case "rain":
        return <CloudRain size={size} className="text-blue-400" />;
      case "thunder":
        return <CloudLightning size={size} className="text-amber-400" />;
      case "wind":
        return <Wind size={size} className="text-teal-300" />;
      default:
        return <Sun size={size} className="text-amber-400" />;
    }
  };

  const formattedDate = React.useMemo(() => {
    if (!selectedDate) return "";
    try {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }
      return selectedDate;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Compact variant for Booking Summary / Checkout step
  if (compact && forecast) {
    const isOptimal = forecast.pitchSuitability.status === "optimal";
    return (
      <div
        id="booking-weather-compact"
        className={`p-3.5 rounded-xl bg-surface-raised/70 border border-border-subtle flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-center shrink-0 shadow-2xs">
            {renderWeatherIcon(forecast.iconType, 18)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-text-primary tracking-tight font-display">
                {forecast.temperature}°C
              </span>
              <span className="text-xs font-semibold text-text-secondary truncate">
                • {forecast.condition}
              </span>
            </div>
            <p className="text-[11px] text-text-tertiary truncate">
              {forecast.pitchSuitability.label} ({forecast.precipitationProbability}% rain risk)
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isOptimal
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : forecast.pitchSuitability.status === "caution"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-sky-500/10 text-sky-400 border-sky-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOptimal ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            {forecast.pitchSuitability.status}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="match-weather-widget"
      className={`rounded-2xl bg-surface-card border border-border-subtle p-4 sm:p-5 shadow-xs transition-all overflow-hidden relative ${className}`}
    >
      {/* Top Bar: Live indicator and Time Slot Header */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-lime/10 border border-primary-lime/20 text-primary-lime text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-lime animate-pulse" />
            Matchday Weather
          </span>

          <span className="text-xs font-semibold text-text-secondary truncate">
            {pitchName ? `${pitchName} area` : "Kampala Turf Radar"}
          </span>
        </div>

        {selectedTime ? (
          <div className="flex items-center gap-1 text-xs font-bold text-text-primary shrink-0 bg-surface-raised px-2.5 py-0.5 rounded-lg border border-border-subtle">
            <Clock size={12} className="text-primary-lime" />
            <span>
              {selectedTime}
              {endTime ? ` - ${endTime}` : ""}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-text-tertiary shrink-0 font-medium">
            {formattedDate}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4 flex items-center justify-center gap-2 text-xs text-text-secondary"
          >
            <Loader2 size={16} className="animate-spin text-primary-lime" />
            <span>Checking forecast for {formattedDate}...</span>
          </motion.div>
        ) : forecast ? (
          /* SELECTED TIME SLOT FORECAST */
          <motion.div
            key={`slot-${forecast.time}-${forecast.date}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="space-y-3.5"
          >
            {/* Main Temp & Condition */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-raised/60 p-3.5 rounded-xl border border-border-subtle">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-center shrink-0 shadow-2xs">
                  {renderWeatherIcon(forecast.iconType, 26)}
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-display">
                      {forecast.temperature}°C
                    </span>
                    <span className="text-xs font-medium text-text-tertiary">
                      Feels {forecast.feelsLike}°C
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary">
                    {forecast.condition}
                  </p>
                </div>
              </div>

              {/* Suitability Pill */}
              <div className="self-start sm:self-auto">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    forecast.pitchSuitability.status === "optimal"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                      : forecast.pitchSuitability.status === "caution"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                      : forecast.pitchSuitability.status === "wet"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                      : "bg-sky-500/10 text-sky-400 border-sky-500/25"
                  }`}
                >
                  <ShieldCheck size={13} />
                  <span>{forecast.pitchSuitability.label}</span>
                </div>
              </div>
            </div>

            {/* Weather Metrics Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-raised/40 p-2.5 rounded-xl border border-border-subtle flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-sky-400 text-xs font-semibold mb-0.5">
                  <Droplets size={13} />
                  <span>Rain Risk</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-text-primary font-display">
                  {forecast.precipitationProbability}%
                </span>
              </div>

              <div className="bg-surface-raised/40 p-2.5 rounded-xl border border-border-subtle flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-teal-400 text-xs font-semibold mb-0.5">
                  <Wind size={13} />
                  <span>Wind Speed</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-text-primary font-display">
                  {forecast.windSpeed} km/h
                </span>
              </div>

              <div className="bg-surface-raised/40 p-2.5 rounded-xl border border-border-subtle flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mb-0.5">
                  <Thermometer size={13} />
                  <span>Humidity</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-text-primary font-display">
                  {forecast.humidity}%
                </span>
              </div>
            </div>

            {/* Player Advice Card */}
            <div className="p-3 rounded-xl bg-surface-raised/30 border border-border-subtle flex items-start gap-2.5">
              <Sparkles size={15} className="text-primary-lime shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Matchday Pitch Advice
                </span>
                <p className="text-xs text-text-secondary leading-relaxed font-normal">
                  {forecast.pitchSuitability.advice}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* NO TIME SLOT SELECTED YET: DAY OVERVIEW PROMPT */
          <motion.div
            key="day-overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-raised/50 border border-border-subtle">
              <div className="flex items-center gap-2.5">
                <Sun size={20} className="text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-text-primary">
                    {formattedDate} Daytime Outlook
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Typical {dayOverview?.avgTemp ?? 25}°C • {dayOverview?.maxPrecipProb ?? 15}% rain chance
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-primary-lime bg-primary-lime/10 px-2 py-1 rounded-md">
                Select slot below
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed px-1">
              Select any time slot to view hourly playing conditions, expected temperatures, rain probability, and pitch traction recommendations.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
