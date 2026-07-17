import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f0",
          100: "#f9ecda",
          200: "#f0d5b3",
          300: "#e4b87f",
          400: "#d4a574",
          500: "#c9956a",
          600: "#b8864e",
          700: "#9a6f3e",
          800: "#7d5a34",
          900: "#5e4328",
          950: "#3a2a1a",
        },
        accent: {
          50: "#f0fdf6",
          100: "#dcfce9",
          200: "#bbf7d4",
          300: "#86efb0",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803c",
          800: "#166534",
          900: "#14532d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(58, 42, 26, 0.08)",
        card: "0 8px 32px -8px rgba(58, 42, 26, 0.12)",
        glow: "0 0 40px -8px rgba(212, 165, 116, 0.35)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(212,165,116,0.25), transparent), linear-gradient(180deg, #0a0a0a 0%, #1a1208 100%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
        "premium-gradient":
          "linear-gradient(135deg, #0a0a0a 0%, #1a1208 50%, #2a1f0a 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
