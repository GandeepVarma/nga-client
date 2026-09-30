/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#244A76",
          light: "#1D3B5F",
          lighter: "#315F8F",
        },
        gold: {
          DEFAULT: "#F2A900",
          light: "#F4C20D",
          dark: "#D89100",
        },
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(29, 59, 95, 0.12)",
        "card-hover": "0 8px 32px -8px rgba(29, 59, 95, 0.2)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
