import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
          950: '#1e3a8a',
        },
        surface: {
          50: '#fafbfc',
          100: '#f4f6f8',
          200: '#eaecf0',
          300: '#d0d5dd',
          400: '#98a2b3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1d2939',
          900: '#101828',
          950: '#0c1322',
        },
        accent: {
          50: '#fff0f0',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ffa3a3',
          400: '#ff6b6b',
          500: '#f03131',
          600: '#e02020',
          700: '#bc1818',
          800: '#9a1818',
          900: '#801a1a',
        },
        success: {
          50: '#ecfdf3',
          100: '#d1fadf',
          200: '#a6f4c5',
          300: '#6ce9a6',
          400: '#32d583',
          500: '#12b76a',
          600: '#039855',
          700: '#027a48',
          800: '#05603b',
          900: '#054f31',
        },
        warning: {
          50: '#fffaeb',
          100: '#fef0c7',
          200: '#fedf89',
          300: '#fec84b',
          400: '#fdb022',
          500: '#f79009',
          600: '#dc6803',
          700: '#b54708',
          800: '#93370d',
          900: '#7a2e0e',
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: ["Tajawal", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(16, 24, 40, 0.06), 0 4px 16px -4px rgba(16, 24, 40, 0.1)',
        'soft-md': '0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 8px 24px -4px rgba(16, 24, 40, 0.12)',
        'soft-lg': '0 8px 24px -4px rgba(16, 24, 40, 0.1), 0 16px 48px -8px rgba(16, 24, 40, 0.14)',
        'soft-xl': '0 12px 32px -4px rgba(16, 24, 40, 0.12), 0 24px 64px -8px rgba(16, 24, 40, 0.16)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(16, 24, 40, 0.04)',
        'primary': '0 4px 14px -3px rgba(92, 124, 250, 0.4)',
        'primary-lg': '0 8px 24px -4px rgba(92, 124, 250, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(92, 124, 250, 0.15)' },
          '100%': { boxShadow: '0 0 40px rgba(92, 124, 250, 0.25)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
