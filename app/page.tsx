'use client';

import { useEffect, useState } from 'react';
import { Cloud, Sun } from 'lucide-react';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/layout/SettingsModal';
import ChatContainer from './components/chat/ChatContainer';
import WeatherMap from './components/map/WeatherMap';
import CityCardGrid from './components/cards/CityCardGrid';
import DecisionPanel from './components/decision/DecisionPanel';
import type { TripPlanResult, WeatherData } from '@/types';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [tripPlan, setTripPlan] = useState<TripPlanResult | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    if (weatherData.length === 0) {
      setSelectedCity(null);
      return;
    }

    setSelectedCity((current) => {
      if (current && weatherData.some((item) => item.city === current)) {
        return current;
      }

      return [...weatherData].sort((a, b) => b.score - a.score)[0]?.city ?? null;
    });
  }, [weatherData]);

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

      <main className="relative z-10 mx-auto max-w-[1600px] px-3 sm:px-4 lg:px-6 xl:px-8 pb-6">
        <div className="grid gap-4 py-4 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(360px,420px)_1fr] lg:gap-6">
          <div className="min-h-[52vh] lg:h-[calc(100vh-6rem)] lg:min-h-0">
            <ChatContainer
              onWeatherUpdate={setWeatherData}
              onPlanUpdate={setTripPlan}
              queuedPrompt={queuedPrompt}
              onQueuedPromptHandled={() => setQueuedPrompt(null)}
            />
          </div>

          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex-shrink-0 h-[380px] sm:h-[440px] lg:h-[44vh] lg:min-h-[340px]">
              <WeatherMap
                weatherData={weatherData}
                originCity={tripPlan?.origin}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                className="h-full w-full rounded-2xl shadow-lg"
              />
            </div>
            <div className="flex-shrink-0">
              <DecisionPanel
                tripPlan={tripPlan}
                selectedCity={selectedCity}
                weatherData={weatherData}
                onAskFollowUp={(text) => setQueuedPrompt({ id: Date.now(), text })}
              />
            </div>
            <div className="min-h-0 lg:flex-1 lg:overflow-y-auto custom-scrollbar">
              <CityCardGrid
                weatherData={weatherData}
                selectedCity={selectedCity}
                onCityClick={setSelectedCity}
              />
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
