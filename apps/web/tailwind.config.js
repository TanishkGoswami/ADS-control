/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        meta: {
          blue: '#0064e0',
          'blue-deep': '#0457cb',
          'blue-soft': '#0091ff',
          fb: '#1876f2',
          link: '#385898',
          ink: '#0a1317',
          'ink-charcoal': '#1c1e21',
          charcoal: '#444950',
          slate: '#4b4c4f',
          steel: '#5d6c7b',
          stone: '#8595a4',
          hairline: '#ced0d4',
          'hairline-soft': '#dee3e9',
          surface: '#f1f4f7',
          canvas: '#ffffff',
          success: '#31a24c',
          attention: '#f2a918',
          warning: '#f7b928',
          critical: '#e41e3f',
          'critical-strong': '#f0284a',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0064e0',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#0a1317',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#e41e3f',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#1c1e21',
          foreground: '#8595a4',
        },
        card: {
          DEFAULT: '#0f172a',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        none: '5px',
        xs: '3px',
        sm: '5px',
        md: '5px',
        lg: '5px',
        xl: '5px',
        xxl: '5px',
        xxxl: '5px',
        feature: '40px',
        full: '100px',
        circle: '9999px',
      },
      spacing: {
        'section-sm': '48px',
        section: '64px',
        'section-lg': '80px',
        hero: '120px',
      }
    },
  },
  plugins: [],
};
