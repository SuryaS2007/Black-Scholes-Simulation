import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, Cell,
} from 'recharts';
import { bsPrice } from '../utils/blackScholes';
import { ParamsPanel } from '../components/shared/ParamsPanel';
import { useOptionsStore } from '../store/useOptionsStore';
import { Play, Loader2 } from 'lucide-react';
import type { MCWorkerOutput } from '../types';

const N_OPTIONS = [100, 500, 1000, 5000, 10000];

function buildHistogram(prices: number[], bins = 40): { x: number; count: number; isProfit: boolean }[] {
  if (!prices.length) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const step = (max - min) / bins || 1;
  const hist: { x: number; count: number; isProfit: boolean }[] = Array.from({ length: bins }, (_, i) => ({
    x: min + (i + 0.5) * step,
    count: 0,
    isProfit: min + (i + 0.5) * step > 0,
  }));
  prices.forEach(p => {
    const idx = Math.min(Math.floor((p - min) / step), bins - 1);
    hist[idx].count++;
  });
  return hist;
}

export function MonteCarlo() {
  const { S, K, T, r, sigma, optionType } = useOptionsStore();
  const bsResult = useMemo(() => bsPrice({ S, K, T, r, sigma }), [S, K, T, r, sigma]);
  const bsPriceVal = optionType === 'call' ? bsResult.call : bsResult.put;

  const [numPaths, setNumPaths] = useState(1000);
  const [result, setResult] = useState<MCWorkerOutput | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const t0Ref = useRef<number>(0);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/monteCarlo.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current.onmessage = (e: MessageEvent<MCWorkerOutput>) => {
      setResult(e.data);
      setIsRunning(false);
      setElapsed(performance.now() - t0Ref.current);
    };
    return () => workerRef.current?.terminate();
  }, []);

  const runSimulation = useCallback(() => {
    if (!workerRef.current || isRunning) return;
    setIsRunning(true);
    setResult(null);
    t0Ref.current = performance.now();
    workerRef.current.postMessage({ S, K, T, r, sigma, optionType, N: numPaths, steps: 100 });
  }, [S, K, T, r, sigma, optionType, numPaths, isRunning]);

  const histogram = useMemo(
    () => result ? buildHistogram(result.terminalPrices, 50) : [],
    [result]
  );

  // Prepare path chart data — transpose display paths to time steps
  const pathChartData = useMemo(() => {
    if (!result?.displayPaths?.length) return [];
    const steps = result.displayPaths[0].length;
    return Array.from({ length: steps }, (_, step) => {
      const t = (T * step) / (steps - 1);
      const point: Record<string, number> = { t };
      result.displayPaths.slice(0, Math.min(50, result.displayPaths.length)).forEach((path, i) => {
        point[`p${i}`] = path[step];
      });
      return point;
    });
  }, [result, T]);

  const pathKeys = result ? Array.from({ length: Math.min(50, result.displayPaths.length) }, (_, i) => `p${i}`) : [];

  const priceDiff = result ? ((result.mcPrice - bsPriceVal) / bsPriceVal * 100) : 0;

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <ParamsPanel />

        {/* Simulation controls */}
        <div className="glass-card p-5 space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Simulation</div>

          <div className="space-y-2">
            <div className="text-[10px] text-navy-500 flex justify-between">
              <span>Paths (N)</span>
              <span className="font-mono text-electric">{numPaths.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={0}
              max={N_OPTIONS.length - 1}
              step={1}
              value={N_OPTIONS.indexOf(numPaths)}
              onChange={e => setNumPaths(N_OPTIONS[parseInt(e.target.value)])}
              className="range-slider"
              style={{ background: `linear-gradient(to right, #00C8FF ${(N_OPTIONS.indexOf(numPaths) / (N_OPTIONS.length - 1)) * 100}%, #1E3352 ${(N_OPTIONS.indexOf(numPaths) / (N_OPTIONS.length - 1)) * 100}%)` }}
            />
            <div className="flex justify-between text-[9px] text-navy-600 font-mono">
              {N_OPTIONS.map(n => <span key={n}>{n >= 1000 ? n / 1000 + 'k' : n}</span>)}
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 ${
              isRunning
                ? 'bg-navy-700/60 text-navy-400 cursor-not-allowed'
                : 'bg-electric/15 border border-electric/25 text-electric hover:bg-electric/25'
            }`}
          >
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isRunning ? 'Running…' : 'Run Simulation'}
          </button>

          {elapsed !== null && !isRunning && (
            <div className="text-[10px] text-navy-500 font-mono text-center">
              Completed in {elapsed.toFixed(0)}ms
            </div>
          )}
        </div>

        {/* Results summary */}
        {result && (
          <div className="glass-card p-5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Results</div>
            {[
              { label: 'MC Price', value: `$${result.mcPrice.toFixed(4)}`, color: '#00FF8A' },
              { label: 'BS Analytical', value: `$${bsPriceVal.toFixed(4)}`, color: '#00C8FF' },
              { label: '95% CI Low', value: `$${result.ciLow.toFixed(4)}`, color: '#7A94BC' },
              { label: '95% CI High', value: `$${result.ciHigh.toFixed(4)}`, color: '#7A94BC' },
              { label: 'Difference', value: `${priceDiff >= 0 ? '+' : ''}${priceDiff.toFixed(2)}%`, color: Math.abs(priceDiff) < 2 ? '#00FF8A' : '#FFB340' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between">
                <span className="text-[10px] text-navy-500">{label}</span>
                <span className="text-[11px] font-mono font-semibold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Paths chart */}
        <div className="glass-card p-5 flex-1 min-h-0 flex flex-col gap-3" style={{ minHeight: '45%' }}>
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">
            Simulated Price Paths {result && `(${Math.min(50, result.displayPaths.length)} shown)`}
          </div>
          {!result && !isRunning && (
            <div className="flex-1 flex items-center justify-center text-navy-500 text-sm">
              Click "Run Simulation" to generate paths
            </div>
          )}
          {isRunning && (
            <div className="flex-1 flex items-center justify-center gap-2 text-electric text-sm">
              <Loader2 size={16} className="animate-spin" />
              Running {numPaths.toLocaleString()} paths…
            </div>
          )}
          {result && !isRunning && (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pathChartData} margin={{ top: 5, right: 15, bottom: 20, left: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.3} />
                  <XAxis dataKey="t" stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9 }} tickFormatter={v => `${v.toFixed(2)}y`} label={{ value: 'Time (years)', position: 'insideBottom', offset: -12, fill: '#4D6B9A', fontSize: 9 }} />
                  <YAxis stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${v.toFixed(0)}`} width={55} />
                  {pathKeys.map((key, i) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={`hsl(${210 + (i / pathKeys.length) * 60}, 80%, 60%)`}
                      strokeWidth={0.8}
                      dot={false}
                      strokeOpacity={0.25}
                      legendType="none"
                    />
                  ))}
                  <ReferenceLine y={S} stroke="#00C8FF" strokeWidth={1} strokeDasharray="4 2" label={{ value: `S₀=$${S}`, position: 'insideTopRight', fill: '#00C8FF', fontSize: 9 }} />
                  <ReferenceLine y={K} stroke="#FFB340" strokeWidth={1} strokeDasharray="4 2" label={{ value: `K=$${K}`, position: 'insideTopRight', fill: '#FFB340', fontSize: 9 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Histogram */}
        <div className="glass-card p-5" style={{ height: '42%' }}>
          <div className="flex justify-between items-center mb-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Terminal Price Distribution</div>
            {result && (
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-navy-500">Paths: <span className="text-electric font-mono">{result.terminalPrices.length.toLocaleString()}</span></span>
                <span className="text-navy-500">Mean: <span className="font-mono text-gold">${(result.terminalPrices.reduce((a,b) => a+b, 0) / result.terminalPrices.length).toFixed(2)}</span></span>
              </div>
            )}
          </div>
          {result ? (
            <div style={{ height: 'calc(100% - 32px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram} margin={{ top: 5, right: 10, bottom: 20, left: 15 }} barCategoryGap={0}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="x" stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9 }} tickFormatter={v => `$${v.toFixed(0)}`} label={{ value: 'Terminal Stock Price ($)', position: 'insideBottom', offset: -12, fill: '#4D6B9A', fontSize: 9 }} />
                  <YAxis stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9 }} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#0B1526', border: '1px solid #1E3352', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#7A94BC' }}
                    formatter={(v: number) => [v, 'Count']}
                    labelFormatter={v => `$${Number(v).toFixed(2)}`}
                  />
                  <ReferenceLine x={K} stroke="#FFB340" strokeWidth={1} strokeDasharray="3 3" />
                  <Bar dataKey="count" radius={[1, 1, 0, 0]}>
                    {histogram.map((entry, i) => (
                      <Cell key={i} fill={entry.x >= K ? '#00FF8A' : '#FF3366'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-navy-500 text-xs">
              Run simulation to see distribution
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
