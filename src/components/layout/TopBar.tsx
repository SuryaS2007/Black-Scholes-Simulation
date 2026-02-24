import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, ChevronDown, Check } from 'lucide-react';
import { useOptionsStore } from '../../store/useOptionsStore';
import { PRESETS } from '../../utils/mockData';

const PAGE_LABELS: Record<string, string> = {
  'calculator': 'Options Calculator',
  'greeks': 'Greeks Dashboard',
  'volatility-surface': '3D Volatility Surface',
  'payoff': 'Payoff Diagram',
  'implied-vol': 'Implied Volatility',
  'monte-carlo': 'Monte Carlo Simulation',
  'historical': 'Historical vs Model',
  'strategy-builder': 'Strategy Builder',
};

const PAGE_SUBTITLES: Record<string, string> = {
  'calculator': 'Black-Scholes analytical pricing',
  'greeks': 'First and second order sensitivities',
  'volatility-surface': 'Option price across S and T dimensions',
  'payoff': 'Profit & loss at expiration',
  'implied-vol': 'Newton-Raphson IV solver',
  'monte-carlo': 'Geometric Brownian Motion paths',
  'historical': 'Model accuracy over time',
  'strategy-builder': 'Multi-leg options strategies',
};

export function TopBar() {
  const { currentPage, darkMode, toggleDarkMode, applyPreset, S, K, T, r, sigma } = useOptionsStore();
  const [presetsOpen, setPresetsOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setPresetsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentPresetMatch = PRESETS.find(
    p => p.S === S && p.K === K && Math.abs(p.T - T) < 0.001 && Math.abs(p.r - r) < 0.001 && Math.abs(p.sigma - sigma) < 0.001
  );

  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.05] bg-navy-900/60 backdrop-blur-sm shrink-0">
      {/* Page title */}
      <div>
        <h1 className="text-base font-semibold text-white leading-none tracking-tight">
          {PAGE_LABELS[currentPage]}
        </h1>
        <p className="text-[11px] text-navy-400 mt-0.5 leading-none">
          {PAGE_SUBTITLES[currentPage]}
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Global params summary pills */}
        <div className="hidden lg:flex items-center gap-2">
          {[
            { label: 'S', value: S.toFixed(0) },
            { label: 'K', value: K.toFixed(0) },
            { label: 'T', value: T.toFixed(2) + 'y' },
            { label: 'σ', value: (sigma * 100).toFixed(0) + '%' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1 bg-navy-800/60 border border-white/[0.06] rounded-lg px-2.5 py-1">
              <span className="text-[10px] font-medium text-navy-400">{label}</span>
              <span className="text-[11px] font-mono font-semibold text-electric">{value}</span>
            </div>
          ))}
        </div>

        {/* Presets dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setPresetsOpen(v => !v)}
            className="flex items-center gap-1.5 bg-navy-800/60 border border-white/[0.06] hover:border-electric/30 rounded-lg px-3 py-1.5 text-xs font-medium text-navy-200 hover:text-white transition-colors duration-150"
          >
            <span>Presets</span>
            <ChevronDown size={12} className={`transition-transform duration-150 ${presetsOpen ? 'rotate-180' : ''}`} />
          </button>
          {presetsOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-64 glass-card border border-white/[0.08] py-1.5 shadow-glass-lg animate-fade-in">
              {PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => { applyPreset(preset); setPresetsOpen(false); }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-white/[0.05] transition-colors duration-100 group"
                >
                  <div>
                    <div className="text-[12px] font-medium text-navy-100 group-hover:text-white">{preset.name}</div>
                    <div className="text-[10px] text-navy-500 font-mono mt-0.5">
                      S={preset.S} K={preset.K} σ={(preset.sigma * 100).toFixed(0)}%
                    </div>
                  </div>
                  {currentPresetMatch?.id === preset.id && (
                    <Check size={12} className="text-electric shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06] hover:border-electric/30 bg-navy-800/60 hover:bg-navy-700/60 text-navy-300 hover:text-electric transition-all duration-150"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
