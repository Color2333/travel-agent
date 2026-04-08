'use client';

import { useState } from 'react';
import { Cloud, Sun } from 'lucide-react';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/layout/SettingsModal';
import ChatContainer from './components/chat/ChatContainer';
import WeatherMap from './components/map/WeatherMap';
import CityCardGrid from './components/cards/CityCardGrid';
import type { WeatherData } from '@/types';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherData] = useState<WeatherData[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-200/20 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-32 right-10 text-white/40 animate-bounce-soft pointer-events-none hidden lg:block">
        <Cloud className="w-24 h-24" strokeWidth={1} />
      </div>
      <div className="absolute bottom-60 left-20 text-yellow-200/50 animate-bounce-soft pointer-events-none hidden lg:block" style={{ animationDelay: '0.5s' }}>
        <Sun className="w-16 h-16" strokeWidth={1} />
      </div>

      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      <main className="relative z-10 mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6 xl:px-8 h-[calc(100vh-4rem)]">
        <div className="grid h-full gap-4 lg:gap-6 lg:grid-cols-[420px_1fr] py-4">
          <div className="h-full min-h-0">
            <ChatContainer />
          </div>

          <div className="hidden lg:flex flex-col gap-4 h-full min-h-0 overflow-hidden">
            <div className="flex-shrink-0 h-[45%] min-h-[280px]">
              <WeatherMap
                weatherData={weatherData}
                className="h-full w-full rounded-2xl shadow-lg"
              />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <CityCardGrid weatherData={weatherData} />
            </div>
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
