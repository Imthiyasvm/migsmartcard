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
        "zaffino-dark":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,165,116,0.15), transparent), linear-gradient(180deg, #050505 0%, #0f0c08 50%, #1a1208 100%)",
        "zaffino-section-1":
          "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(212,165,116,0.1), transparent), linear-gradient(180deg, #0a0a0a 0%, #12100c 100%)",
        "zaffino-section-2":
          "radial-gradient(ellipse 50% 30% at 80% 100%, rgba(212,165,116,0.08), transparent), linear-gradient(180deg, #0f0c08 0%, #0a0a0a 100%)",
        "zaffino-section-3":
          "radial-gradient(circle at 50% 50%, rgba(212,165,116,0.06) 0%, transparent 70%), linear-gradient(180deg, #0a0a0a 0%, #14100a 100%)",
        "zaffino-section-4":
          "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(212,165,116,0.12), transparent), linear-gradient(180deg, #12100c 0%, #0a0a0a 100%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
        "premium-gradient":
          "linear-gradient(135deg, #0a0a0a 0%, #1a1208 50%, #2a1f0a 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "slide-down": "slideDown 0.6s ease-out forwards",
        "slide-left": "slideLeft 0.6s ease-out forwards",
        "slide-right": "slideRight 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideLeft: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
