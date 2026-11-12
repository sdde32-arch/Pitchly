/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core Surfaces & Architecture
        'app-base': 'var(--app-base)',
        'surface-card': 'var(--surface-card)',
        'surface-raised': 'var(--surface-raised)',
        'border-subtle': 'var(--border-subtle)',
        'border-prominent': 'var(--border-prominent)',
        'background': 'var(--app-base)',
        'background-dark': 'var(--app-base)',
        'primary': 'var(--primary-lime)',

        // Brand & Interactive
        'primary-lime': 'var(--primary-lime)',
        'primary-lime-hover': 'var(--primary-lime-hover)',
        'primary-lime-dim': 'var(--primary-lime-dim)',
        'primary-lime-glow': 'var(--primary-lime-glow)',
        'brand-lime': 'var(--brand-lime)',
        'brand-ink': 'var(--brand-ink)',

        // Action & Navigation
        'cta-bg': 'var(--cta-bg)',
        'cta-bg-hover': 'var(--cta-bg-hover)',
        'cta-text': 'var(--cta-text)',
        'nav-bg': 'var(--nav-bg)',
        'nav-text': 'var(--nav-text)',
        'nav-text-muted': 'var(--nav-text-muted)',
        'nav-active-bg': 'var(--nav-active-bg)',
        'nav-active-text': 'var(--nav-active-text)',
        'nav-border': 'var(--nav-border)',
        'nav-owner': 'var(--nav-owner)',
        'nav-admin': 'var(--nav-admin)',
        'nav-bg-glass': 'var(--nav-bg-glass)',
        'nav-owner-tint': 'var(--nav-owner-tint)',
        'nav-admin-tint': 'var(--nav-admin-tint)',
        'nav-owner-border': 'var(--nav-owner-border)',
        'nav-admin-border': 'var(--nav-admin-border)',

        // Typography
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-disabled': 'var(--text-disabled)',
        'text-on-lime': 'var(--accent-text)',

        // Status & Portal Semantic Tokens
        'success': 'var(--success)',
        'success-tint': 'var(--success-tint)',
        'status-success': 'var(--success)',
        'status-success-tint': 'var(--success-tint)',

        'warning': 'var(--warning)',
        'warning-tint': 'var(--warning-tint)',
        'status-warning': 'var(--warning)',
        'status-warning-tint': 'var(--warning-tint)',

        'error': 'var(--error)',
        'error-tint': 'var(--error-tint)',
        'status-error': 'var(--error)',
        'status-error-tint': 'var(--error-tint)',

        'owner': 'var(--owner)',
        'owner-tint': 'var(--owner-tint)',
        'portal-owner': 'var(--owner)',
        'portal-owner-tint': 'var(--owner-tint)',

        'admin': 'var(--admin)',
        'admin-tint': 'var(--admin-tint)',
        'portal-admin': 'var(--admin)',
        'portal-admin-tint': 'var(--admin-tint)',

        'portal-player': 'var(--primary-lime)',

        // Backward Compatibility Aliases
        'deep-black': 'var(--app-base)',
        'charcoal': 'var(--surface-card)',
        'slate': 'var(--surface-raised)',
        'dark-divider': 'var(--border-subtle)',
        'accent': 'var(--primary-lime)',
        'accent-hover': 'var(--primary-lime-hover)',
        'accent-text': 'var(--accent-text)',
        'accent-purple': '#8B5CF6',
        'info': 'var(--owner)',
        'info-token': 'var(--owner)',
        'success-token': 'var(--success)',
        'warning-token': 'var(--warning)',
        'error-token': 'var(--error)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
        'full': '9999px',
      },
      fontFamily: {
        'sans': ['Sora', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display': ['Sora', 'system-ui', 'sans-serif'],
        'body': ['Sora', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    }
  },
  plugins: [],
};
