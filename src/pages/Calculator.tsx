import React, { useRef, useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Info, Download } from 'lucide-react';
import { ParamsPanel } from '../components/shared/ParamsPanel';
import { bsPrice, calcGreeks } from '../utils/blackScholes';
import { useOptionsStore } from '../store/useOptionsStore';

function useAnimatedValue(value: number) {
  const prev = useRef(value);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value !== prev.current) {
      setDir(value > prev.current ? 'up' : 'down');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDir(null), 700);
      prev.current = value;
    }
  }, [value]);

  return dir;
}

function PriceCard({
  label, price, type, S, K,
}: {
  label: string; price: number; type: 'call' | 'put'; S: number; K: number;
}) {
  const dir = useAnimatedValue(price);
  const isCall = type === 'call';
  const color = isCall ? '#00FF8A' : '#FF3366';
  const glowClass = isCall ? 'shadow-glow-green' : 'shadow-glow-red';
  const borderClass = isCall ? 'border-neon/20' : 'border-loss/20';
  const bgClass = isCall ? 'bg-neon/5' : 'bg-loss/5';
  const animClass = dir === 'up' ? 'animate-number-up' : dir === 'down' ? 'animate-number-down' : '';

  const intrinsic = isCall ? Math.max(0, S - K) : Math.max(0, K - S);
  const timeValue = Math.max(0, price - intrinsic);

  return (
    <div className={`glass-card p-6 flex flex-col gap-4 ${bgClass} border ${borderClass} ${glowClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCall ? <TrendingUp size={16} style={{ color }} /> : <TrendingDown size={16} style={{ color }} />}
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
        </div>
        <div className={`badge text-[10px] ${isCall ? 'bg-neon/10 text-neon' : 'bg-loss/10 text-loss'}`}>
          {isCall ? 'CALL' : 'PUT'}
        </div>
      </div>
      <div className={`text-4xl font-bold font-mono leading-none ${animClass}`} style={{ color }}>
        ${price.toFixed(4)}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.04]">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-navy-500 font-semibold mb-1">Intrinsic</div>
          <div className="text-sm font-mono text-navy-100">${intrinsic.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-navy-500 font-semibold mb-1">Time Value</div>
          <div className="text-sm font-mono text-navy-100">${timeValue.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}

function D1D2Card({ d1, d2 }: { d1: number; d2: number }) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Intermediates</span>
        <div className="group relative">
          <Info size={11} className="text-navy-500 cursor-help" />
          <div className="absolute bottom-full left-0 mb-2 w-72 glass-card border border-white/[0.08] p-3 text-[11px] text-navy-200 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-glass-lg">
            <strong className="text-electric">d₁</strong> = [ln(S/K) + (r + σ²/2)T] / (σ√T)<br />
            <strong className="text-electric">d₂</strong> = d₁ − σ√T<br /><br />
            N(d₁) and N(d₂) are cumulative normal probabilities used to weight the stock and strike components of the BS formula.
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[{ label: 'd₁', value: d1, nd: 'N(d₁)' }, { label: 'd₂', value: d2, nd: 'N(d₂)' }].map(({ label, value, nd }) => {
          const nd_val = 0.5 * (1 + Math.sign(value) * (1 - Math.exp(-Math.abs(value) * 0.7)));
          return (
            <div key={label} className="bg-navy-800/40 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-mono text-navy-400 font-semibold">{label}</div>
              <div className="text-xl font-bold font-mono text-electric">{value.toFixed(6)}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-navy-500">
                  <span>{nd}</span>
                  <span className="font-mono text-navy-200">{
                    (() => {
                      const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
                      const sign=value<0?-1:1;
                      const x=Math.abs(value)/Math.SQRT2;
                      const t=1/(1+p*x);
                      const y=1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
                      return (0.5*(1+sign*y)).toFixed(4);
                    })()
                  }</span>
                </div>
                <div className="h-1 bg-navy-700 rounded-full">
                  <div
                    className="h-full bg-electric rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, (value + 3) / 6 * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Calculator() {
  const { S, K, T, r, sigma, optionType } = useOptionsStore();
  const result = useMemo(() => bsPrice({ S, K, T, r, sigma }), [S, K, T, r, sigma]);
  const greeks = useMemo(() => calcGreeks({ S, K, T, r, sigma }, optionType), [S, K, T, r, sigma, optionType]);

  const putCallParity = useMemo(() => {
    const lhs = result.call + K * Math.exp(-r * T);
    const rhs = result.put + S;
    return Math.abs(lhs - rhs);
  }, [result, K, S, T, r]);

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left: Params */}
      <div className="w-72 shrink-0">
        <ParamsPanel className="h-full" />
      </div>

      {/* Right: Results */}
      <div className="flex-1 min-w-0 grid grid-rows-[auto_auto_auto] gap-4">
        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <PriceCard label="Call Option" price={result.call} type="call" S={S} K={K} />
          <PriceCard label="Put Option" price={result.put} type="put" S={S} K={K} />
        </div>

        {/* d1/d2 + Put-Call Parity */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <D1D2Card d1={result.d1} d2={result.d2} />
          </div>
          <div className="glass-card p-5 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Put-Call Parity</div>
            <div className="space-y-3 text-[12px]">
              <div className="bg-navy-800/40 rounded-xl p-3">
                <div className="text-[9px] text-navy-500 mb-1 font-mono">C + Ke⁻ʳᵀ</div>
                <div className="font-mono font-semibold text-electric">
                  {(result.call + K * Math.exp(-r * T)).toFixed(4)}
                </div>
              </div>
              <div className="bg-navy-800/40 rounded-xl p-3">
                <div className="text-[9px] text-navy-500 mb-1 font-mono">P + S</div>
                <div className="font-mono font-semibold text-electric">
                  {(result.put + S).toFixed(4)}
                </div>
              </div>
              <div className={`rounded-xl p-3 ${putCallParity < 0.001 ? 'bg-neon/8' : 'bg-gold/8'}`}>
                <div className="text-[9px] text-navy-500 mb-1">Difference</div>
                <div className={`font-mono font-bold text-sm ${putCallParity < 0.001 ? 'text-neon' : 'text-gold'}`}>
                  {putCallParity.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Greeks summary row */}
        <div className="glass-card p-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-navy-400 mb-4">Greeks Summary</div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'delta', label: 'Δ Delta', value: greeks.delta, color: '#00C8FF', fmt: (v: number) => v.toFixed(4) },
              { key: 'gamma', label: 'Γ Gamma', value: greeks.gamma, color: '#A78BFA', fmt: (v: number) => v.toFixed(4) },
              { key: 'theta', label: 'Θ Theta', value: greeks.theta, color: '#FF3366', fmt: (v: number) => v.toFixed(4) },
              { key: 'vega', label: 'V Vega', value: greeks.vega, color: '#00FF8A', fmt: (v: number) => v.toFixed(4) },
              { key: 'rho', label: 'ρ Rho', value: greeks.rho, color: '#FFB340', fmt: (v: number) => v.toFixed(4) },
            ].map(({ key, label, value, color, fmt }) => (
              <div key={key} className="bg-navy-800/40 rounded-xl p-3 text-center space-y-1.5">
                <div className="text-[9px] text-navy-500 font-medium">{label}</div>
                <div className="text-base font-bold font-mono" style={{ color }}>{fmt(value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
