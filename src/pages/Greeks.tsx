import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { GreekCard } from '../components/shared/GreekCard';
import { ParamsPanel } from '../components/shared/ParamsPanel';
import { calcGreeks, bsPrice } from '../utils/blackScholes';
import { useOptionsStore } from '../store/useOptionsStore';

type XAxisVar = 'S' | 'T' | 'sigma';
type GreekKey = 'delta' | 'gamma' | 'theta' | 'vega' | 'rho';

const GREEK_CONFIG = [
  { key: 'delta' as GreekKey, name: 'Delta', symbol: 'Δ', color: '#00C8FF', description: 'Rate of change of option price vs. stock price', interpretation: '≈ probability ITM' },
  { key: 'gamma' as GreekKey, name: 'Gamma', symbol: 'Γ', color: '#A78BFA', description: 'Rate of change of Delta vs. stock price', interpretation: 'convexity measure' },
  { key: 'theta' as GreekKey, name: 'Theta', symbol: 'Θ', color: '#FF3366', description: 'Time decay — value lost per calendar day', interpretation: 'per day P&L' },
  { key: 'vega' as GreekKey, name: 'Vega', symbol: 'V', color: '#00FF8A', description: 'Sensitivity to 1% change in implied volatility', interpretation: 'per 1% vol move' },
  { key: 'rho' as GreekKey, name: 'Rho', symbol: 'ρ', color: '#FFB340', description: 'Sensitivity to 1% change in risk-free rate', interpretation: 'per 1% rate move' },
];

const XAXIS_OPTIONS: { id: XAxisVar; label: string; suffix: string }[] = [
  { id: 'S', label: 'Stock Price', suffix: '' },
  { id: 'T', label: 'Time to Expiry', suffix: 'y' },
  { id: 'sigma', label: 'Volatility σ', suffix: '%' },
];

function CustomTooltip({ active, payload, label, xSuffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card border border-white/[0.1] p-3 text-[11px] shadow-glass-lg min-w-[140px]">
      <div className="text-navy-400 mb-2 font-mono">{xSuffix === '%' ? `σ = ${(label * 100).toFixed(1)}%` : `${label?.toFixed ? label.toFixed(2) : label}${xSuffix}`}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>{entry.value?.toFixed(5)}</span>
        </div>
      ))}
    </div>
  );
}

export function Greeks() {
  const { S, K, T, r, sigma, optionType } = useOptionsStore();
  const greeks = useMemo(() => calcGreeks({ S, K, T, r, sigma }, optionType), [S, K, T, r, sigma, optionType]);

  const [selectedGreeks, setSelectedGreeks] = useState<Set<GreekKey>>(new Set(['delta', 'gamma']));
  const [xVar, setXVar] = useState<XAxisVar>('S');

  const chartData = useMemo(() => {
    const pts = 60;
    return Array.from({ length: pts }, (_, i) => {
      let xVal: number;
      let params = { S, K, T, r, sigma };

      if (xVar === 'S') {
        xVal = S * 0.4 + (S * 1.2 * i) / (pts - 1);
        params = { ...params, S: xVal };
      } else if (xVar === 'T') {
        xVal = 0.01 + (2.99 * i) / (pts - 1);
        params = { ...params, T: xVal };
      } else {
        xVal = 0.01 + (1.99 * i) / (pts - 1);
        params = { ...params, sigma: xVal };
      }

      const g = calcGreeks(params, optionType);
      const point: Record<string, number> = { x: xVal };
      GREEK_CONFIG.forEach(({ key }) => { point[key] = g[key]; });
      return point;
    });
  }, [S, K, T, r, sigma, optionType, xVar]);

  const toggleGreek = (key: GreekKey) => {
    setSelectedGreeks(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  };

  const xAxisLabel = XAXIS_OPTIONS.find(x => x.id === xVar)!;

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left: Params */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <ParamsPanel />
      </div>

      {/* Right */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Greek cards */}
        <div className="grid grid-cols-5 gap-3">
          {GREEK_CONFIG.map(cfg => (
            <GreekCard
              key={cfg.key}
              name={cfg.name}
              symbol={cfg.symbol}
              value={greeks[cfg.key]}
              description={cfg.description}
              interpretation={cfg.interpretation}
              S={S} K={K} T={T} r={r} sigma={sigma}
              optionType={optionType}
              greekKey={cfg.key}
              color={cfg.color}
            />
          ))}
        </div>

        {/* Interactive chart */}
        <div className="glass-card p-5 flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Greek Curves</span>

            {/* Greek toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {GREEK_CONFIG.map(cfg => (
                <button
                  key={cfg.key}
                  onClick={() => toggleGreek(cfg.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                    selectedGreeks.has(cfg.key)
                      ? 'border-current bg-current/10'
                      : 'border-transparent bg-navy-800/40 text-navy-500 hover:text-navy-300'
                  }`}
                  style={{ color: selectedGreeks.has(cfg.key) ? cfg.color : undefined }}
                >
                  <span className="font-bold">{cfg.symbol}</span>
                  <span>{cfg.name}</span>
                </button>
              ))}
            </div>

            {/* X-axis selector */}
            <div className="flex items-center gap-1 bg-navy-800/60 border border-white/[0.06] rounded-lg p-0.5">
              {XAXIS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setXVar(opt.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                    xVar === opt.id ? 'bg-electric/15 text-electric' : 'text-navy-400 hover:text-navy-200'
                  }`}
                >
                  {opt.id === 'sigma' ? 'σ' : opt.id} Axis
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.5} />
                <XAxis
                  dataKey="x"
                  stroke="#2D4870"
                  tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => xVar === 'sigma' ? `${(v * 100).toFixed(0)}%` : v.toFixed(xVar === 'T' ? 2 : 0)}
                  label={{ value: xAxisLabel.label, position: 'insideBottom', offset: -12, fill: '#4D6B9A', fontSize: 10 }}
                />
                <YAxis
                  stroke="#2D4870"
                  tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => v.toFixed(3)}
                  width={60}
                />
                <Tooltip content={<CustomTooltip xSuffix={xAxisLabel.suffix} />} />
                <ReferenceLine x={xVar === 'S' ? S : xVar === 'T' ? T : sigma} stroke="#ffffff20" strokeDasharray="4 4" />
                {GREEK_CONFIG.filter(cfg => selectedGreeks.has(cfg.key)).map(cfg => (
                  <Line
                    key={cfg.key}
                    type="monotone"
                    dataKey={cfg.key}
                    stroke={cfg.color}
                    strokeWidth={2}
                    dot={false}
                    name={cfg.symbol + ' ' + cfg.name}
                    strokeOpacity={0.9}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
