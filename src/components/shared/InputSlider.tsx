import React, { useCallback, useId, useState } from 'react';
import { Info } from 'lucide-react';

interface InputSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  displayFormat?: (v: number) => string;   // For the label badge (e.g. "5.00%")
  inputFormat?: (v: number) => string;     // For the editable input (plain number)
  parseValue?: (v: string) => number;
  tooltip?: string;
  accentColor?: 'blue' | 'green' | 'red' | 'gold';
}

const ACCENT_COLORS = {
  blue:  { track: '#00C8FF', text: '#00C8FF' },
  green: { track: '#00FF8A', text: '#00FF8A' },
  red:   { track: '#FF3366', text: '#FF3366' },
  gold:  { track: '#FFB340', text: '#FFB340' },
};

export function InputSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayFormat = (v) => v.toFixed(2),
  inputFormat = (v) => v.toFixed(step < 0.01 ? 3 : 2),
  parseValue = (v) => parseFloat(v),
  tooltip,
  accentColor = 'blue',
}: InputSliderProps) {
  const id = useId();
  const accent = ACCENT_COLORS[accentColor];
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  const startEdit = () => {
    setEditVal(inputFormat(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const v = parseValue(editVal);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={id} className="text-[12px] font-medium text-navy-200 cursor-pointer select-none truncate">
            {label}
          </label>
          {tooltip && (
            <div className="group relative shrink-0">
              <Info size={11} className="text-navy-600 cursor-help hover:text-navy-400 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 glass-card border border-white/[0.08] p-2.5 text-[11px] text-navy-200 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-glass-lg">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0">
          {editing ? (
            <input
              type="number"
              autoFocus
              value={editVal}
              min={min}
              max={max}
              step={step}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="num-input"
              style={{ color: accent.text }}
            />
          ) : (
            <button
              onClick={startEdit}
              className="num-input text-right hover:border-current/40 cursor-text transition-all duration-150"
              style={{ color: accent.text, borderColor: 'rgba(255,255,255,0.08)' }}
              title="Click to edit"
            >
              {displayFormat(value)}
            </button>
          )}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSlider}
        className="range-slider"
        style={{
          background: `linear-gradient(to right, ${accent.track} ${pct}%, #162840 ${pct}%)`,
        }}
      />
    </div>
  );
}
