"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type EChartProps = {
  option: Record<string, unknown>;
  height?: number;
  /** Optional shorter height below the sm breakpoint; defaults to `height`. */
  mobileHeight?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvents?: Record<string, (params: any) => void>;
};

export function EChart({ option, height = 320, mobileHeight, onEvents }: EChartProps) {
  // Drive height from a responsive wrapper so the chart can be shorter on
  // mobile without breaking row alignment (the grid is single-column there).
  // echarts-for-react forces an inline height:300 default, so we let the chart
  // fill the wrapper (height:100%) and put the real height on the wrapper.
  const style = {
    "--ch-m": `${mobileHeight ?? height}px`,
    "--ch-d": `${height}px`
  } as unknown as CSSProperties;
  return (
    <div className="h-[var(--ch-m)] w-full sm:h-[var(--ch-d)]" style={style}>
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        onEvents={onEvents}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
