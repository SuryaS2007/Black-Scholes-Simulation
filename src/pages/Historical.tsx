import React, { useMemo, useState } from 'react';
import {
  ComposedChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, Cell,
} from 'recharts';
import { generateHistoricalData } from '../utils/mockData';
import { ParamsPanel } from '../components/shared/ParamsPanel';
import { useOptionsStore } from '../store/useOptionsStore';
import { TrendingUp, AlertTriangle } from 'lucide-react';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const bs = payload.find((p: any) => p.dataKey === 'bsPrice')?.value;
  const mkt = payload.find((p: any) => p.dataKey === 'marketPrice')?.value;
  const res = payload.find((p: any) => p.dataKey === 'residual')?.value;
  return (
    <div className="glass-card border border-white/[0.1] p-3 text-[11px] shadow-glass-lg">
      <div className="text-navy-400 font-mono mb-2">{label}</div>
      {bs != null && <div className="flex justify-between gap-4"><span className="text-electric">BS Model</span><span className="font-mono font-semibold text-electric">${bs?.toFixed(4)}</span></div>}
      {mkt != null && <div className="flex justify-between gap-4"><span className="text-gold">Market</span><span className="font-mono font-semibold text-gold">${mkt?.toFixed(4)}</span></div>}
      {res != null && <div className={`flex justify-between gap-4 mt-1 pt-1 border-t border-white/[0.06] ${res >= 0 ? 'text-loss' : 'text-neon'}`}><span>Residual</span><span className="font-mono font-semibold">{res >= 0 ? '+' : ''}{res?.toFixed(4)}</span></div>}
    </div>
  );
}

function ResidualTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const res = payload[0]?.value;
  return (
    <div className="glass-card border border-white/[0.1] p-2 text-[10px] shadow-glass-lg">
      <div className="text-navy-400 font-mono">{label}</div>
      <div className={`font-mono font-bold ${res >= 0 ? 'text-loss' : 'text-neon'}`}>{res >= 0 ? '+' : ''}{res?.toFixed(4)}</div>
    </div>
  );
}

export function Historical() {
  const { S, K, T, r, sigma } = useOptionsStore();
  const data = useMemo(() => generateHistoricalData(S, K, r, sigma, 90), [S, K, r, sigma]);

  const stats = useMemo(() => {
    const residuals = data.map(d => d.residual);
    const meanRes = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const mse = residuals.reduce((a, b) => a + b * b, 0) / residuals.length;
    const rmse = Math.sqrt(mse);
    const maxOver = Math.max(...residuals);
    const maxUnder = Math.min(...residuals);
    const overpriced = residuals.filter(r => r > 0.01).length;
    const underpriced = residuals.filter(r => r < -0.01).length;
    return { meanRes, rmse, maxOver, maxUnder, overpriced, underpriced, total: residuals.length };
  }, [data]);

  const xLabels = data.map((d, i) => i % 10 === 0 ? d.date : '');

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <ParamsPanel />

        {/* Stats panel */}
        <div className="glass-card p-5 space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Model Accuracy</div>
          <div className="space-y-2.5">
            {[
              { label: 'RMSE', value: stats.rmse.toFixed(4), color: '#FFB340', icon: null },
              { label: 'Mean Residual', value: `${stats.meanRes >= 0 ? '+' : ''}${stats.meanRes.toFixed(4)}`, color: stats.meanRes >= 0 ? '#FF3366' : '#00FF8A', icon: null },
              { label: 'Max Overpriced', value: `+${stats.maxOver.toFixed(4)}`, color: '#FF3366', icon: null },
              { label: 'Max Underpriced', value: stats.maxUnder.toFixed(4), color: '#00FF8A', icon: null },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[10px] text-navy-500">{label}</span>
                <span className="text-[11px] font-mono font-semibold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-white/[0.04]">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-loss/8 border border-loss/15 rounded-xl p-2 text-center">
                <div className="text-[9px] text-navy-500 mb-0.5">Over-priced</div>
                <div className="text-base font-bold text-loss">{stats.overpriced}</div>
                <div className="text-[8px] text-navy-600">{((stats.overpriced / stats.total) * 100).toFixed(0)}% days</div>
              </div>
              <div className="bg-neon/8 border border-neon/15 rounded-xl p-2 text-center">
                <div className="text-[9px] text-navy-500 mb-0.5">Under-priced</div>
                <div className="text-base font-bold text-neon">{stats.underpriced}</div>
                <div className="text-[8px] text-navy-600">{((stats.underpriced / stats.total) * 100).toFixed(0)}% days</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Charts */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Main price comparison */}
        <div className="glass-card p-5 flex-1 flex flex-col gap-3" style={{ flex: '1.5' }}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">BS Model vs Market Price (90 Days)</div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-electric rounded-full" /><span className="text-navy-400">BS Model</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-gold rounded-full" /><span className="text-navy-400">Market</span></div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 15, bottom: 5, left: 15 }}>
                <defs>
                  <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3366" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#FF3366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.4} />
                <XAxis dataKey="date" stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9 }} interval={14} />
                <YAxis stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => `$${v.toFixed(2)}`} width={60} />
                <Tooltip content={<CustomTooltip />} />
                {/* Divergence shading */}
                <Area type="monotone" dataKey="marketPrice" stroke="none" fill="url(#divGrad)" fillOpacity={1} />
                <Line type="monotone" dataKey="bsPrice" stroke="#00C8FF" strokeWidth={2} dot={false} name="BS Model" />
                <Line type="monotone" dataKey="marketPrice" stroke="#FFB340" strokeWidth={2} dot={false} strokeDasharray="5 2" name="Market" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Residual chart */}
        <div className="glass-card p-5" style={{ flex: '0.7' }}>
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400 mb-3">
            Residual (Market − BS Model)
          </div>
          <div style={{ height: 'calc(100% - 32px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="date" stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9 }} interval={14} />
                <YAxis stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={v => v.toFixed(2)} width={50} />
                <Tooltip content={<ResidualTooltip />} />
                <ReferenceLine y={0} stroke="#4D6B9A" strokeWidth={1} />
                <Bar dataKey="residual" radius={[1, 1, 0, 0]}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.residual >= 0 ? '#FF3366' : '#00FF8A'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
