/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors') // Import default colors

export default {
  content: [
    './components/**/*.{html,js,ts,vue}',
    './layouts/**/*.{html,js,ts,vue}',
    './pages/**/*.{html,js,ts,vue}',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'fadeIn': 'fadeIn 1s ease-out',
        'pulse': 'pulse 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        pulse: {
          '0%': {
            boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.5)'
          },
          '70%': {
            boxShadow: '0 0 0 15px rgba(37, 211, 102, 0)'
          },
          '100%': {
            boxShadow: '0 0 0 0 rgba(37, 211, 102, 0)'
          }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' }
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)' 
          },
          '33%': { 
            transform: 'translateY(-20px) rotate(5deg)' 
          },
          '66%': { 
            transform: 'translateY(-10px) rotate(-5deg)' 
          }
        }
      },
      boxShadow: {
        'sm': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'md': '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)',
        'lg': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      // We define colors in 'extend' so we don't lose Tailwind defaults, 
      // or we explicitly include the ones we need if overriding 'colors' directly.
      colors: {
        // Primary brand colors
        primary: {
          50: '#eaf2fa',
          100: '#d5e5f5',
          200: '#abc8eb',
          300: '#82ace1',
          400: '#588fd7',
          500: '#2E6BB7', // Main primary blue
          600: '#245591',
          700: '#1b406d',
          800: '#122a48',
          900: '#091524',
          950: '#050a12',
        },
        
        // Dark section background
        dark: {
          50: '#e6eef5',
          100: '#ccdceb',
          200: '#99b9d7',
          300: '#6697c3',
          400: '#3374af',
          500: '#0d2c4f', // Main dark blue for sections
          600: '#0a2340',
          700: '#081a30',
          800: '#051020',
          900: '#030710',
          950: '#010408',
        },
        
        // Text colors
        text: {
          primary: '#1a202c',
          secondary: '#5a6474',
        },
        
        // Accent colors
        accent: {
          green: '#25D366', // WhatsApp green
          'green-light': '#e9fbf0',
          red: '#e53e3e',
          'red-light': '#fff5f5',
          'blue-light': '#eaf2fa',
          gold: '#ffc107', // Star rating color
        },
        
        // Background colors
        bg: {
          main: '#f8f9fa',
          card: '#ffffff',
          'dark-section': '#0d2c4f',
        },
        
        // Border color
        border: {
          DEFAULT: '#e2e8f0',
          light: '#c2d9f0',
        },

        // Include standard colors needed for status badges
        teal: colors.teal,
        cyan: colors.cyan,
        emerald: colors.emerald,
        purple: colors.purple,
        
        // Explicitly include these if not using 'extend' fully or overwriting 'colors'
        slate: colors.slate,
        gray: colors.gray,
        red: colors.red,
        orange: colors.orange,
        amber: colors.amber,
        yellow: colors.yellow,
        green: colors.green,
        blue: colors.blue,
        indigo: colors.indigo,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography')
  ],
}