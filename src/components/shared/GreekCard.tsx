import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { callPrice, putPrice, calcGreeks } from '../../utils/blackScholes';
import type { OptionType } from '../../types';

interface GreekCardProps {
  name: string;
  symbol: string;
  value: number;
  description: string;
  interpretation: string;
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  optionType: OptionType;
  greekKey: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho';
  color?: string;
  unit?: string;
}

const GREEK_RANGES = {
  delta: { min: -1, max: 1 },
  gamma: { min: 0, max: 0.1 },
  theta: { min: -5, max: 0 },
  vega: { min: 0, max: 1 },
  rho: { min: -0.5, max: 0.5 },
};

export function GreekCard({
  name, symbol, value, description, interpretation,
  S, K, T, r, sigma, optionType, greekKey, color = '#00C8FF', unit = '',
}: GreekCardProps) {
  // Sparkline: greek vs stock price
  const sparkData = useMemo(() => {
    const points = 40;
    return Array.from({ length: points }, (_, i) => {
      const Sp = S * 0.6 + (S * 0.8 * i) / (points - 1);
      const g = calcGreeks({ S: Sp, K, T, r, sigma }, optionType);
      return { S: Sp, v: g[greekKey] };
    });
  }, [K, T, r, sigma, optionType, greekKey]);

  const { min: rangeMin, max: rangeMax } = GREEK_RANGES[greekKey];
  const normalized = (value - rangeMin) / (rangeMax - rangeMin);
  const clampedPct = Math.min(100, Math.max(0, normalized * 100));

  const isPositive = value >= 0;
  const absValue = Math.abs(value);

  return (
    <div className="glass-card p-4 flex flex-col gap-3 hover:border-white/[0.1] transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono" style={{ color }}>{symbol}</span>
            <span className="text-[11px] font-semibold text-navy-400 uppercase tracking-wider">{name}</span>
          </div>
          <p className="text-[10px] text-navy-500 mt-0.5 leading-tight">{description}</p>
        </div>
        {/* Radial indicator */}
        <div className="relative w-10 h-10 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#1E3352" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${clampedPct * 0.942} 94.2`}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
            />
          </svg>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold font-mono leading-none" style={{ color }}>
            {value > 0 && greekKey !== 'delta' && greekKey !== 'rho' && greekKey !== 'theta' ? '' : ''}
            {absValue < 0.0001 ? value.toExponential(2) : value.toFixed(4)}
          </div>
          <div className="text-[10px] text-navy-500 mt-1 font-mono">{unit || interpretation}</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              strokeOpacity={0.8}
            />
            <Tooltip
              contentStyle={{ display: 'none' }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[9px] text-navy-600 font-mono -mt-1">
        <span>S·0.6×</span>
        <span className="text-navy-500">vs Stock Price</span>
        <span>S·1.4×</span>
      </div>
    </div>
  );
}
