import type { MCWorkerInput, MCWorkerOutput } from '../types';
import { callPrice, putPrice, normalCDF } from '../utils/blackScholes';

/** Box-Muller transform */
function randNorm(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

self.onmessage = (e: MessageEvent<MCWorkerInput>) => {
  const { S, K, T, r, sigma, optionType, N, steps } = e.data;

  const dt = T / steps;
  const drift = (r - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);

  const terminalPrices: number[] = new Array(N);
  const displayPaths: number[][] = [];
  const displayCount = Math.min(300, N);

  for (let i = 0; i < N; i++) {
    let St = S;
    const path: number[] = i < displayCount ? [S] : [];

    for (let j = 0; j < steps; j++) {
      St = St * Math.exp(drift + diffusion * randNorm());
      if (i < displayCount) path.push(St);
    }

    terminalPrices[i] = St;
    if (i < displayCount) displayPaths.push(path);
  }

  // Payoffs
  const payoffs = optionType === 'call'
    ? terminalPrices.map(ST => Math.max(ST - K, 0))
    : terminalPrices.map(ST => Math.max(K - ST, 0));

  const disc = Math.exp(-r * T);
  const discPayoffs = payoffs.map(p => p * disc);
  const mcPrice = discPayoffs.reduce((a, b) => a + b, 0) / N;

  // 95% CI
  const variance = discPayoffs.reduce((s, p) => s + (p - mcPrice) ** 2, 0) / (N - 1);
  const stdErr = Math.sqrt(variance / N);

  // Analytical BS price
  const bsP = optionType === 'call' ? callPrice({ S, K, T, r, sigma }) : putPrice({ S, K, T, r, sigma });

  const result: MCWorkerOutput = {
    displayPaths,
    terminalPrices,
    mcPrice,
    ciLow: mcPrice - 1.96 * stdErr,
    ciHigh: mcPrice + 1.96 * stdErr,
    bsPrice: bsP,
  };

  self.postMessage(result);
};
