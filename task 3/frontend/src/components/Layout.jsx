import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldHalf,
  LayoutGrid,
  ScanSearch,
  GraduationCap,
  BarChart3,
  Menu,
  X,
  Radio,
} from 'lucide-react';

const navigation = [
  { name: 'Console', href: '/', icon: LayoutGrid },
  { name: 'Analyze', href: '/analyze', icon: ScanSearch },
  { name: 'Training', href: '/training', icon: GraduationCap },
  { name: 'Statistics', href: '/stats', icon: BarChart3 },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-ink-900 border-r border-ink-700 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-ink-700">
          <ShieldHalf className="w-5 h-5 text-signal" strokeWidth={2} />
          <div>
            <p className="font-mono text-[13px] font-semibold tracking-tight text-paper-100">
              PHISHGUARD
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-ink-800 text-paper-100 border-l-2 border-signal -ml-px'
                    : 'text-paper-300 hover:bg-ink-800/60 hover:text-paper-100'
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={1.75} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ink-700">
          <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-safe-bg border border-safe/20">
            <Radio className="w-3.5 h-3.5 text-safe" strokeWidth={2} />
            <span className="font-mono text-[11px] uppercase tracking-wide text-safe">
              Engines online
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <header className="h-16 border-b border-ink-700 flex items-center justify-between px-4 lg:px-8 bg-ink-950/80 backdrop-blur sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-md hover:bg-ink-800 transition-colors lg:hidden"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper-400 hidden sm:block">
            Threat Detection Console
          </span>
          <div className="flex items-center gap-2 font-mono text-[11px] text-paper-400">
            <span className="w-1.5 h-1.5 rounded-full bg-safe" />
            v1.0.0
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
