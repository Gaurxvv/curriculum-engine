import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        ink: {
          900: "#1B1A18",
          700: "#3D3B37",
          500: "#6B6862",
          300: "#A6A29A",
          200: "#D8D4CC",
          100: "#ECE9E3",
        },
        brand: {
          DEFAULT: "#EC8601",
          50: "#FDF3E7",
          100: "#FBE6CC",
          300: "#F4B565",
          600: "#D97600",
          700: "#B25F00",
        },
        clinical: {
          teal: "#2B6E68",
          tealSoft: "#E5F0EF",
        },
      },
      fontFamily: {
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"Inter"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"SF Mono"',
          "Menlo",
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(27, 26, 24, 0.04), 0 1px 1px rgba(27, 26, 24, 0.03)",
        cardHover: "0 4px 12px rgba(27, 26, 24, 0.08)",
        popover: "0 8px 24px rgba(27, 26, 24, 0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "pulse-soft": "pulse-soft 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
