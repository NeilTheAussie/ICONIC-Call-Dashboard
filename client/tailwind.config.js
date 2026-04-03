/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F14',
        bg2: '#1A1A24',
        bg3: '#15151E',
        bgc: '#12121A',
        pur: '#7C3AED',
        grn: '#22C55E',
        red: '#EF4444',
        yel: '#EAB308',
        org: '#F97316',
        blu: '#3B82F6',
        gry: '#6B7280',
        gryl: '#9CA3AF',
        txt: '#E5E7EB',
        txtd: '#9CA3AF',
        txtb: '#F9FAFB',
        bdr: '#2A2A3A',
        bdrl: '#3A3A4A',
      },
    },
  },
  plugins: [],
};
