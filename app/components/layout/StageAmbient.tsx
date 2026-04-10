'use client';

import { Cloud, Sun } from 'lucide-react';

export function StageAmbient() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-blue-300/30 blur-3xl animate-pulse-slow dark:bg-blue-500/20" />
        <div
          className="absolute bottom-40 right-20 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl animate-pulse-slow dark:bg-sky-400/15"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-indigo-200/20 blur-2xl animate-pulse-slow dark:bg-indigo-400/10"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="pointer-events-none absolute right-10 top-32 hidden animate-bounce-soft text-slate-300/60 dark:text-white/30 lg:block">
        <Cloud className="h-24 w-24" strokeWidth={1} />
      </div>

      <div
        className="pointer-events-none absolute bottom-60 left-20 hidden animate-bounce-soft text-yellow-400/40 dark:text-yellow-200/30 lg:block"
        style={{ animationDelay: '0.5s' }}
      >
        <Sun className="h-16 w-16" strokeWidth={1} />
      </div>
    </>
  );
}
