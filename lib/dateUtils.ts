/**
 * Safe date and time utilities for bookings to prevent timezone offset bugs.
 * Standard `new Date("YYYY-MM-DD")` is parsed by ECMAScript as UTC midnight,
 * which shifts backwards to the previous day in timezones behind UTC (such as UTC-1 to UTC-12).
 */

export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // If date string contains date-only format YYYY-MM-DD
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = dateOnly.split("-");
  
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  
  return new Date(dateStr);
};

export const formatBookingDate = (
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string => {
  if (!dateStr) return "";
  try {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString(undefined, options);
  } catch {
    return dateStr;
  }
};

export const formatBookingTime = (
  time?: string,
  slots?: string[],
  duration?: number
): string => {
  if (time && time.includes("-")) {
    return time;
  }

  const slotList = slots && slots.length > 0 ? slots : time ? [time] : [];
  if (slotList.length === 0) return time || "Time not set";

  const startTime = slotList[0];
  const dur = duration && duration > 0 ? duration : slotList.length;

  try {
    const [startHStr, startMStr] = startTime.split(":");
    const startHour = parseInt(startHStr, 10);
    const startMin = startMStr || "00";

    if (isNaN(startHour)) return startTime;

    const endHour = (startHour + dur) % 24;
    const endFormatted = `${String(endHour).padStart(2, "0")}:${startMin}`;

    const durLabel = `${dur} hr${dur > 1 ? "s" : ""}`;
    return `${startTime} - ${endFormatted} (${durLabel})`;
  } catch {
    return startTime;
  }
};
