// Helper for storing and retrieving recent football pitch searches in localStorage

const RECENT_SEARCHES_KEY = "footlink_recent_searches";
export const DEFAULT_RECENT_SEARCHES = ["Lugogo Arena", "7-A-Side Futsal", "Naguru Turf"];

/**
 * Retrieves the 3 most recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((item) => typeof item === "string" && item.trim().length > 0)
          .slice(0, 3);
      }
    }
  } catch (err) {
    console.warn("Error reading recent searches from localStorage", err);
  }
  return DEFAULT_RECENT_SEARCHES;
}

/**
 * Adds a new search term to the front of recent searches, maintaining max 3 unique items
 */
export function saveRecentSearch(term: string): string[] {
  const cleanTerm = term.trim();
  if (!cleanTerm || cleanTerm.length < 2) {
    return getRecentSearches();
  }

  try {
    const current = getRecentSearches();
    // Remove if already present (case-insensitive)
    const filtered = current.filter((s) => s.toLowerCase() !== cleanTerm.toLowerCase());
    const updated = [cleanTerm, ...filtered].slice(0, 3);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Error saving recent search to localStorage", err);
    return getRecentSearches();
  }
}

/**
 * Clears all recent searches from localStorage
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (err) {
    console.warn("Error clearing recent searches from localStorage", err);
  }
}

/**
 * Removes a specific search term from recent searches
 */
export function removeRecentSearch(termToRemove: string): string[] {
  try {
    const current = getRecentSearches();
    const updated = current.filter((s) => s.toLowerCase() !== termToRemove.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Error removing recent search from localStorage", err);
    return getRecentSearches();
  }
}
