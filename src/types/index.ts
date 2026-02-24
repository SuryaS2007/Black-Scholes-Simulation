export type OptionType = 'call' | 'put';

export interface BSParams {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
}

export interface BSResult {
  call: number;
  put: number;
  d1: number;
  d2: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export type PageId =
  | 'calculator'
  | 'greeks'
  | 'volatility-surface'
  | 'payoff'
  | 'implied-vol'
  | 'monte-carlo'
  | 'historical'
  | 'strategy-builder';

export interface StrategyLeg {
  id: string;
  type: OptionType;
  position: 'long' | 'short';
  strike: number;
  premium: number;
  quantity: number;
}

export interface MCWorkerInput {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  optionType: OptionType;
  N: number;
  steps: number;
}

export interface MCWorkerOutput {
  displayPaths: number[][];
  terminalPrices: number[];
  mcPrice: number;
  ciLow: number;
  ciHigh: number;
  bsPrice: number;
}

export interface HistoricalPoint {
  date: string;
  bsPrice: number;
  marketPrice: number;
  residual: number;
}

export interface Preset {
  id: string;
  name: string;
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
}
