// Calm operational-dashboard motion defaults per AGENTS.md.
export const chartMotion = {
  animation: true,
  animationDuration: 700,
  animationEasing: "cubicOut",
  animationDurationUpdate: 450,
  animationEasingUpdate: "cubicInOut",
  animationThreshold: 2000
} as const;

// Data marks are shades of ICTA green (validated single-hue ramp: monotone
// lightness, adjacent steps distinguishable); brand red stays in chrome and
// alerts only, gray is the de-emphasis neutral. Donut order alternates
// mid/dark/light so touching slices differ strongly in lightness.
export const chartPalette = ["#00A651", "#00522A", "#66C695", "#007A3D", "#6D6E6F"];

// This dashboard's own report-parity palette (matches the source Power BI
// report's default blue/orange theme, not the ICTA brand ramp above -- the
// two live side by side because this data comes from a colleague's separate
// report, not the ICTA-branded training dashboard AGENTS.md's palette was
// written for).
export const reportBlue = "#1667A8";
export const reportBlueLight = "#5B9BD5";
export const reportOrange = "#E8871E";
export const reportPurple = "#6D4FC4";
// Confirmed by directly comparing the source report's 2019 vs. 2009
// Overview pages side by side: the gender-split panel's second color
// differs by year (2019: blue/orange, 2009: blue/purple), not a fixed pair.
export const genderColors: Record<"2019" | "2009", string[]> = {
  "2019": [reportBlue, reportOrange],
  "2009": [reportBlue, reportPurple]
};

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
  const pct = Object.fromEntries(
    rows.map((r) => {
      const share = (100 * r.value) / total;
      return [r.name, share > 0 && share < 1 ? share.toFixed(1) : Math.round(share).toString()];
    })
  );
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
        // Sized so the ring clears a compact multi-row legend even in short
        // cards; percentages live in the legend and tooltip.
        radius: ["38%", "58%"],
        center: ["50%", "36%"],
        label: { show: false },
        data: rows
      }
    ]
  };
}

/** Vertical bar over a sequential category axis (e.g. population by single-year age). */
export function ageBarOption(ages: number[], values: number[], color: string, threshold?: number): Record<string, unknown> {
  return {
    ...chartMotion,
    grid: barGrid,
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ages.map(String), ...axisStyle, axisLabel: { ...axisStyle.axisLabel, interval: 4 } },
    yAxis: { type: "value", ...axisStyle },
    series: [
      {
        type: "bar",
        barGap: 0,
        itemStyle: {
          color: (p: { dataIndex: number }) =>
            threshold != null && ages[p.dataIndex] >= threshold ? color : "#C9D0DA"
        },
        data: values
      }
    ]
  };
}

/** Single-level treemap (e.g. population split by gender), sized by value. */
export function treemapOption(rows: { name: string; value: number }[], colors: string[]): Record<string, unknown> {
  return {
    ...chartMotion,
    color: colors,
    tooltip: {
      formatter: (p: { name: string; value: number }) => `${p.name}: ${new Intl.NumberFormat("en-US").format(p.value)}`
    },
    series: [
      {
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: { show: true, color: "#FFFFFF", fontSize: 12, fontWeight: 600 },
        upperLabel: { show: false },
        itemStyle: { borderColor: "#FFFFFF", borderWidth: 2, gapWidth: 2 },
        data: rows
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
