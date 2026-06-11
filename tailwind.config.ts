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
          red: "#ED1C24",
          redDeep: "#8E1014",
          redSoft: "#FDEDEB",
          black: "#101820",
          gray: "#6D6E6F",
          green: "#00A651",
          greenDeep: "#007A3D",
          greenSoft: "#E6F6EE",
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
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
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
