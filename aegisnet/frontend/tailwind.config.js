/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#14532D',
          deep:    '#0B3820',
          light:   '#1e6b3b',
        },
        amber: {
          accent:  '#D97706',
          watch:   '#F59E0B',
        },
        risk: {
          safe:    '#22C55E',
          watch:   '#F59E0B',
          danger:  '#EF4444',
          offline: '#9CA3AF',
        },
        hazard: {
          flood:     '#0D9488', // Teal — reads as water without being blue
          fire:      '#F97316', // Orange
          pollution: '#8B5CF6', // Violet
        },
        aegis: {
          forest:  '#14532D',
          deep:    '#0B3820',
          amber:   '#D97706',
          dark:    '#141A16', // Base page dark
          card:    '#1F2921', // Card surface dark
          border:  '#2D3B2F', // Subtle earthy border
          light:   '#F5F4F0',
          text:    '#EDEDE9',
          muted:   '#6B7280',
          teal:    '#0D9488',
          green:   '#22C55E',
          orange:  '#F97316',
          red:     '#EF4444',
          blue:    '#0D9488', // Aliased to teal to eliminate generic tech-blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
