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

        // Typography
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-disabled': 'var(--text-disabled)',
        'text-on-lime': 'var(--accent-text)',

        // Distinct Portal Accents
        'portal-player': '#16A34A',
        'portal-owner': '#0284C7',
        'portal-admin': '#7C3AED',

        // Semantic Status Colors
        'status-success': '#16A34A',
        'status-warning': '#D97706',
        'status-error': '#DC2626',
        'status-info': '#0284C7',

        // Backward Compatibility Aliases
        'deep-black': 'var(--app-base)',
        'charcoal': 'var(--surface-card)',
        'slate': 'var(--surface-raised)',
        'dark-divider': 'var(--border-subtle)',
        'accent': 'var(--primary-lime)',
        'accent-hover': 'var(--primary-lime-hover)',
        'accent-text': 'var(--accent-text)',
        'accent-purple': '#8B5CF6',
        'warning': '#D97706',
        'error': '#DC2626',
        'success': '#16A34A',
        'info': '#0284C7',
        'success-token': '#16A34A',
        'warning-token': '#D97706',
        'error-token': '#DC2626',
        'info-token': '#0284C7',
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
