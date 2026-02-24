import React from 'react';
import {
  Calculator,
  TrendingUp,
  Layers,
  BarChart2,
  Zap,
  Shuffle,
  Clock,
  PieChart,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useOptionsStore } from '../../store/useOptionsStore';
import type { PageId } from '../../types';

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  sublabel: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'calculator', label: 'Calculator', sublabel: 'BS Pricing', icon: Calculator },
  { id: 'greeks', label: 'Greeks', sublabel: 'Δ Γ Θ Vega ρ', icon: TrendingUp },
  { id: 'volatility-surface', label: 'Vol Surface', sublabel: '3D Surface', icon: Layers },
  { id: 'payoff', label: 'Payoff', sublabel: 'P&L Diagram', icon: BarChart2 },
  { id: 'implied-vol', label: 'Implied Vol', sublabel: 'IV Solver', icon: Zap },
  { id: 'monte-carlo', label: 'Monte Carlo', sublabel: 'Simulation', icon: Shuffle },
  { id: 'historical', label: 'Historical', sublabel: 'Model vs Mkt', icon: Clock },
  { id: 'strategy-builder', label: 'Strategies', sublabel: 'Multi-Leg', icon: PieChart },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed } = useOptionsStore();

  return (
    <aside
      className="flex flex-col shrink-0 h-full bg-navy-900/95 border-r border-white/[0.06] transition-all duration-300 ease-out"
      style={{ width: sidebarCollapsed ? 68 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.05]">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-electric/90 to-electric/30 flex items-center justify-center shadow-glow">
          <span className="text-navy-900 font-bold text-sm">Δ</span>
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-white tracking-tight leading-none">QuantEdge</div>
            <div className="text-[10px] text-navy-400 mt-0.5 leading-none">Options Lab</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left
                transition-all duration-150 group
                ${active
                  ? 'bg-electric/10 text-electric border border-electric/20'
                  : 'text-navy-300 hover:text-navy-50 hover:bg-white/[0.04] border border-transparent'}
              `}
            >
              <Icon
                size={17}
                className={`shrink-0 transition-colors duration-150 ${active ? 'text-electric' : 'text-navy-400 group-hover:text-navy-200'}`}
              />
              {!sidebarCollapsed && (
                <div className="overflow-hidden min-w-0">
                  <div className={`text-[13px] font-medium leading-none ${active ? 'text-electric' : ''}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-navy-500 mt-0.5 leading-none font-mono">
                    {item.sublabel}
                  </div>
                </div>
              )}
              {active && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-electric shrink-0 shadow-[0_0_6px_rgba(0,200,255,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-4">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-navy-400 hover:text-navy-200 hover:bg-white/[0.04] transition-colors duration-150"
        >
          {sidebarCollapsed ? <ChevronRight size={15} /> : (
            <>
              <ChevronLeft size={15} />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
