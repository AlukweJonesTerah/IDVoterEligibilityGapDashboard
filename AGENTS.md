# Agent Instructions

## Project Shape

- This is the ICTA Dashboard: a Next.js app with API routes and a PostgreSQL reporting database.
- Keep the application deployable with Docker Compose and Caddy on the shared `caddy_net` network.
- Follow the existing restrained dashboard design language: light paper background, compact sections, small-radius cards, tabular numerals, and ICTA-accented colors.
- Use eCharts for charting surfaces unless a user explicitly asks for another charting library.

## eCharts Animation Standard

Use animation intentionally in every new or changed eCharts chart. The default should be a calm operational-dashboard motion style, not decorative motion.

- Preserve stable `name` fields on data items so ECharts can diff add, update, and remove states correctly across `setOption` calls.
- Configure enter and update motion separately:
  - `animationDuration`
  - `animationEasing`
  - `animationDelay`
  - `animationDurationUpdate`
  - `animationEasingUpdate`
  - `animationDelayUpdate`
- Prefer short update transitions for live/dashboard data so changes are visible without slowing review.
- Use staggered `animationDelay` or `animationDelayUpdate` for ranked bars, grouped bars, and repeated marks when it improves scanability.
- Use smooth data transitions through `setOption`; avoid remounting chart components just to refresh data.
- Set `animationThreshold` on charts that may grow large, and disable animation with `animation: false` only when performance, accessibility, or export correctness requires it.
- When taking chart snapshots or exporting chart images, wait for ECharts rendering to finish. Prefer the `rendered` event when practical.

Reference: Apache ECharts Data Transition guide:
https://echarts.apache.org/handbook/en/how-to/animation/transition/

## Suggested Defaults

Use these as a starting point and tune per chart:

```ts
const chartMotion = {
  animation: true,
  animationDuration: 700,
  animationEasing: "cubicOut",
  animationDurationUpdate: 450,
  animationEasingUpdate: "cubicInOut",
  animationThreshold: 2000
};
```

For ranked bar charts:

```ts
animationDelay: (idx: number) => idx * 18,
animationDelayUpdate: (idx: number) => idx * 8
```

## Verification

- Run `npm run build` after chart or TypeScript changes.
- For visual changes, run the app and inspect the page in a browser-sized viewport before handing off.
