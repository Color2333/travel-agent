'use client';

import { useEffect, useState } from 'react';
import { CloudSun, Settings, Moon, Sun } from 'lucide-react';
import { stage } from '@/lib/ui/stage';

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return { dark, toggle };
}

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { dark, toggle } = useDarkMode();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className={stage.panelDock('flex h-16 items-center justify-between rounded-[28px] px-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] sm:px-5')}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <CloudSun className="w-8 h-8 text-sky-500 dark:text-white" strokeWidth={1.5} />
              <div className="absolute inset-0 rounded-full bg-sky-300/20 blur-xl" />
            </div>
            <span className="hidden text-xl font-semibold tracking-tight panel-t1 sm:inline">
              TravelAgent
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className={stage.actionCard('group relative rounded-2xl p-2.5 active:scale-95', true)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <Sun className="w-5 h-5 panel-t2 transition-colors group-hover:panel-t1" />
              ) : (
                <Moon className="w-5 h-5 panel-t2 transition-colors group-hover:panel-t1" />
              )}
            </button>

            <button
              type="button"
              onClick={onSettingsClick}
              className={stage.actionCard('group relative rounded-2xl p-2.5 active:scale-95', true)}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 panel-t2 transition-colors group-hover:panel-t1" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
