/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f8f6ff",
          100: "#ede8ff",
          200: "#d9ccfe",
          300: "#c2a9fc",
          400: "#a87df6",
          500: "#8b52ec",
          600: "#7428d6",
          700: "#5e20b5",
          800: "#4d1a94",
          900: "#42177a",
        },
        gold: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        sans:  ["var(--font-zh-sans)", "ui-sans-serif", "system-ui"],
        mono:  ["ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
