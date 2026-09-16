"use client";

import { useEffect, useState } from "react";
import * as echarts from "echarts";
import { EChart } from "./EChart";
import { chartMotion } from "@/lib/charts/motion";

const GEO_PATH: Record<Boundary, string> = {
  county: "/geo/kenya-counties.geojson",
  constituency: "/geo/kenya-constituencies.geojson"
};
const MAP_NAME: Record<Boundary, string> = {
  county: "kenya-counties",
  constituency: "kenya-constituencies"
};

export type Boundary = "county" | "constituency";

const registered: Partial<Record<Boundary, boolean>> = {};

export interface RegionDatum {
  name: string; // canonical name matching the GeoJSON's properties.name
  value: number;
  extra?: Record<string, string | number | null>;
}

export function ShapeMap({
  data,
  boundary = "county",
  height = 420,
  mobileHeight,
  label = "Value",
  onRegionClick,
  selectedName
}: {
  data: RegionDatum[];
  boundary?: Boundary;
  height?: number;
  mobileHeight?: number;
  label?: string;
  onRegionClick?: (name: string) => void;
  /** Outlines this region (e.g. the county the user has filtered to) without narrowing the data itself. */
  selectedName?: string | null;
}) {
  const [ready, setReady] = useState(!!registered[boundary]);

  useEffect(() => {
    setReady(!!registered[boundary]);
    if (registered[boundary]) return;
    fetch(GEO_PATH[boundary])
      .then((r) => r.json())
      .then((geo) => {
        echarts.registerMap(MAP_NAME[boundary], geo);
        registered[boundary] = true;
        setReady(true);
      });
  }, [boundary]);

  if (!ready) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-mute">
        Loading map…
      </div>
    );
  }

  // Population-style data is heavily right-skewed (e.g. Nairobi vs. the rest
  // of Kenya's counties), so a linear color scale leaves almost every region
  // in the palest 10% of the range and the map reads as flat/colorless. Color
  // by a log-compressed value instead while keeping the real number (index 0)
  // for the tooltip -- map series support multi-dimension values, and
  // visualMap.dimension picks which one drives the color.
  //
  // The visualMap range is anchored to the data's own min/max, not a fixed
  // 0 floor: real values here never get close to 0, so a 0 floor would still
  // cram every region into the top slice of the ramp after the log compresses
  // everything -- same "looks flat" problem one step removed.
  const values = data.map((d) => Math.max(0, d.value));
  const colorMin = Math.log1p(values.length ? Math.min(...values) : 0);
  const colorMax = Math.max(colorMin + 0.001, Math.log1p(values.length ? Math.max(...values) : 1));
  const mapData = data.map((d) => ({
    name: d.name,
    value: [d.value, Math.log1p(Math.max(0, d.value))],
    extra: d.extra
  }));
  const option = {
    ...chartMotion,
    tooltip: {
      trigger: "item",
      formatter: (p: { name: string; value: number[] | number | undefined; data?: RegionDatum }) => {
        const raw = Array.isArray(p.value) ? p.value[0] : p.value;
        const lines = [`<b>${p.name}</b>`, `${label}: ${Number.isFinite(raw) ? Number(raw).toLocaleString() : "—"}`];
        const extra = p.data?.extra;
        if (extra) {
          for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${v ?? "—"}`);
        }
        return lines.join("<br/>");
      }
    },
    visualMap: {
      min: colorMin,
      max: colorMax,
      dimension: 1,
      left: 0,
      bottom: 0,
      orient: "horizontal",
      itemWidth: 9,
      itemHeight: 70,
      text: ["High", "Low"],
      textStyle: { color: "#6B7787", fontSize: 11 },
      // Wider, more saturated ramp than the old 3-stop pale-blue-to-medium-blue
      // one -- more stops and a much darker top end make concentration visible
      // even after compression.
      inRange: { color: ["#EAF3FB", "#9DC9EA", "#4A93CB", "#155D96", "#062C49"] }
    },
    toolbox: {
      right: 4,
      top: 0,
      itemSize: 13,
      iconStyle: { borderColor: "#6B7787" },
      emphasis: { iconStyle: { borderColor: "#1667A8" } },
      feature: {
        restore: { title: "Reset view" },
        dataView: { title: "View data", readOnly: true, lang: ["Data view", "Close", "Refresh"] },
        saveAsImage: { title: "Save as image" }
      }
    },
    series: [
      {
        type: "map",
        map: MAP_NAME[boundary],
        // Kenya straddles the equator; the ECharts default aspectScale of 0.75
        // compresses it horizontally.
        aspectScale: 1,
        layoutCenter: ["50%", "50%"],
        layoutSize: "92%",
        roam: true,
        scaleLimit: { min: 1, max: 8 },
        selectedMode: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 10 }, itemStyle: { areaColor: "#0E4E82" } },
        itemStyle: { borderColor: "#FFFFFF", borderWidth: 0.6 },
        data: selectedName
          ? mapData.map((d) => (d.name === selectedName ? { ...d, itemStyle: { borderColor: "#0E1722", borderWidth: 2.5 } } : d))
          : mapData
      }
    ]
  };

  return (
    <EChart
      option={option}
      height={height}
      mobileHeight={mobileHeight}
      onEvents={onRegionClick ? { click: (p: { name?: string }) => p.name && onRegionClick(p.name) } : undefined}
    />
  );
}
