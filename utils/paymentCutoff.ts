/**
 * Payment Cutoff Calculation & Formatting
 * Pure utility functions with zero Firebase dependencies.
 */

const ONE_HOUR_MS = 60 * 60 * 1000; // 3,600,000 ms

/**
 * Computes the auto-cancellation cutoff timestamp in milliseconds.
 * - Standard rule: 1 hour before kickoff (kickoffMs - 1 hour).
 * - Grace rule: If payment proof was submitted less than or exactly 1 hour before kickoff
 *   (submittedMs >= kickoffMs - 1 hour), cutoff is extended to kickoffMs itself.
 */
export function computeCutoffMs(kickoffMs: number, submittedMs: number): number {
  const oneHourBefore = kickoffMs - ONE_HOUR_MS;
  if (submittedMs >= oneHourBefore) {
    return kickoffMs;
  }
  return oneHourBefore;
}

/**
 * Formats a millisecond timestamp into 24-hour "HH:mm" in Africa/Kampala (+03:00).
 */
export function formatKampalaTime(ms: number): string {
  const date = new Date(ms);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return formatter.format(date);
}

/**
 * Formats a cutoff timestamp into a label:
 * - If cutoff falls on the same calendar day as now in Africa/Kampala: "HH:mm" (24-hour)
 * - Otherwise: e.g. "Fri 6 Nov, 17:00" (Intl.DateTimeFormat, en-GB, timeZone Africa/Kampala)
 */
export function formatCutoffLabel(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const dayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  if (dayFormatter.format(now) === dayFormatter.format(date)) {
    return formatKampalaTime(ms);
  }
  const fullFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return fullFormatter.format(date);
}
