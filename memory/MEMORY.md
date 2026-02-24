# QuantEdge — Black-Scholes Options Lab

## Project Summary
Full-featured fintech-style options pricing web app built with React (Vite) + TypeScript + Tailwind CSS.

## Tech Stack
- **Framework**: React 18 + Vite 5 + TypeScript
- **Styling**: Tailwind CSS with custom dark navy theme
- **2D Charts**: Recharts
- **3D Charts**: Plotly.js (react-plotly.js) — lazy loaded
- **State**: Zustand (`src/store/useOptionsStore.ts`)
- **MC Simulation**: Web Worker (`src/workers/monteCarlo.worker.ts`)
- **Icons**: Lucide React
- **Fonts**: Inter + JetBrains Mono (Google Fonts)

## Color Palette
- Background: `#060B18` (navy-900)
- Cards: `#0B1526` (navy-800)
- Electric blue: `#00C8FF`
- Neon green: `#00FF8A`
- Loss red: `#FF3366`
- Gold: `#FFB340`

## Dev Commands
- `npm run dev` → starts on http://localhost:3000
- `npm run build` → TypeScript check + Vite build
- `node screenshot.mjs http://localhost:3000 <label> <navText>` → take screenshot

## Key Files
- `src/utils/blackScholes.ts` — all BS math (price, greeks, IV solver, surface builder)
- `src/utils/mockData.ts` — PRESETS array + historical mock data generator
- `src/store/useOptionsStore.ts` — global Zustand state (S, K, T, r, sigma, page, etc.)
- `src/workers/monteCarlo.worker.ts` — GBM simulation Web Worker
- `src/components/shared/ParamsPanel.tsx` — shared parameter sliders
- `src/components/shared/InputSlider.tsx` — custom slider with displayFormat/inputFormat props

## 8 Pages
1. **Calculator** — BS price, d1/d2, put-call parity, Greeks summary
2. **Greeks** — 5 Greek cards with sparklines + interactive curve chart
3. **VolatilitySurface** — 3D Plotly surface (call/put toggle, color scales)
4. **PayoffDiagram** — P&L diagram with green/red zones, annotations
5. **ImpliedVol** — Newton-Raphson solver, convergence chart, IV smile
6. **MonteCarlo** — GBM paths + histogram via Web Worker
7. **Historical** — Mock 90-day BS vs market price + residual chart
8. **StrategyBuilder** — Multi-leg strategy builder with preset strategies

## InputSlider API
Props: `label, value, min, max, step, onChange`
- `displayFormat`: formatted badge (e.g. `v => \`${(v*100).toFixed(1)}%\``)
- `inputFormat`: raw value for editing (e.g. `v => (v*100).toFixed(1)`)
- `parseValue`: parse back (e.g. `v => parseFloat(v) / 100`)
- `accentColor`: 'blue' | 'green' | 'red' | 'gold'

## Known Limitations
- 3D surface (Plotly/WebGL) does not render in headless Puppeteer screenshots — works fine in real browsers
