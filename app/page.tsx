'use client';

import { useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <div className="space-y-4">
            <ChatContainer />
          </div>

          <div className="space-y-4">
            <WeatherMap
              weatherData={weatherData}
              className="h-[400px] rounded-2xl"
            />
            <CityCardGrid weatherData={weatherData} />
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
