'use client';

import { CloudSun, Settings } from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/30 shadow-sm backdrop-blur-xl bg-white/60">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <CloudSun className="w-8 h-8 text-primary-600" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-primary-400/20 blur-xl rounded-full" />
            </div>
            <span className="font-bold text-xl text-primary-700 tracking-tight hidden sm:inline">
              TravelAgent
            </span>
          </div>

          <button
            type="button"
            onClick={onSettingsClick}
            className="group relative p-2.5 rounded-xl hover:bg-white/50 transition-all duration-200 active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 group-hover:text-primary-600 transition-colors" />
            <div className="absolute inset-0 bg-primary-100/0 group-hover:bg-primary-100/50 rounded-xl transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}
