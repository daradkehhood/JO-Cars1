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
        // ===== Luxury Navy (Primary) — Mercedes/BMW inspired =====
        primary: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3366ff',
          600: '#1e40af', // royal blue
          700: '#1e3a8a', // navy (main brand)
          800: '#172554', // deep navy
          900: '#0f1f3d', // near-black navy
          950: '#0a1428', // darkest navy
        },
        // ===== Gold (Accent) — luxury accent =====
        gold: {
          50: '#fbf6e9',
          100: '#f5e9c6',
          200: '#ecd592',
          300: '#e0bd5c',
          400: '#d4af37', // classic gold
          500: '#c39826', // main gold
          600: '#a8761c',
          700: '#85591a',
          800: '#70471b',
          900: '#5f3b1c',
          950: '#361f0e',
        },
        // ===== Neutral Surface (warmer, premium grays) =====
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#1e2130', // dark cards
          900: '#13151f', // dark bg
          950: '#0a0c14', // darkest
        },
        // ===== Accent (kept red for danger/CTA) =====
        accent: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc5c5',
          300: '#ff9d9d',
          400: '#ff6464',
          500: '#f83b3b',
          600: '#e51d1d',
          700: '#c11414',
          800: '#a01414',
          900: '#841818',
          950: '#480505',
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
        display: ["Tajawal", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        // soft layered shadows for premium feel
        'soft': '0 1px 2px rgba(15, 31, 61, 0.04), 0 4px 12px -2px rgba(15, 31, 61, 0.06)',
        'soft-md': '0 2px 4px rgba(15, 31, 61, 0.04), 0 8px 24px -4px rgba(15, 31, 61, 0.1)',
        'soft-lg': '0 4px 8px rgba(15, 31, 61, 0.05), 0 16px 40px -8px rgba(15, 31, 61, 0.14)',
        'soft-xl': '0 8px 16px rgba(15, 31, 61, 0.06), 0 24px 64px -12px rgba(15, 31, 61, 0.18)',
        'inner-soft': 'inset 0 1px 2px 0 rgba(15, 31, 61, 0.04)',
        // brand glows
        'primary': '0 6px 20px -4px rgba(30, 58, 138, 0.45)',
        'primary-lg': '0 12px 32px -6px rgba(30, 58, 138, 0.55)',
        'gold': '0 6px 20px -4px rgba(212, 175, 55, 0.45)',
        'gold-lg': '0 12px 32px -6px rgba(212, 175, 55, 0.55)',
        // premium card lift
        'card': '0 1px 3px rgba(15, 31, 61, 0.05), 0 10px 30px -10px rgba(15, 31, 61, 0.12)',
        'card-hover': '0 4px 8px rgba(15, 31, 61, 0.06), 0 24px 48px -12px rgba(15, 31, 61, 0.22)',
      },
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #1e3a8a 0%, #172554 50%, #0f1f3d 100%)',
        'gradient-gold': 'linear-gradient(135deg, #e0bd5c 0%, #d4af37 50%, #c39826 100%)',
        'gradient-shine': 'linear-gradient(110deg, transparent 25%, rgba(212,175,55,0.15) 50%, transparent 75%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'shine': 'shine 3s ease-in-out infinite',
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
          '0%': { boxShadow: '0 0 20px rgba(30, 58, 138, 0.2)' },
          '100%': { boxShadow: '0 0 40px rgba(30, 58, 138, 0.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        shine: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
