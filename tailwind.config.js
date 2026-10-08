/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mac: {
          bg: {
            light: '#F5F5F7',
            dark: '#18181B'
          },
          card: {
            light: '#FFFFFF',
            dark: '#27272A'
          },
          border: {
            light: 'rgba(0, 0, 0, 0.08)',
            dark: 'rgba(255, 255, 255, 0.1)'
          },
          blue: {
            DEFAULT: '#0A84FF',
            hover: '#0071E3',
            subtle: '#E8F2FF',
            subtleDark: '#1A365D'
          },
          green: {
            DEFAULT: '#34C759',
            subtle: '#EDFDF2',
            subtleDark: '#14532D'
          },
          amber: {
            DEFAULT: '#FF9F0A',
            subtle: '#FFF8EB',
            subtleDark: '#78350F'
          },
          red: {
            DEFAULT: '#FF3B30',
            subtle: '#FEF2F2',
            subtleDark: '#7F1D1D'
          }
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      },
      boxShadow: {
        'mac': '0 2px 14px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'mac-hover': '0 8px 24px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'mac-modal': '0 20px 50px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}
