import React, { useMemo, useState, lazy, Suspense } from 'react';
import { RotateCcw, Download } from 'lucide-react';
import { buildVolSurface } from '../utils/blackScholes';
import { useOptionsStore } from '../store/useOptionsStore';
import type { OptionType } from '../types';

// Lazy-load Plotly to avoid blocking initial render
const Plot = lazy(() => import('react-plotly.js'));

const COLOR_SCALES: Record<string, string> = {
  'RdBu_r': 'Hot→Cool',
  'Viridis': 'Viridis',
  'Plasma': 'Plasma',
  'RdYlGn': 'Risk',
};

export function VolatilitySurface() {
  const { K, r, sigma } = useOptionsStore();
  const [surfaceType, setSurfaceType] = useState<OptionType>('call');
  const [colorscale, setColorscale] = useState('RdBu_r');
  const [revision, setRevision] = useState(0);

  const { sAxis, tAxis, z } = useMemo(
    () => buildVolSurface(K, r, sigma, surfaceType, 30, 30),
    [K, r, sigma, surfaceType]
  );

  const plotData: Plotly.Data[] = [
    {
      type: 'surface',
      x: tAxis,
      y: sAxis,
      z: z,
      colorscale: colorscale,
      colorbar: {
        title: { text: 'Price ($)', font: { color: '#7A94BC', size: 11 } },
        tickfont: { color: '#7A94BC', size: 9, family: 'JetBrains Mono' },
        thickness: 12,
        len: 0.7,
        bgcolor: 'rgba(11,21,38,0.8)',
        bordercolor: 'rgba(255,255,255,0.08)',
        x: 0.98,
      },
      lighting: {
        ambient: 0.8,
        diffuse: 0.9,
        specular: 0.3,
        roughness: 0.6,
        fresnel: 0.4,
      },
      opacity: 0.95,
      hovertemplate:
        '<b>T:</b> %{x:.2f}y<br><b>S:</b> $%{y:.2f}<br><b>Price:</b> $%{z:.4f}<extra></extra>',
    } as Plotly.Data,
  ];

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#7A94BC', family: 'Inter, sans-serif', size: 11 },
    margin: { l: 0, r: 0, t: 10, b: 0 },
    scene: {
      xaxis: {
        title: { text: 'Time to Expiry (years)', font: { color: '#4D6B9A', size: 10 } },
        gridcolor: '#1E3352',
        zerolinecolor: '#1E3352',
        color: '#4D6B9A',
        tickfont: { size: 9, family: 'JetBrains Mono', color: '#4D6B9A' },
      },
      yaxis: {
        title: { text: 'Stock Price ($)', font: { color: '#4D6B9A', size: 10 } },
        gridcolor: '#1E3352',
        zerolinecolor: '#1E3352',
        color: '#4D6B9A',
        tickfont: { size: 9, family: 'JetBrains Mono', color: '#4D6B9A' },
      },
      zaxis: {
        title: { text: `${surfaceType === 'call' ? 'Call' : 'Put'} Price ($)`, font: { color: '#4D6B9A', size: 10 } },
        gridcolor: '#1E3352',
        zerolinecolor: '#1E3352',
        color: '#4D6B9A',
        tickfont: { size: 9, family: 'JetBrains Mono', color: '#4D6B9A' },
      },
      bgcolor: 'rgba(6,11,24,0)',
      aspectmode: 'manual',
      aspectratio: { x: 1.4, y: 1.4, z: 0.8 },
      camera: {
        eye: { x: 1.6, y: -1.8, z: 1.0 },
      },
    },
    hoverlabel: {
      bgcolor: '#0B1526',
      bordercolor: '#1E3352',
      font: { color: '#E2EEFF', size: 11, family: 'JetBrains Mono' },
    },
    uirevision: revision,
  } as unknown as Partial<Plotly.Layout>;

  const config: Partial<Plotly.Config> = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
    displaylogo: false,
    modeBarButtonsToAdd: [],
    responsive: true,
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        {/* Surface type toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-navy-400 font-medium">Surface:</span>
          <div className="flex items-center bg-navy-800/60 border border-white/[0.06] rounded-lg p-0.5 gap-0.5">
            {(['call', 'put'] as OptionType[]).map(t => (
              <button
                key={t}
                onClick={() => setSurfaceType(t)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide transition-all duration-150 ${
                  surfaceType === t
                    ? t === 'call'
                      ? 'bg-neon/15 text-neon border border-neon/25'
                      : 'bg-loss/15 text-loss border border-loss/25'
                    : 'text-navy-400 hover:text-navy-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Color scale */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-navy-400 font-medium">Colors:</span>
          <div className="flex items-center gap-1">
            {Object.entries(COLOR_SCALES).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setColorscale(id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                  colorscale === id
                    ? 'border-electric/30 bg-electric/10 text-electric'
                    : 'border-transparent text-navy-400 hover:text-navy-200 hover:bg-white/[0.03]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-navy-500">
          <span className="font-mono">K = {K.toFixed(2)}</span>
          <span className="font-mono">σ = {(sigma * 100).toFixed(1)}%</span>
          <span className="font-mono">r = {(r * 100).toFixed(2)}%</span>
        </div>

        {/* Reset camera */}
        <button
          onClick={() => setRevision(r => r + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-navy-800/40 text-navy-300 hover:text-white hover:bg-navy-700/40 text-[11px] transition-colors duration-150"
        >
          <RotateCcw size={12} />
          <span>Reset View</span>
        </button>
      </div>

      {/* Surface plot */}
      <div className="glass-card flex-1 min-h-0 overflow-hidden relative">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-navy-400 text-sm animate-pulse">Loading 3D surface…</div>
          </div>
        }>
          <Plot
            data={plotData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        </Suspense>

        {/* Corner label */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <div className={`badge text-[10px] font-bold ${surfaceType === 'call' ? 'bg-neon/10 text-neon border border-neon/20' : 'bg-loss/10 text-loss border border-loss/20'}`}>
            {surfaceType.toUpperCase()} SURFACE
          </div>
        </div>
      </div>

      {/* Axis legend */}
      <div className="glass-card p-3 flex items-center justify-center gap-8 text-[10px] text-navy-500">
        <span><span className="text-electric font-mono font-semibold">X-axis</span> — Time to Expiry (0.02y → 3y)</span>
        <span><span className="text-neon font-mono font-semibold">Y-axis</span> — Stock Price (0.5K → 1.5K)</span>
        <span><span className="text-gold font-mono font-semibold">Z-axis</span> — {surfaceType === 'call' ? 'Call' : 'Put'} Option Price ($)</span>
        <span className="text-navy-600">Drag to rotate · Scroll to zoom · Double-click to reset</span>
      </div>
    </div>
  );
}
