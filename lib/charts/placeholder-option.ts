const palette = {
  green: "#00843D",
  greenDeep: "#005B2E",
  red: "#BB1E10",
  blue: "#1667A8",
  ink: "#0E1722",
  subink: "#3A4856",
  hair: "#E1E5EB"
};

export const placeholderOption = {
  backgroundColor: "#FFFFFF",
  color: [palette.green, palette.blue, palette.red],
  grid: { left: 38, right: 18, top: 32, bottom: 34 },
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: palette.hair,
    textStyle: { color: palette.ink, fontSize: 12 }
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["Raw", "Stage", "Model", "Publish"],
    axisLine: { lineStyle: { color: palette.hair } },
    axisTick: { show: false },
    axisLabel: { color: palette.subink, fontSize: 11 }
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 100,
    axisLabel: { color: palette.subink, fontSize: 11, formatter: "{value}%" },
    splitLine: { lineStyle: { color: "#EDF0F4", type: "dashed" } }
  },
  series: [
    {
      name: "Readiness",
      type: "line",
      smooth: true,
      symbolSize: 7,
      lineStyle: { width: 2.4, color: palette.greenDeep },
      itemStyle: { color: palette.greenDeep, borderColor: "#FFFFFF", borderWidth: 1.5 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(0,132,61,0.18)" },
            { offset: 1, color: "rgba(0,132,61,0.02)" }
          ]
        }
      },
      data: [100, 0, 0, 0]
    }
  ]
};
