'use client';

import React from 'react';
import { cn } from '@/lib/shadcn/utils';

export type NavTab = 'home' | 'agent' | 'dashboard';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  className?: string;
}

export function Navbar({ activeTab, onTabChange, className }: NavbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-all',
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Title */}
        <div
          onClick={() => onTabChange('home')}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-85"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/30 text-xl ring-1 ring-emerald-500/30 shadow-sm">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-base font-bold tracking-tight text-foreground">
                Farm &amp; Field
              </span>
              <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-emerald-400 ring-1 ring-emerald-500/20 sm:inline-block">
                LIVE AI
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Agricultural Voice &amp; Advisory Center
            </p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center gap-1 rounded-full border border-border/80 bg-secondary/40 p-1 shadow-inner">
          <button
            id="nav-tab-home"
            onClick={() => onTabChange('home')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200',
              activeTab === 'home'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/40'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>

          <button
            id="nav-tab-agent"
            onClick={() => onTabChange('agent')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200',
              activeTab === 'agent'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/40'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
          >
            <span>🎙️</span>
            <span>Agent</span>
            {activeTab === 'agent' && (
              <span className="size-2 rounded-full bg-emerald-300 animate-pulse" />
            )}
          </button>

          <button
            id="nav-tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200',
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/40'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
