'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Map, MessageSquareText } from 'lucide-react';
import { StageAmbient } from './components/layout/StageAmbient';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/layout/SettingsModal';
import { StageWorkspace } from './components/layout/StageWorkspace';
import ChatContainer from './components/chat/ChatContainer';
import WeatherMap from './components/map/WeatherMap';
import CityCardGrid from './components/cards/CityCardGrid';
import DecisionPanel from './components/decision/DecisionPanel';
import CitySearchModal from './components/search/CitySearchModal';
import type { TripPlanResult, WeatherData } from '@/types';
import { useStagePanels, type StagePanelKey } from '@/lib/ui/use-stage-panels';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [tripPlan, setTripPlan] = useState<TripPlanResult | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<{ id: number; text: string } | null>(null);
  const {
    panelStates,
    activeMobilePanel,
    focusedPanel,
    openPanels,
    setActiveMobilePanel,
    setFocusedPanel,
    setPanelState,
    togglePanel,
  } = useStagePanels();

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

  // Only show 2 panels in toolbar — 'decision' key exists in useStagePanels but is hidden from UI
  const panelButtons: Array<{ key: StagePanelKey; label: string; icon: typeof MessageSquareText; short: string }> = [
    { key: 'chat', label: '对话', icon: MessageSquareText, short: 'Chat' },
    { key: 'cards', label: '城市', icon: Map, short: 'Cities' },
  ];

  const rightPanelContent: ReactNode = (
    <>
      <DecisionPanel
        tripPlan={tripPlan}
        selectedCity={selectedCity}
        weatherData={weatherData}
      />
      <CityCardGrid
        weatherData={weatherData}
        selectedCity={selectedCity}
        onCityClick={setSelectedCity}
      />
    </>
  );

  const desktopPanels: Array<{
    key: StagePanelKey;
    title: string;
    positionClass: string;
    bodyClass: string;
    content: ReactNode;
  }> = [
    {
      key: 'chat',
      title: '对话',
      positionClass: 'left-6 top-[8.8rem] bottom-6 w-[340px] xl:w-[360px]',
      bodyClass: 'h-[calc(100%-2.75rem)]',
      content: (
        <ChatContainer
          onWeatherUpdate={setWeatherData}
          onPlanUpdate={setTripPlan}
          queuedPrompt={queuedPrompt}
          onQueuedPromptHandled={() => setQueuedPrompt(null)}
        />
      ),
    },
    {
      key: 'cards',
      title: '城市',
      positionClass: 'right-6 top-[8.8rem] bottom-6 w-[360px] xl:w-[380px]',
      bodyClass: 'h-[calc(100%-2.75rem)] overflow-y-auto custom-scrollbar',
      content: rightPanelContent,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden [background:var(--page-bg)]">
      <StageAmbient />

      <Header 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onSearchClick={() => setIsSearchOpen(true)}
      />

      <main className="relative isolate h-screen w-full">
        <div className="absolute inset-0 z-0">
          <WeatherMap
            weatherData={weatherData}
            originCity={tripPlan?.origin}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            className="h-full w-full"
          />
        </div>

        <StageWorkspace
          items={panelButtons}
          panels={desktopPanels}
          panelStates={panelStates}
          openPanelKeys={openPanels}
          focusedPanel={focusedPanel}
          activeMobilePanel={activeMobilePanel}
          onTogglePanel={togglePanel}
          onFocusPanel={setFocusedPanel}
          onSetPanelState={setPanelState}
          onSetActiveMobilePanel={setActiveMobilePanel}
          mobileContent={
            <>
              {activeMobilePanel === 'chat' && (
                <ChatContainer
                  onWeatherUpdate={setWeatherData}
                  onPlanUpdate={setTripPlan}
                  queuedPrompt={queuedPrompt}
                  onQueuedPromptHandled={() => setQueuedPrompt(null)}
                />
              )}

              {(activeMobilePanel === 'cards' || activeMobilePanel === 'decision') && rightPanelContent}
            </>
          }
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CitySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCity={(city) => {
          // 将选中的城市设置为对话的默认出发地
          setQueuedPrompt({
            id: Date.now(),
            text: `这周六从${city.name}出发`,
          });
        }}
      />
    </div>
  );
}
