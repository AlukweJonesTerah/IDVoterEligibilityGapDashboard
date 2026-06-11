// Calm operational-dashboard motion defaults per AGENTS.md.
export const chartMotion = {
  animation: true,
  animationDuration: 700,
  animationEasing: "cubicOut",
  animationDurationUpdate: 450,
  animationEasingUpdate: "cubicInOut",
  animationThreshold: 2000
} as const;

export const rankedBarMotion = {
  ...chartMotion,
  animationDelay: (idx: number) => idx * 18,
  animationDelayUpdate: (idx: number) => idx * 8
};

// ICTA brand: red and black lead, green is a small accent (logo: #ED1C24 / #101820 / #00A651 / #6D6E6F).
export const chartPalette = ["#ED1C24", "#101820", "#6D6E6F", "#00A651", "#9A6E20", "#1667A8"];

export const axisStyle = {
  axisLine: { lineStyle: { color: "#E1E5EB" } },
  axisLabel: { color: "#6B7787", fontSize: 11 },
  splitLine: { lineStyle: { color: "#EDF0F4" } }
};
