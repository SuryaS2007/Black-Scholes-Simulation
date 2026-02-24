import React, { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend,
} from 'recharts';
import { payoffAtExpiry, bsPrice } from '../utils/blackScholes';
import { ParamsPanel } from '../components/shared/ParamsPanel';
import { useOptionsStore } from '../store/useOptionsStore';

function PayoffTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const pl = payload[0]?.payload?.pl ?? 0;
  return (
    <div className="glass-card border border-white/[0.1] p-3 text-[11px] shadow-glass-lg">
      <div className="text-navy-400 font-mono mb-1.5">S = ${Number(label).toFixed(2)}</div>
      <div className={`font-mono font-bold text-sm ${pl >= 0 ? 'text-neon' : 'text-loss'}`}>
        P&L: {pl >= 0 ? '+' : ''}{pl.toFixed(4)}
      </div>
    </div>
  );
}

export function PayoffDiagram() {
  const { S, K, T, r, sigma, optionType } = useOptionsStore();
  const result = useMemo(() => bsPrice({ S, K, T, r, sigma }), [S, K, T, r, sigma]);
  const premium = optionType === 'call' ? result.call : result.put;

  const [customPremium, setCustomPremium] = useState<number | null>(null);
  const activePremium = customPremium ?? premium;

  // Reset custom premium when BS premium changes significantly
  const data = useMemo(
    () => payoffAtExpiry(K, activePremium, optionType, K * 0.4, K * 1.6, 200),
    [K, activePremium, optionType]
  );

  const breakeven = optionType === 'call' ? K + activePremium : K - activePremium;
  const maxLoss = -activePremium;
  const maxProfit = optionType === 'call' ? '∞' : (K - activePremium).toFixed(4);

  const xMin = K * 0.4;
  const xMax = K * 1.6;

  // Split data into profit/loss for separate fills
  const profitData = data.map(d => ({ ...d, profitArea: d.pl >= 0 ? d.pl : 0 }));
  const lossData = data.map(d => ({ ...d, lossArea: d.pl < 0 ? d.pl : 0 }));

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left: Params */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <ParamsPanel />

        {/* Premium override */}
        <div className="glass-card p-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Premium Paid</div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={activePremium.toFixed(4)}
                step={0.01}
                min={0}
                onChange={e => setCustomPremium(parseFloat(e.target.value) || 0)}
                className="num-input w-full text-center"
              />
            </div>
            <button
              onClick={() => setCustomPremium(null)}
              className="text-[10px] text-navy-400 hover:text-electric transition-colors px-2 py-1 rounded-lg border border-white/[0.06] hover:border-electric/30"
            >
              Reset
            </button>
          </div>
          <div className="text-[10px] text-navy-500">
            BS Price: <span className="text-electric font-mono">${premium.toFixed(4)}</span>
          </div>
        </div>

        {/* Key levels */}
        <div className="glass-card p-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Key Levels</div>
          <div className="space-y-2">
            {[
              { label: 'Breakeven', value: `$${breakeven.toFixed(4)}`, color: '#FFB340' },
              { label: 'Max Loss', value: `$${maxLoss.toFixed(4)}`, color: '#FF3366' },
              { label: 'Max Profit', value: typeof maxProfit === 'string' ? maxProfit : `$${maxProfit}`, color: '#00FF8A' },
              { label: 'Strike (K)', value: `$${K.toFixed(2)}`, color: '#00C8FF' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[10px] text-navy-500">{label}</span>
                <span className="text-[11px] font-mono font-semibold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Chart */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="glass-card p-5 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-navy-400">
                P&L at Expiration — {optionType === 'call' ? 'Long Call' : 'Long Put'}
              </span>
              <div className="text-[10px] text-navy-500 mt-0.5">
                Profit/loss per contract at various stock prices at expiry
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-neon rounded-full" />
                <span className="text-navy-400">Profit Zone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-loss rounded-full" />
                <span className="text-navy-400">Loss Zone</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 15 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF8A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00FF8A" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="5%" stopColor="#FF3366" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF3366" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.4} />
                <XAxis
                  dataKey="S"
                  stroke="#2D4870"
                  tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => `$${v.toFixed(0)}`}
                  label={{ value: 'Stock Price at Expiry ($)', position: 'insideBottom', offset: -12, fill: '#4D6B9A', fontSize: 10 }}
                  domain={[xMin, xMax]}
                  type="number"
                />
                <YAxis
                  stroke="#2D4870"
                  tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => v.toFixed(2)}
                  width={65}
                  label={{ value: 'Profit / Loss ($)', angle: -90, position: 'insideLeft', offset: 0, fill: '#4D6B9A', fontSize: 10 }}
                />
                <Tooltip content={<PayoffTooltip />} />

                {/* Profit region fill */}
                <Area type="monotone" dataKey="profit" fill="url(#profitGrad)" stroke="none" />
                {/* Loss region fill */}
                <Area type="monotone" dataKey="loss" fill="url(#lossGrad)" stroke="none" />
                {/* Main P/L line */}
                <Line
                  type="monotone"
                  dataKey="pl"
                  stroke={optionType === 'call' ? '#00FF8A' : '#FF3366'}
                  strokeWidth={2.5}
                  dot={false}
                  name="P&L"
                />

                {/* Reference lines */}
                <ReferenceLine y={0} stroke="#4D6B9A" strokeWidth={1} strokeDasharray="4 2" />
                <ReferenceLine
                  y={maxLoss}
                  stroke="#FF3366"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{ value: `Max Loss: $${maxLoss.toFixed(2)}`, position: 'insideTopRight', fill: '#FF3366', fontSize: 9 }}
                />
                <ReferenceLine
                  x={breakeven}
                  stroke="#FFB340"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  label={{ value: `BE: $${breakeven.toFixed(2)}`, position: 'insideTopRight', fill: '#FFB340', fontSize: 9 }}
                />
                <ReferenceLine
                  x={K}
                  stroke="#00C8FF"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  label={{ value: `K=$${K.toFixed(0)}`, position: 'insideTopLeft', fill: '#00C8FF', fontSize: 9 }}
                />
                <ReferenceLine
                  x={S}
                  stroke="#ffffff"
                  strokeWidth={1}
                  strokeOpacity={0.25}
                  strokeDasharray="3 3"
                  label={{ value: `S=$${S.toFixed(0)}`, position: 'insideTopRight', fill: '#ffffff80', fontSize: 9 }}
                />
                {/* Premium line */}
                <ReferenceLine
                  y={-activePremium}
                  stroke="#A78BFA"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{ value: `Premium paid: $${activePremium.toFixed(2)}`, position: 'insideBottomRight', fill: '#A78BFA', fontSize: 9 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
