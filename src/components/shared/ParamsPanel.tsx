import React from 'react';
import { InputSlider } from './InputSlider';
import { useOptionsStore } from '../../store/useOptionsStore';
import type { OptionType } from '../../types';

interface ParamsPanelProps {
  className?: string;
}

export function ParamsPanel({ className = '' }: ParamsPanelProps) {
  const { S, K, T, r, sigma, optionType, setS, setK, setT, setR, setSigma, setOptionType } = useOptionsStore();

  return (
    <div className={`glass-card p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-400">Parameters</h3>
        {/* Option type toggle */}
        <div className="flex items-center bg-navy-800/60 border border-white/[0.06] rounded-lg p-0.5 gap-0.5">
          {(['call', 'put'] as OptionType[]).map(t => (
            <button
              key={t}
              onClick={() => setOptionType(t)}
              className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide transition-all duration-150 ${
                optionType === t
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

      <InputSlider
        label="Stock Price (S)"
        value={S}
        min={1} max={1000} step={0.5}
        onChange={setS}
        displayFormat={v => `$${v.toFixed(2)}`}
        inputFormat={v => v.toFixed(2)}
        parseValue={v => parseFloat(v)}
        tooltip="Current market price of the underlying asset"
        accentColor="blue"
      />
      <InputSlider
        label="Strike Price (K)"
        value={K}
        min={1} max={1000} step={0.5}
        onChange={setK}
        displayFormat={v => `$${v.toFixed(2)}`}
        inputFormat={v => v.toFixed(2)}
        parseValue={v => parseFloat(v)}
        tooltip="The agreed price at which the option can be exercised"
        accentColor="gold"
      />
      <InputSlider
        label="Time to Expiry (T)"
        value={T}
        min={0.01} max={3} step={0.01}
        onChange={setT}
        displayFormat={v => `${v.toFixed(3)}y`}
        inputFormat={v => v.toFixed(3)}
        parseValue={v => parseFloat(v)}
        tooltip="Time remaining until option expiration, in years (0.25 = 3 months)"
        accentColor="blue"
      />
      <InputSlider
        label="Risk-Free Rate (r)"
        value={r}
        min={0} max={0.15} step={0.001}
        onChange={setR}
        displayFormat={v => `${(v * 100).toFixed(2)}%`}
        inputFormat={v => (v * 100).toFixed(2)}
        parseValue={v => parseFloat(v) / 100}
        tooltip="Annualized risk-free interest rate (e.g. T-bill rate)"
        accentColor="gold"
      />
      <InputSlider
        label="Volatility (σ)"
        value={sigma}
        min={0.01} max={2.0} step={0.01}
        onChange={setSigma}
        displayFormat={v => `${(v * 100).toFixed(1)}%`}
        inputFormat={v => (v * 100).toFixed(1)}
        parseValue={v => parseFloat(v) / 100}
        tooltip="Annualized implied or historical volatility of the underlying"
        accentColor="green"
      />

      {/* Moneyness indicator */}
      <div className="pt-2 border-t border-white/[0.04]">
        <div className="flex items-center justify-between text-[10px] text-navy-500">
          <span>Moneyness</span>
          <span className={`font-semibold font-mono text-[11px] ${
            Math.abs(S / K - 1) < 0.02 ? 'text-gold' : S > K ? 'text-neon' : 'text-loss'
          }`}>
            {Math.abs(S / K - 1) < 0.005
              ? 'ATM'
              : S > K
              ? `ITM +${((S / K - 1) * 100).toFixed(1)}%`
              : `OTM ${((S / K - 1) * 100).toFixed(1)}%`}
          </span>
        </div>
        <div className="mt-1.5 h-1 bg-navy-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, (S / (K * 2)) * 100))}%`,
              background: S > K ? '#00FF8A' : S < K ? '#FF3366' : '#FFB340',
            }}
          />
        </div>
      </div>
    </div>
  );
}
