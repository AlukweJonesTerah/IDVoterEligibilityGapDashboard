import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6F9",
        paperalt: "#FFFFFF",
        ink: "#0E1722",
        subink: "#3A4856",
        mute: "#6B7787",
        hair: "#E1E5EB",
        hair2: "#EDF0F4",
        icta: {
          green: "#00843D",
          greenDeep: "#005B2E",
          greenSoft: "#E3F3EA",
          red: "#BB1E10",
          redSoft: "#FBE7E4",
          black: "#101820",
          blue: "#1667A8",
          blueSoft: "#E4F0F8"
        },
        signal: {
          gold: "#9A6E20",
          clay: "#B85450",
          slate: "#5E6B7A"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        paper: "0 1px 2px rgba(14,23,34,0.04)",
        card: "0 1px 0 rgba(14,23,34,0.03)"
      }
    }
  },
  plugins: []
};

export default config;
