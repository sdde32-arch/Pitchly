import { useMatchReminder } from '../context/MatchReminderContext';

export function useMatchReminders() {
  // Returns match reminder context and triggers periodic check
  return useMatchReminder();
}
