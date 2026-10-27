/**
 * Validation utility functions for payments and contact details.
 */

/**
 * Validates transaction reference format:
 * After trimming, 6 to 25 characters, only letters, digits, dots, dashes, underscores and spaces.
 */
export function isValidTransactionRef(s: any): boolean {
  if (typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed.length < 6 || trimmed.length > 25) return false;
  return /^[a-zA-Z0-9._ -]+$/.test(trimmed);
}

/**
 * Normalizes Ugandan phone numbers:
 * Accepts 07XXXXXXXX, 7XXXXXXXX, +2567XXXXXXXX, and 2567XXXXXXXX (spaces and dashes ignored).
 * Returns '+2567XXXXXXXX' or null if invalid.
 */
export function normalizeUgPhone(s: any): string | null {
  if (typeof s !== 'string') return null;
  const clean = s.replace(/[\s-]/g, '').trim();

  // +2567XXXXXXXX
  if (/^\+256(7\d{8})$/.test(clean)) {
    return '+256' + RegExp.$1;
  }
  // 2567XXXXXXXX
  if (/^256(7\d{8})$/.test(clean)) {
    return '+256' + RegExp.$1;
  }
  // 07XXXXXXXX
  if (/^0(7\d{8})$/.test(clean)) {
    return '+256' + RegExp.$1;
  }
  // 7XXXXXXXX
  if (/^(7\d{8})$/.test(clean)) {
    return '+256' + RegExp.$1;
  }

  return null;
}
