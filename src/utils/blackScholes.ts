import type { BSParams, BSResult, Greeks, OptionType } from '../types';

// ─── Normal Distribution Helpers ─────────────────────────────────────────────

/** Standard normal CDF via Horner's method (Abramowitz & Stegun 26.2.17) */
export function normalCDF(x: number): number {
  if (x > 8) return 1;
  if (x < -8) return 0;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

/** Standard normal PDF */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ─── Core BS Calculations ─────────────────────────────────────────────────────

export function getD1D2(p: BSParams): { d1: number; d2: number } {
  const { S, K, T, r, sigma } = p;
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  return { d1, d2 };
}

export function bsPrice(p: BSParams): BSResult {
  const { S, K, T, r } = p;
  if (T <= 0) {
    return {
      call: Math.max(S - K, 0),
      put: Math.max(K - S, 0),
      d1: 0,
      d2: 0,
    };
  }
  const { d1, d2 } = getD1D2(p);
  const disc = Math.exp(-r * T);
  return {
    call: S * normalCDF(d1) - K * disc * normalCDF(d2),
    put: K * disc * normalCDF(-d2) - S * normalCDF(-d1),
    d1,
    d2,
  };
}

export function callPrice(p: BSParams): number {
  return bsPrice(p).call;
}

export function putPrice(p: BSParams): number {
  return bsPrice(p).put;
}

// ─── Greeks ───────────────────────────────────────────────────────────────────

export function calcGreeks(p: BSParams, type: OptionType): Greeks {
  const { S, K, T, r, sigma } = p;
  if (T <= 0) {
    return { delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0 };
  }
  const { d1, d2 } = getD1D2(p);
  const sqrtT = Math.sqrt(T);
  const disc = Math.exp(-r * T);
  const pdf1 = normalPDF(d1);

  const delta = type === 'call' ? normalCDF(d1) : normalCDF(d1) - 1;
  const gamma = pdf1 / (S * sigma * sqrtT);
  const vega = (S * pdf1 * sqrtT) / 100; // per 1% vol move
  const thetaCommon = -(S * pdf1 * sigma) / (2 * sqrtT);
  const theta =
    type === 'call'
      ? (thetaCommon - r * K * disc * normalCDF(d2)) / 365
      : (thetaCommon + r * K * disc * normalCDF(-d2)) / 365;
  const rho =
    type === 'call'
      ? (K * T * disc * normalCDF(d2)) / 100
      : -(K * T * disc * normalCDF(-d2)) / 100;

  return { delta, gamma, theta, vega, rho };
}

// ─── Implied Volatility (Newton-Raphson) ──────────────────────────────────────

export function impliedVolatility(
  marketPrice: number,
  p: Omit<BSParams, 'sigma'>,
  type: OptionType,
  maxIter = 100,
  tol = 1e-8
): { iv: number; converged: boolean; iterations: { sigma: number; price: number; error: number }[] } {
  const { S, K, T, r } = p;
  let sigma = 0.2;
  const iterations: { sigma: number; price: number; error: number }[] = [];

  for (let i = 0; i < maxIter; i++) {
    const params: BSParams = { S, K, T, r, sigma };
    const price = type === 'call' ? callPrice(params) : putPrice(params);
    const v = (S * normalPDF(getD1D2(params).d1) * Math.sqrt(T)); // raw vega (not /100)
    const error = price - marketPrice;

    iterations.push({ sigma, price, error });

    if (Math.abs(error) < tol) return { iv: sigma, converged: true, iterations };
    if (Math.abs(v) < 1e-12) break;

    const next = sigma - error / v;
    sigma = next <= 0.001 ? sigma / 2 : next;
    if (sigma > 10) { sigma = 10; break; }
  }
  return { iv: sigma, converged: false, iterations };
}

// ─── Volatility Surface Grid ──────────────────────────────────────────────────

export function buildVolSurface(
  K: number,
  r: number,
  sigma: number,
  type: OptionType,
  sPoints = 25,
  tPoints = 25
): { sAxis: number[]; tAxis: number[]; z: number[][] } {
  const sAxis = Array.from({ length: sPoints }, (_, i) => K * 0.5 + (K * 1.5 * i) / (sPoints - 1));
  const tAxis = Array.from({ length: tPoints }, (_, i) => 0.02 + (2.98 * i) / (tPoints - 1));
  const z = sAxis.map(S =>
    tAxis.map(T => {
      const p: BSParams = { S, K, T, r, sigma };
      return type === 'call' ? callPrice(p) : putPrice(p);
    })
  );
  return { sAxis, tAxis, z };
}

// ─── Payoff at Expiry ─────────────────────────────────────────────────────────

export function payoffAtExpiry(
  K: number,
  premium: number,
  type: OptionType,
  sMin?: number,
  sMax?: number,
  points = 200
): { S: number; pl: number; profit: number; loss: number }[] {
  const lo = sMin ?? K * 0.5;
  const hi = sMax ?? K * 1.5;
  return Array.from({ length: points }, (_, i) => {
    const S = lo + ((hi - lo) * i) / (points - 1);
    const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
    const pos = type === 'call' ? 1 : 1;
    const pl = (intrinsic - premium) * pos;
    return { S, pl, profit: Math.max(pl, 0), loss: Math.min(pl, 0) };
  });
}
