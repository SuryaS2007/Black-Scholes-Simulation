import { bsPrice } from './blackScholes';
import type { HistoricalPoint, Preset } from '../types';

export const PRESETS: Preset[] = [
  { id: 'aapl', name: 'AAPL-like (Tech Blue-chip)', S: 175, K: 180, T: 0.25, r: 0.053, sigma: 0.28 },
  { id: 'meme', name: 'Meme Stock (High Vol)', S: 20, K: 25, T: 0.08, r: 0.053, sigma: 0.95 },
  { id: 'atm-expiry', name: 'Near Expiry ATM', S: 100, K: 100, T: 0.014, r: 0.053, sigma: 0.20 },
  { id: 'leap', name: 'LEAPS Deep ITM', S: 150, K: 100, T: 2.0, r: 0.053, sigma: 0.22 },
  { id: 'otm-put', name: 'Far OTM Protective Put', S: 100, K: 75, T: 0.5, r: 0.053, sigma: 0.22 },
  { id: 'vix-spike', name: 'VIX Spike (Crash Mode)', S: 100, K: 100, T: 0.1, r: 0.053, sigma: 1.20 },
];

/** Seeded pseudo-random for deterministic mock data */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

/** Generate mock historical data: 90 days of BS vs "market" prices */
export function generateHistoricalData(
  S0: number,
  K: number,
  r: number,
  sigma: number,
  days = 90
): HistoricalPoint[] {
  const rng = seededRandom(42);
  const data: HistoricalPoint[] = [];
  let S = S0;

  for (let i = days; i >= 0; i--) {
    const T = Math.max(i / 365, 0.001);
    const date = new Date(Date.now() - i * 86400000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Drift stock price slightly
    const dailyRet = (r / 365 + sigma * Math.sqrt(1 / 365) * (rng() * 2 - 1)) * 0.5;
    S = Math.max(S * (1 + dailyRet), 1);

    const bs = bsPrice({ S, K, T, r, sigma });
    const bsPriceVal = bs.call;

    // Market price: BS + noise + occasional regime shift
    const noiseAmp = bsPriceVal * 0.08;
    const regimeShift = i > 60 && i < 75 ? bsPriceVal * 0.12 : 0; // overpriced window
    const marketPrice = Math.max(
      bsPriceVal + (rng() - 0.5) * noiseAmp + regimeShift * (rng() > 0.5 ? 1 : -1),
      0.01
    );

    data.push({ date, bsPrice: +bsPriceVal.toFixed(4), marketPrice: +marketPrice.toFixed(4), residual: +(marketPrice - bsPriceVal).toFixed(4) });
  }
  return data;
}

/** Box-Muller normal sample */
export function randomNormal(rng: () => number = Math.random): number {
  return Math.sqrt(-2 * Math.log(rng() + 1e-15)) * Math.cos(2 * Math.PI * rng());
}
