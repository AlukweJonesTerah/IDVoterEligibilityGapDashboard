"use client";

import { useEffect, useState } from "react";
import * as echarts from "echarts";
import { EChart } from "./EChart";
import { chartMotion } from "@/lib/charts/motion";

let registered = false;

export interface CountyDatum {
  name: string; // canonical county name matching GeoJSON
  value: number;
  extra?: Record<string, string | number | null>;
}

export function KenyaMap({
  data,
  height = 420,
  mobileHeight,
  label = "Learners",
  onCountyClick
}: {
  data: CountyDatum[];
  height?: number;
  mobileHeight?: number;
  label?: string;
  onCountyClick?: (county: string) => void;
}) {
  const [ready, setReady] = useState(registered);

  useEffect(() => {
    if (registered) return;
    fetch("/geo/kenya-counties.geojson")
      .then((r) => r.json())
      .then((geo) => {
        echarts.registerMap("kenya", geo);
        registered = true;
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-mute">
        Loading map…
      </div>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const option = {
    ...chartMotion,
    tooltip: {
      trigger: "item",
      formatter: (p: { name: string; value: number | undefined; data?: CountyDatum }) => {
        const lines = [`<b>${p.name}</b>`, `${label}: ${Number.isFinite(p.value) ? Number(p.value).toLocaleString() : "—"}`];
        const extra = p.data?.extra;
        if (extra) {
          for (const [k, v] of Object.entries(extra)) lines.push(`${k}: ${v ?? "—"}`);
        }
        return lines.join("<br/>");
      }
    },
    visualMap: {
      min: 0,
      max,
      left: 0,
      bottom: 0,
      orient: "horizontal",
      itemWidth: 9,
      itemHeight: 70,
      text: ["High", "Low"],
      textStyle: { color: "#6B7787", fontSize: 11 },
      inRange: { color: ["#E6F6EE", "#00A651", "#00522A"] }
    },
    series: [
      {
        type: "map",
        map: "kenya",
        // Kenya straddles the equator; the ECharts default aspectScale of 0.75
        // compresses it horizontally.
        aspectScale: 1,
        // Fill the card deliberately instead of leaving whitespace (QA 7.3.19).
        layoutCenter: ["50%", "50%"],
        layoutSize: "92%",
        roam: false,
        selectedMode: false,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 10 }, itemStyle: { areaColor: "#00341B" } },
        itemStyle: { borderColor: "#FFFFFF", borderWidth: 0.6 },
        data
      }
    ]
  };

  return (
    <EChart
      option={option}
      height={height}
      mobileHeight={mobileHeight}
      onEvents={onCountyClick ? { click: (p: { name?: string }) => p.name && onCountyClick(p.name) } : undefined}
    />
  );
}
