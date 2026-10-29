'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Users,
  Wallet,
  ArrowLeftRight,
  Lightbulb,
  PieChart,
  Database,
  Settings,
  Menu,
  X,
  Flame,
  Globe,
} from 'lucide-react';
import { useData } from '@/lib/context/DataContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isSignature?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Campaign Explorer', href: '/campaigns', icon: Compass },
  { name: 'Creative Lab', href: '/creatives', icon: Sparkles, badge: 'Core', isSignature: true },
  { name: 'Ad Web Crawler', href: '/crawler', icon: Globe, badge: 'Live', isSignature: true },
  { name: 'Audience Analytics', href: '/audiences', icon: Users },
  { name: 'Budget Intelligence', href: '/budget', icon: Wallet },
  { name: 'Comparisons', href: '/comparisons', icon: ArrowLeftRight },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'Visual Explorer', href: '/explore', icon: PieChart, badge: 'Builder', isSignature: true },
  { name: 'Data Sources', href: '/data-sources', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { filteredObservations, isDemoMode } = useData();

  return (
    <>

      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-neutral-900 rounded-md flex items-center justify-center text-white font-bold text-xs tracking-tighter">
            B
          </div>
          <span className="font-bold text-neutral-900 text-sm tracking-tight">Bekemon</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#FAFAF8] border-r border-neutral-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>

          <div className="px-5 py-5 border-b border-neutral-200/80">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-xs group-hover:bg-neutral-800 transition-colors">
                B
              </div>
              <span className="font-extrabold text-neutral-900 text-base tracking-tight">Bekemon</span>
            </Link>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 py-1.5">
              Analytics Workspace
            </div>

            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-neutral-400 group-hover:text-neutral-700'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isActive
                          ? 'bg-neutral-700 text-neutral-200'
                          : item.isSignature
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-neutral-200/80 bg-neutral-100/50">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span className="font-medium">Active Observations</span>
            <span className="font-mono font-semibold text-neutral-800">
              {filteredObservations.length.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span
              className={`w-2 h-2 rounded-full ${
                isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className="truncate">
              {isDemoMode ? 'Simulated Demo' : 'Custom Imported'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
