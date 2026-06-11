"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type EChartProps = {
  option: Record<string, unknown>;
  height?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvents?: Record<string, (params: any) => void>;
};

export function EChart({ option, height = 320, onEvents }: EChartProps) {
  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      onEvents={onEvents}
      style={{ height, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
