'use client';

import { CloudSun, Settings } from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass backdrop-blur-md bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <CloudSun className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-xl text-primary-600">TravelAgent</span>
          </div>
          <button
            type="button"
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
