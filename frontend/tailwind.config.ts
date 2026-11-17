import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: 'var(--navy-50)',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
        },
        green: {
          50: 'var(--green-50)',
          700: 'var(--green-700)',
        },
        amber: {
          50: 'var(--amber-50)',
          600: 'var(--amber-600)',
          800: 'var(--amber-800)',
        },
        coral: {
          50: 'var(--coral-50)',
          700: 'var(--coral-700)',
        },
        ink: {
          900: 'var(--ink-900)',
          600: 'var(--ink-600)',
        },
        line: 'var(--line)',
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
      },
      fontFamily: {
        sans: [
          '"Atkinson Hyperlegible Next"',
          '"Atkinson Hyperlegible"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      borderRadius: {
        control: 'var(--radius-control)',
        panel: 'var(--radius-panel)',
      },
      height: {
        control: 'var(--control-h)',
      },
      minHeight: {
        control: 'var(--control-h)',
      },
    },
  },
  plugins: [],
} satisfies Config;

