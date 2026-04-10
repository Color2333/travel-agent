'use client';

import { CloudSun, Settings } from 'lucide-react';
import { stage } from '@/lib/ui/stage';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className={stage.panelDock('flex h-16 items-center justify-between rounded-[28px] px-4 shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:px-5')}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <CloudSun className="w-8 h-8 text-white" strokeWidth={1.5} />
              <div className="absolute inset-0 rounded-full bg-sky-300/30 blur-xl" />
            </div>
            <span className="hidden text-xl font-semibold tracking-tight text-white sm:inline">
              TravelAgent
            </span>
          </div>

          <button
            type="button"
            onClick={onSettingsClick}
            className={stage.actionCard('group relative rounded-2xl p-2.5 active:scale-95', true)}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-white/82 transition-colors group-hover:text-white" />
            <div className="absolute inset-0 rounded-2xl bg-white/0 transition-colors group-hover:bg-white/8" />
          </button>
        </div>
      </div>
    </header>
  );
}
