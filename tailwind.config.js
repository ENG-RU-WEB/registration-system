// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // ให้ครอบคลุมไฟล์ใน src/app
  ],
  theme: {
    extend: {
      colors: {
        bloodred: '#8A0303',
      },
      fontFamily: {
        sarabun: ['var(--font-sarabun)'],
      },
    },
  },
  plugins: [],
};
