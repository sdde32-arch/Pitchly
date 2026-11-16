const AUTH_ERROR_MESSAGES: Record<string, string | null> = {
  'auth/email-already-in-use':
    'This email already has an account. Try signing in instead.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/user-disabled':
    'This account has been disabled. Please contact support.',
  'auth/account-exists-with-different-credential':
    'An account with this email already exists using a different sign-in method.',
  'auth/operation-not-allowed':
    "This sign-in method isn't available right now. Please try email sign-in or contact support.",
  'auth/too-many-requests':
    'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed':
    'No internet connection. Check your network and try again.',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
  'auth/popup-blocked':
    'Your browser blocked the sign-in window. Allow pop-ups and try again.',
  'auth/unauthorized-domain':
    "Google sign-in isn't available on this web address yet. Please sign in with your email, or contact support.",
};

const FALLBACK_AUTH_ERROR =
  'Something went wrong. Please try again, or contact support.';

/**
 * Maps Firebase Auth errors to plain-language end-user messages.
 * Returns null when the UI should remain silent (e.g. user-closed pop-up).
 */
export function getAuthErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code;
    if (Object.prototype.hasOwnProperty.call(AUTH_ERROR_MESSAGES, code)) {
      return AUTH_ERROR_MESSAGES[code];
    }
  }
  return FALLBACK_AUTH_ERROR;
}
