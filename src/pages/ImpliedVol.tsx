import React, { useMemo, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ScatterChart, Scatter,
} from 'recharts';
import { impliedVolatility, bsPrice } from '../utils/blackScholes';
import { ParamsPanel } from '../components/shared/ParamsPanel';
import { useOptionsStore } from '../store/useOptionsStore';
import { Zap, TrendingDown, AlertCircle } from 'lucide-react';

export function ImpliedVol() {
  const { S, K, T, r, sigma, optionType } = useOptionsStore();
  const bsResult = useMemo(() => bsPrice({ S, K, T, r, sigma }), [S, K, T, r, sigma]);
  const bsPriceVal = optionType === 'call' ? bsResult.call : bsResult.put;

  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [hasRun, setHasRun] = useState(false);

  // Auto-set market price to BS price when params change
  const effectiveMarketPrice = hasRun ? marketPrice : bsPriceVal;

  const ivResult = useMemo(() => {
    const mp = hasRun ? marketPrice : bsPriceVal;
    if (mp <= 0 || T <= 0) return null;
    return impliedVolatility(mp, { S, K, T, r }, optionType);
  }, [marketPrice, bsPriceVal, hasRun, S, K, T, r, optionType]);

  const convergenceData = useMemo(() => {
    if (!ivResult) return [];
    return ivResult.iterations.map((iter, i) => ({
      step: i + 1,
      sigma: iter.sigma,
      price: iter.price,
      error: Math.abs(iter.error),
    }));
  }, [ivResult]);

  const handleCalculate = useCallback(() => {
    setHasRun(true);
  }, []);

  const iv = ivResult?.iv ?? sigma;
  const ivDiff = iv - sigma;
  const ivPct = iv * 100;
  const inputSigmaPct = sigma * 100;

  // Build IV smile: IV vs strike
  const ivSmile = useMemo(() => {
    const strikes = Array.from({ length: 30 }, (_, i) => K * 0.6 + (K * 0.8 * i) / 29);
    return strikes.map(k => {
      const p = optionType === 'call' ? bsPrice({ S, K: k, T, r, sigma }).call : bsPrice({ S, K: k, T, r, sigma }).put;
      const ivRes = impliedVolatility(p * (1 + 0.02 * (Math.abs(k - K) / K) * Math.sign(k - K)), { S, K: k, T, r }, optionType);
      return { k, iv: ivRes.iv * 100 };
    });
  }, [S, K, T, r, sigma, optionType]);

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <ParamsPanel />

        {/* IV Input */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-electric" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Market Price Input</span>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-navy-500">
              BS Reference: <span className="font-mono text-electric">${bsPriceVal.toFixed(4)}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={hasRun ? marketPrice.toFixed(4) : bsPriceVal.toFixed(4)}
                step={0.01}
                min={0.001}
                onChange={e => { setMarketPrice(parseFloat(e.target.value) || 0); setHasRun(true); }}
                className="num-input flex-1 w-full text-center text-base py-2"
                placeholder="Market price"
              />
            </div>
            <button
              onClick={handleCalculate}
              className="w-full py-2 rounded-xl bg-electric/15 border border-electric/25 text-electric text-xs font-semibold hover:bg-electric/25 transition-colors duration-150"
            >
              Solve IV
            </button>
            <button
              onClick={() => { setHasRun(false); setMarketPrice(bsPriceVal); }}
              className="w-full py-1.5 rounded-xl border border-white/[0.06] text-navy-400 text-[10px] hover:text-navy-200 transition-colors duration-150"
            >
              Reset to BS Price
            </button>
          </div>

          {/* IV Result */}
          {ivResult && (
            <div className={`rounded-xl p-3 space-y-2 ${ivResult.converged ? 'bg-neon/8 border border-neon/15' : 'bg-gold/8 border border-gold/15'}`}>
              <div className="flex items-center gap-1.5">
                {ivResult.converged
                  ? <div className="w-1.5 h-1.5 rounded-full bg-neon" />
                  : <AlertCircle size={10} className="text-gold" />
                }
                <span className="text-[9px] uppercase tracking-widest text-navy-400 font-semibold">
                  {ivResult.converged ? 'Converged' : 'Did Not Converge'}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-neon">{ivPct.toFixed(2)}%</div>
              <div className="text-[10px] font-mono text-navy-400">
                {ivResult.iterations.length} iterations
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-navy-500">vs Input σ</span>
                <span className={`font-mono font-semibold ${ivDiff > 0 ? 'text-loss' : 'text-neon'}`}>
                  {ivDiff >= 0 ? '+' : ''}{(ivDiff * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Top row: Convergence + comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Convergence chart */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">
              Newton-Raphson Convergence
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={convergenceData} margin={{ top: 5, right: 10, bottom: 15, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.4} />
                  <XAxis dataKey="step" stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9 }} label={{ value: 'Iteration', position: 'insideBottom', offset: -8, fill: '#4D6B9A', fontSize: 9 }} />
                  <YAxis stroke="#2D4870" tick={{ fill: '#4D6B9A', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={v => (v * 100).toFixed(1) + '%'} width={50} />
                  <Tooltip
                    contentStyle={{ background: '#0B1526', border: '1px solid #1E3352', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#7A94BC' }}
                    itemStyle={{ color: '#00C8FF', fontFamily: 'JetBrains Mono' }}
                    formatter={(v: number) => [(v * 100).toFixed(4) + '%', 'σ']}
                  />
                  <ReferenceLine y={iv} stroke="#00FF8A" strokeDasharray="4 2" strokeWidth={1} />
                  <Line type="monotone" dataKey="sigma" stroke="#00C8FF" strokeWidth={2} dot={{ fill: '#00C8FF', r: 3 }} name="σ" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {convergenceData.length > 1 && (
              <div className="text-[10px] text-navy-500 font-mono">
                Final error: {convergenceData[convergenceData.length - 1]?.error?.toExponential(3) ?? 'N/A'}
              </div>
            )}
          </div>

          {/* Sigma comparison */}
          <div className="glass-card p-5 flex flex-col gap-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Volatility Comparison</div>
            <div className="space-y-3 flex-1">
              {[
                { label: 'Input σ (Historical)', value: inputSigmaPct, color: '#00C8FF', max: 200 },
                { label: 'Implied IV', value: ivPct, color: '#00FF8A', max: 200 },
              ].map(({ label, value, color, max }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-navy-400">{label}</span>
                    <span className="font-mono font-semibold" style={{ color }}>{value.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-white/[0.04] space-y-2">
                <div className="text-[10px] text-navy-500">Discrepancy</div>
                <div className={`text-xl font-bold font-mono ${Math.abs(ivDiff) < 0.005 ? 'text-neon' : Math.abs(ivDiff) < 0.05 ? 'text-gold' : 'text-loss'}`}>
                  {ivDiff >= 0 ? '+' : ''}{(ivDiff * 100).toFixed(2)}%
                </div>
                <div className="text-[9px] text-navy-500 leading-relaxed">
                  {Math.abs(ivDiff) < 0.005 ? 'Market priced at model fair value' :
                   ivDiff > 0 ? 'Market implies higher vol than model input — option is rich' :
                   'Market implies lower vol than model input — option is cheap'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IV Smile */}
        <div className="glass-card p-5 flex-1 min-h-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Implied Volatility Smile</span>
            <div className="text-[10px] text-navy-500">(Synthetic — noise-perturbed BS prices)</div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ivSmile} margin={{ top: 10, right: 20, bottom: 20, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3352" strokeOpacity={0.4} />
                <XAxis
                  dataKey="k"
                  stroke="#2D4870"
                  tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => `$${v.toFixed(0)}`}
                  label={{ value: 'Strike Price ($)', position: 'insideBottom', offset: -12, fill: '#4D6B9A', fontSize: 10 }}
                />
                <YAxis
                  stroke="#2D4870"
                  tick={{ fill: '#4D6B9A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={v => `${v.toFixed(0)}%`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ background: '#0B1526', border: '1px solid #1E3352', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#7A94BC' }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, 'IV']}
                  labelFormatter={v => `Strike: $${Number(v).toFixed(2)}`}
                />
                <ReferenceLine x={K} stroke="#00C8FF" strokeWidth={1} strokeDasharray="4 2" label={{ value: 'ATM', position: 'insideTopLeft', fill: '#00C8FF', fontSize: 9 }} />
                <Line type="monotone" dataKey="iv" stroke="#A78BFA" strokeWidth={2.5} dot={false} name="IV %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
