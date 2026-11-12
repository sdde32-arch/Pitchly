/**
 * Platform Contact Details & Utilities
 * Single source of truth for support contact information.
 */

export const SUPPORT_EMAIL = 'support@pitchly.live';
export const SITE_URL = 'https://pitchly.live';

// Keep empty string when no official WhatsApp support number is configured.
// When set, format with country code and digits only (e.g. '2567XXXXXXXX').
export const SUPPORT_WHATSAPP = '';

/**
 * Checks whether WhatsApp support is configured and available.
 */
export function hasWhatsApp(): boolean {
  const digits = SUPPORT_WHATSAPP.replace(/\D/g, '');
  return digits.length >= 9;
}

/**
 * Builds a direct wa.me link if WhatsApp is configured, or returns null.
 */
export function getWhatsAppUrl(message?: string): string | null {
  if (!hasWhatsApp()) return null;
  const digits = SUPPORT_WHATSAPP.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  if (message && message.trim()) {
    return `${base}?text=${encodeURIComponent(message.trim())}`;
  }
  return base;
}

/**
 * Builds a mailto link with optional subject and body.
 */
export function getSupportMailto(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject && subject.trim()) params.set('subject', subject.trim());
  if (body && body.trim()) params.set('body', body.trim());
  const query = params.toString();
  return query ? `mailto:${SUPPORT_EMAIL}?${query}` : `mailto:${SUPPORT_EMAIL}`;
}
