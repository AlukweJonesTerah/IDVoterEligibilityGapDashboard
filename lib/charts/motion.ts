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

// Data marks are shades of ICTA green (validated single-hue ramp: monotone
// lightness, adjacent steps distinguishable); brand red stays in chrome and
// alerts only, gray is the de-emphasis neutral. Donut order alternates
// mid/dark/light so touching slices differ strongly in lightness.
export const chartPalette = ["#00A651", "#00522A", "#66C695", "#007A3D", "#6D6E6F"];

export const axisStyle = {
  axisLine: { lineStyle: { color: "#E1E5EB" } },
  axisLabel: { color: "#6B7787", fontSize: 11 },
  splitLine: { lineStyle: { color: "#EDF0F4" } }
};

// containLabel keeps axis labels inside the canvas so long county/course
// names and the last x-axis tick never clip (QA 7.1).
export const barGrid = { left: 8, right: 24, top: 12, bottom: 8, containLabel: true };

// Donuts use a legend below the chart instead of external labels with leader
// lines, which clipped at card edges (QA 7.1/7.3). Tooltip carries the detail.
export function donutOption(
  rows: { name: string; value: number }[],
  colors: string[]
): Record<string, unknown> {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  const pct = Object.fromEntries(rows.map((r) => [r.name, Math.round((100 * r.value) / total)]));
  return {
    ...chartMotion,
    color: colors,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: {
      orient: "vertical",
      bottom: 0,
      left: "center",
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 6,
      formatter: (name: string) => `${name} · ${pct[name]}%`,
      textStyle: { fontSize: 11.5, color: "#3A4856" }
    },
    series: [
      {
        type: "pie",
        // Sized so the ring clears a legend of up to three rows even in
        // short cards; percentages live in the legend and tooltip.
        radius: ["38%", "58%"],
        center: ["50%", "36%"],
        label: { show: false },
        data: rows
      }
    ]
  };
}

/** Horizontal ranked bar with safe margins and truncated names + full-name tooltips. */
export function rankedBarOption(
  names: string[],
  values: number[],
  color: string,
  opts: { pct?: boolean; valueLabels?: boolean } = {}
): Record<string, unknown> {
  return {
    ...rankedBarMotion,
    grid: barGrid,
    tooltip: { trigger: "axis", ...(opts.pct ? { valueFormatter: (v: number) => `${v}%` } : {}) },
    xAxis: {
      type: "value",
      ...axisStyle,
      ...(opts.pct ? { axisLabel: { ...axisStyle.axisLabel, formatter: "{value}%" } } : {})
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: names,
      ...axisStyle,
      axisLabel: { ...axisStyle.axisLabel, width: 170, overflow: "truncate" },
      triggerEvent: true
    },
    series: [
      {
        type: "bar",
        barWidth: 12,
        itemStyle: { color, borderRadius: [0, 2, 2, 0] },
        ...(opts.valueLabels
          ? {
              label: {
                show: true,
                position: "right",
                color: "#3A4856",
                fontSize: 11,
                formatter: ({ value }: { value: number }) =>
                  opts.pct ? `${value}%` : new Intl.NumberFormat("en-US").format(value)
              }
            }
          : {}),
        data: values
      }
    ]
  };
}

/** Time-series line with a real time axis so ticks are evenly spaced (QA 7.2.14). */
export function timeLineOption(
  series: { name: string; color: string; dashed?: boolean; area?: boolean; points: [string, number][] }[]
): Record<string, unknown> {
  return {
    ...chartMotion,
    grid: { left: 8, right: 24, top: 24, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis" },
    xAxis: { type: "time", ...axisStyle },
    yAxis: { type: "value", ...axisStyle },
    series: series.map((s) => ({
      name: s.name,
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { color: s.color, width: s.dashed ? 1.5 : 2, ...(s.dashed ? { type: "dashed" } : {}) },
      ...(s.area ? { areaStyle: { color: s.color + "14" } } : {}),
      data: s.points
    }))
  };
}
