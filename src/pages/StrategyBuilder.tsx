import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { bsPrice } from '../utils/blackScholes';
import { useOptionsStore } from '../store/useOptionsStore';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import type { OptionType, StrategyLeg } from '../types';

let legIdCounter = 0;
const genId = () => `leg-${++legIdCounter}`;

interface StrategyPreset {
  name: string;
  description: string;
  build: (S: number, K: number, r: number, T: number, sigma: number) => Omit<StrategyLeg, 'id'>[];
}

const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    name: 'Long Call', description: 'Bullish, unlimited upside',
    build: (S, K, r, T, sigma) => [{ type: 'call', position: 'long', strike: K, premium: bsPrice({ S, K, T, r, sigma }).call, quantity: 1 }],
  },
  {
    name: 'Long Put', description: 'Bearish, limited downside',
    build: (S, K, r, T, sigma) => [{ type: 'put', position: 'long', strike: K, premium: bsPrice({ S, K, T, r, sigma }).put, quantity: 1 }],
  },
  {
    name: 'Straddle', description: 'Long vol — profit from big moves',
    build: (S, K, r, T, sigma) => [
      { type: 'call', position: 'long', strike: K, premium: bsPrice({ S, K, T, r, sigma }).call, quantity: 1 },
      { type: 'put', position: 'long', strike: K, premium: bsPrice({ S, K, T, r, sigma }).put, quantity: 1 },
    ],
  },
  {
    name: 'Strangle', description: 'Long vol — cheaper than straddle',
    build: (S, K, r, T, sigma) => [
      { type: 'call', position: 'long', strike: K * 1.05, premium: bsPrice({ S, K: K * 1.05, T, r, sigma }).call, quantity: 1 },
      { type: 'put', position: 'long', strike: K * 0.95, premium: bsPrice({ S, K: K * 0.95, T, r, sigma }).put, quantity: 1 },
    ],
  },
  {
    name: 'Bull Call Spread', description: 'Capped upside, lower cost',
    build: (S, K, r, T, sigma) => [
      { type: 'call', position: 'long', strike: K, premium: bsPrice({ S, K, T, r, sigma }).call, quantity: 1 },
      { type: 'call', position: 'short', strike: K * 1.1, premium: bsPrice({ S, K: K * 1.1, T, r, sigma }).call, quantity: 1 },
    ],
  },
  {
    name: 'Bear Put Spread', description: 'Capped downside, lower cost',
    build: (S, K, r, T, sigma) => [
      { type: 'put', position: 'long', strike: K, premium: bsPrice({ S, K, T, r, sigma }).put, quantity: 1 },
      { type: 'put', position: 'short', strike: K * 0.9, premium: bsPrice({ S, K: K * 0.9, T, r, sigma }).put, quantity: 1 },
    ],
  },
  {
    name: 'Iron Condor', description: 'Short vol — profit in range',
    build: (S, K, r, T, sigma) => [
      { type: 'put', position: 'short', strike: K * 0.95, premium: bsPrice({ S, K: K * 0.95, T, r, sigma }).put, quantity: 1 },
      { type: 'put', position: 'long', strike: K * 0.90, premium: bsPrice({ S, K: K * 0.90, T, r, sigma }).put, quantity: 1 },
      { type: 'call', position: 'short', strike: K * 1.05, premium: bsPrice({ S, K: K * 1.05, T, r, sigma }).call, quantity: 1 },
      { type: 'call', position: 'long', strike: K * 1.10, premium: bsPrice({ S, K: K * 1.10, T, r, sigma }).call, quantity: 1 },
    ],
  },
  {
    name: 'Butterfly', description: 'Low vol — profit near strike',
    build: (S, K, r, T, sigma) => [
      { type: 'call', position: 'long', strike: K * 0.95, premium: bsPrice({ S, K: K * 0.95, T, r, sigma }).call, quantity: 1 },
      { type: 'call', position: 'short', strike: K, premium: bsPrice({ S, K, T, r, sigma }).call, quantity: 2 },
      { type: 'call', position: 'long', strike: K * 1.05, premium: bsPrice({ S, K: K * 1.05, T, r, sigma }).call, quantity: 1 },
    ],
  },
];

function legPayoffAtExpiry(leg: StrategyLeg, ST: number): number {
  const intrinsic = leg.type === 'call' ? Math.max(ST - leg.strike, 0) : Math.max(leg.strike - ST, 0);
  const sign = leg.position === 'long' ? 1 : -1;
  return sign * (intrinsic - leg.premium) * leg.quantity;
}

function PayoffTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload[0]?.payload?.total ?? 0;
  return (
    <div className="glass-card border border-white/[0.1] p-3 text-[11px] shadow-glass-lg">
      <div className="text-navy-400 font-mono mb-1">S = ${Number(label).toFixed(2)}</div>
      <div className={`font-mono font-bold text-sm ${total >= 0 ? 'text-neon' : 'text-loss'}`}>
        P&L: {total >= 0 ? '+' : ''}{total.toFixed(4)}
      </div>
    </div>
  );
}

export function StrategyBuilder() {
  const { S, K, T, r, sigma } = useOptionsStore();
  const [legs, setLegs] = useState<StrategyLeg[]>([
    { id: genId(), type: 'call', position: 'long', strike: K, premium: bsPrice({ S, K, T, r, sigma }).call, quantity: 1 },
  ]);
  const [presetOpen, setPresetOpen] = useState(false);

  const applyPreset = (preset: StrategyPreset) => {
    const newLegs = preset.build(S, K, r, T, sigma).map(l => ({ ...l, id: genId() }));
    setLegs(newLegs);
    setPresetOpen(false);
  };

  const addLeg = () => {
    setLegs(prev => [...prev, {
      id: genId(), type: 'call', position: 'long',
      strike: K, premium: bsPrice({ S, K, T, r, sigma }).call, quantity: 1,
    }]);
  };

  const removeLeg = (id: string) => setLegs(prev => prev.filter(l => l.id !== id));

  const updateLeg = (id: string, updates: Partial<StrategyLeg>) => {
    setLegs(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, ...updates };
      // Auto-recalculate premium if strike or type changes
      if (updates.strike || updates.type) {
        const bs = bsPrice({ S, K: updated.strike, T, r, sigma });
        updated.premium = updated.type === 'call' ? bs.call : bs.put;
      }
      return updated;
    }));
  };

  const chartData = useMemo(() => {
    const sMin = Math.min(...legs.map(l => l.strike)) * 0.6;
    const sMax = Math.max(...legs.map(l => l.strike)) * 1.4;
    return Array.from({ length: 200 }, (_, i) => {
      const ST = sMin + ((sMax - sMin) * i) / 199;
      const total = legs.reduce((sum, leg) => sum + legPayoffAtExpiry(leg, ST), 0);
      return { S: ST, total, profit: Math.max(total, 0), loss: Math.min(total, 0) };
    });
  }, [legs]);

  const totalCost = legs.reduce((sum, l) => sum + (l.position === 'long' ? 1 : -1) * l.premium * l.quantity, 0);
  const maxProfit = Math.max(...chartData.map(d => d.total));
  const maxLoss = Math.min(...chartData.map(d => d.total));
  const breakevens = chartData.filter((d, i) =>
    i > 0 && Math.sign(chartData[i - 1].total) !== Math.sign(d.total)
  ).map(d => d.S);

  const aggregateGreeks = useMemo(() => {
    return legs.reduce((acc, leg) => {
      const bs = bsPrice({ S, K: leg.strike, T, r, sigma });
      const sign = leg.position === 'long' ? 1 : -1;
      const d1 = bs.d1;
      const d2 = bs.d2;
      // Simplified greeks
      const sqrtT = Math.sqrt(T);
      const phi = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
      const Nd1 = leg.type === 'call' ? 0.5 * (1 + Math.sign(d1) * (1 - Math.exp(-Math.abs(d1) * 0.7))) : 0.5 * (1 + Math.sign(d1) * (1 - Math.exp(-Math.abs(d1) * 0.7))) - 1;
      acc.delta += sign * leg.quantity * Nd1;
      acc.gamma += sign * leg.quantity * phi / (S * (sigma || 0.01) * sqrtT);
      acc.vega += sign * leg.quantity * S * phi * sqrtT / 100;
      return acc;
    }, { delta: 0, gamma: 0, vega: 0 });
  }, [legs, S, T, r, sigma]);

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left: Leg builder */}
      <div className="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto">
        {/* Strategy presets */}
        <div className="glass-card p-4 relative">
          <button
            onClick={() => setPresetOpen(v => !v)}
            className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-navy-300 hover:text-white transition-colors"
          >
            <span>Strategy Presets</span>
            <ChevronDown size={13} className={`transition-transform duration-150 ${presetOpen ? 'rotate-180' : ''}`} />
          </button>
          {presetOpen && (
            <div className="mt-3 space-y-1 animate-fade-in">
              {STRATEGY_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors duration-100 group"
                >
                  <div className="text-[12px] font-semibold text-navy-200 group-hover:text-white">{preset.name}</div>
                  <div className="text-[9px] text-navy-500 mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Legs */}
        <div className="space-y-3">
          {legs.map((leg, idx) => (
            <div key={leg.id} className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-navy-500">Leg {idx + 1}</span>
                <button
                  onClick={() => removeLeg(leg.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-navy-500 hover:text-loss hover:bg-loss/10 transition-all duration-150"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Type */}
                <div>
                  <div className="text-[9px] text-navy-500 mb-1">Type</div>
                  <div className="flex gap-1">
                    {(['call', 'put'] as OptionType[]).map(t => (
                      <button key={t} onClick={() => updateLeg(leg.id, { type: t })}
                        className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all duration-100 ${leg.type === t ? (t === 'call' ? 'bg-neon/15 text-neon' : 'bg-loss/15 text-loss') : 'text-navy-500 hover:text-navy-300 bg-navy-800/40'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Position */}
                <div>
                  <div className="text-[9px] text-navy-500 mb-1">Position</div>
                  <div className="flex gap-1">
                    {(['long', 'short'] as const).map(p => (
                      <button key={p} onClick={() => updateLeg(leg.id, { position: p })}
                        className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all duration-100 ${leg.position === p ? 'bg-electric/15 text-electric' : 'text-navy-500 hover:text-navy-300 bg-navy-800/40'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strike */}
              <div>
                <div className="text-[9px] text-navy-500 mb-1">Strike</div>
                <input type="number" value={leg.strike} step={1} min={1}
                  onChange={e => updateLeg(leg.id, { strike: parseFloat(e.target.value) || K })}
                  className="num-input w-full text-left" />
              </div>

              {/* Premium */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[9px] text-navy-500 mb-0.5">Premium</div>
                  <input type="number" value={leg.premium.toFixed(4)} step={0.01} min={0}
                    onChange={e => updateLeg(leg.id, { premium: parseFloat(e.target.value) || 0 })}
                    className="num-input w-24 text-left" />
                </div>
                <div>
                  <div className="text-[9px] text-navy-500 mb-0.5">Qty</div>
                  <input type="number" value={leg.quantity} step={1} min={1}
                    onChange={e => updateLeg(leg.id, { quantity: parseInt(e.target.value) || 1 })}
                    className="num-input w-16 text-left" />
                </div>
              </div>

              <div className={`text-[10px] font-mono font-semibold ${leg.position === 'long' ? 'text-loss' : 'text-neon'}`}>
                {leg.position === 'long' ? 'Cost: ' : 'Credit: '}
                ${(leg.premium * leg.quantity).toFixed(4)}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addLeg}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/[0.1] text-navy-400 hover:text-electric hover:border-electric/30 transition-all duration-150 text-[12px] font-medium"
        >
          <Plus size={13} />
          Add Leg
        </button>
      </div>

      {/* Right: Chart + summary */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Summary row */}
        <div className="glass-card p-4">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Net Cost', value: `${totalCost >= 0 ? '-' : '+'}$${Math.abs(totalCost).toFixed(4)}`, color: totalCost >= 0 ? '#FF3366' : '#00FF8A' },
              { label: 'Max Profit', value: maxProfit === Infinity ? '∞' : `$${maxProfit.toFixed(4)}`, color: '#00FF8A' },
              { label: 'Max Loss', value: maxLoss === -Infinity ? '∞' : `$${maxLoss.toFixed(4)}`, color: '#FF3366' },
              { label: 'Breakeven(s)', value: breakevens.length ? breakevens.map(b => `$${b.toFixed(1)}`).join(', ') : 'None', color: '#FFB340' },
              { label: 'Net Δ', value: aggregateGreeks.delta.toFixed(3), color: '#00C8FF' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-navy-800/40 rounded-xl p-3 text-center">
                <div className="text-[9px] text-navy-500 mb-1">{label}</div>
                <div className="text-[12px] font-bold font-mono" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* P/L chart */}
        <div className="glass-card p-5 flex-1 flex flex-col gap-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">
            Combined Strategy P&L at Expiration ({legs.length} leg{legs.length !== 1 ? 's' : ''})
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 15 }}>
                <defs>
                  <linearGradient id="stratProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF8A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00FF8A" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="stratLossGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="5%" stopColor="#FF3366" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF3366" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.4} />
                <XAxis dataKey="S" stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => `$${v.toFixed(0)}`} type="number" domain={['dataMin', 'dataMax']}
                  label={{ value: 'Stock Price at Expiry', position: 'insideBottom', offset: -12, fill: '#4D6B9A', fontSize: 10 }} />
                <YAxis stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => v.toFixed(2)} width={65} />
                <Tooltip content={<PayoffTooltip />} />
                <Area type="monotone" dataKey="profit" fill="url(#stratProfitGrad)" stroke="none" />
                <Area type="monotone" dataKey="loss" fill="url(#stratLossGrad)" stroke="none" />
                <Line type="monotone" dataKey="total" stroke="#00C8FF" strokeWidth={2.5} dot={false} name="P&L" />
                <ReferenceLine y={0} stroke="#4D6B9A" strokeWidth={1} strokeDasharray="4 2" />
                {breakevens.map((be, i) => (
                  <ReferenceLine key={i} x={be} stroke="#FFB340" strokeWidth={1} strokeDasharray="3 3"
                    label={{ value: `BE$${be.toFixed(0)}`, position: 'insideTopRight', fill: '#FFB340', fontSize: 8 }} />
                ))}
                <ReferenceLine x={S} stroke="#ffffff30" strokeWidth={1}
                  label={{ value: `S=${S}`, position: 'insideTopRight', fill: '#ffffff60', fontSize: 9 }} />
                {legs.map((leg, i) => (
                  <ReferenceLine key={leg.id} x={leg.strike}
                    stroke={leg.type === 'call' ? '#00FF8A40' : '#FF336640'}
                    strokeWidth={1} strokeDasharray="2 4" />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
