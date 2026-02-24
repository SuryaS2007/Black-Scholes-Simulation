import React, { Suspense, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Calculator } from './pages/Calculator';
import { Greeks } from './pages/Greeks';
import { VolatilitySurface } from './pages/VolatilitySurface';
import { PayoffDiagram } from './pages/PayoffDiagram';
import { ImpliedVol } from './pages/ImpliedVol';
import { MonteCarlo } from './pages/MonteCarlo';
import { Historical } from './pages/Historical';
import { StrategyBuilder } from './pages/StrategyBuilder';
import { useOptionsStore } from './store/useOptionsStore';
import type { PageId } from './types';

const PAGES: Record<PageId, React.FC> = {
  'calculator': Calculator,
  'greeks': Greeks,
  'volatility-surface': VolatilitySurface,
  'payoff': PayoffDiagram,
  'implied-vol': ImpliedVol,
  'monte-carlo': MonteCarlo,
  'historical': Historical,
  'strategy-builder': StrategyBuilder,
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" />
      <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" style={{ animationDelay: '0.15s' }} />
      <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse" style={{ animationDelay: '0.3s' }} />
    </div>
  );
}

export default function App() {
  const currentPage = useOptionsStore(s => s.currentPage);
  const darkMode = useOptionsStore(s => s.darkMode);
  const PageComponent = PAGES[currentPage];

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode);
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute rounded-full opacity-[0.04] blur-3xl"
          style={{ width: 600, height: 600, top: -100, left: -100, background: 'radial-gradient(circle, #00C8FF, transparent)' }}
        />
        <div
          className="absolute rounded-full opacity-[0.03] blur-3xl"
          style={{ width: 500, height: 500, bottom: -100, right: 100, background: 'radial-gradient(circle, #A78BFA, transparent)' }}
        />
      </div>

      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar />
      </div>

      {/* Main content — no overflow-hidden so TopBar dropdowns are not clipped */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        <TopBar />
        <main className="flex-1 overflow-auto p-5">
          <Suspense fallback={<PageLoader />}>
            <div key={currentPage} className="h-full animate-fade-in">
              <PageComponent />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
