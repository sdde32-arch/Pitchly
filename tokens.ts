/**
 * Pitchly High-Fidelity Design System Tokens
 * Strictly Forced Dark Mode SaaS Architecture for Kampala Pitch Platform.
 */

export const SHARED_LAYOUT_TOKENS = {
  // Corner Radii - Structured 4px nested rule
  radii: {
    base: '6px',          // Micro tags, badge chips (rounded-sm)
    badge: '10px',        // Status pills & indicator chips (rounded-md)
    input: '12px',        // Form fields, slot chips, search inputs (rounded-xl)
    button: '12px',       // Action buttons & CTAs (rounded-xl)
    innerCard: '14px',    // Sub-panels inside container cards (rounded-lg)
    card: '16px',         // Main pitch cards, list containers (rounded-2xl)
    modal: '20px',        // Popups, sheets, dialogs (rounded-3xl)
    pill: '9999px',       // Full pill indicators (rounded-full)
  },

  // Typography Specifications - Built strictly on Sora
  typography: {
    fontFamily: "'Sora', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontSize: '24px',
      lineHeight: '30px',
      fontWeight: '700', // Bold
      letterSpacing: '-0.03em',
    },
    h2: {
      fontSize: '18px',
      lineHeight: '24px',
      fontWeight: '600', // SemiBold
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '15px',
      lineHeight: '21px',
      fontWeight: '600', // SemiBold
      letterSpacing: '-0.01em',
    },
    body: {
      fontSize: '14px',
      lineHeight: '22px',
      fontWeight: '400', // Regular
      letterSpacing: '0em',
    },
    bodyMedium: {
      fontSize: '14px',
      lineHeight: '21px',
      fontWeight: '500', // Medium
      letterSpacing: '0em',
    },
    caption: {
      fontSize: '12px',
      lineHeight: '17px',
      fontWeight: '500', // Medium
      letterSpacing: '+0.01em',
    },
    microTag: {
      fontSize: '10px',
      lineHeight: '13px',
      fontWeight: '700', // Bold
      letterSpacing: '+0.05em',
      textTransform: 'uppercase' as const,
    },
  },

  // Spacing & Padding Scale
  spacing: {
    containerPadding: '16px',
    cardPadding: '16px',
    cardGap: '12px',
    sectionGap: '20px',
    elementGap: '8px',
    touchTargetMin: '44px',
  },
} as const;

export const COLOR_TOKENS = {
  // Surfaces
  bgAppBase: '#0D0D0D',         // Deep Black viewport canvas
  bgSurfaceCard: '#161616',     // Primary card & container background
  bgSurfaceRaised: '#202020',   // Modals, sticky headers, raised sheets
  borderSubtle: '#262626',      // 1px structural container divider
  borderProminent: '#383838',   // Interactive border, input hover, active slot outline

  // Primary Brand Accent
  primaryLime: '#A8FF00',       // Primary interactive CTA & active radio indicator
  primaryLimeHover: '#96E600',
  primaryLimeDim: 'rgba(168, 255, 0, 0.12)',
  primaryLimeGlow: 'rgba(168, 255, 0, 0.25)',

  // Calibrated WCAG AA (>5:1) Typography
  textPrimary: '#F4F4F5',       // High contrast white-zinc (17.6:1 contrast)
  textSecondary: '#A1A1AA',     // Legible secondary text (7.6:1 contrast)
  textTertiary: '#94949E',      // Calibrated tertiary meta/placeholders (>5.6:1 contrast)
  textDisabled: '#52525B',      // Disabled/strike-through slots
  textOnLime: '#0D0D0D',        // Dark text on lime button (15.7:1 contrast)

  // Distinct Portal Architecture
  portal: {
    player: { badge: '#A8FF00', bg: 'rgba(168, 255, 0, 0.10)', border: 'rgba(168, 255, 0, 0.25)' },
    owner: { badge: '#38BDF8', bg: 'rgba(56, 189, 248, 0.10)', border: 'rgba(56, 189, 248, 0.25)' },
    admin: { badge: '#A78BFA', bg: 'rgba(167, 139, 250, 0.10)', border: 'rgba(167, 139, 250, 0.25)' },
  },

  // Semantic Status (Yellow reserved purely for Warnings/Pending)
  status: {
    success: { text: '#22C55E', bg: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.25)', dot: '#22C55E' },
    warning: { text: '#FACC15', bg: 'rgba(250, 204, 21, 0.10)', border: 'rgba(250, 204, 21, 0.25)', dot: '#FACC15' },
    error: { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.25)', dot: '#EF4444' },
    info: { text: '#38BDF8', bg: 'rgba(56, 189, 248, 0.10)', border: 'rgba(56, 189, 248, 0.25)', dot: '#38BDF8' },
  },
} as const;

export const DESIGN_TOKENS = {
  ...SHARED_LAYOUT_TOKENS,
  colors: COLOR_TOKENS,
} as const;

export type AppPortal = 'player' | 'owner' | 'admin';
export type StatusVariant = 'success' | 'warning' | 'error' | 'info';
export type AppTheme = 'dark';


