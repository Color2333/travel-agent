'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { LayoutPanelTop, Map, MessageSquareText } from 'lucide-react';
import { StageAmbient } from './components/layout/StageAmbient';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/layout/SettingsModal';
import { StageStatusBar } from './components/layout/StageStatusBar';
import { StageWorkspace } from './components/layout/StageWorkspace';
import ChatContainer from './components/chat/ChatContainer';
import WeatherMap from './components/map/WeatherMap';
import CityCardGrid from './components/cards/CityCardGrid';
import DecisionPanel from './components/decision/DecisionPanel';
import type { TripPlanResult, WeatherData } from '@/types';
import { useStagePanels, type StagePanelKey } from '@/lib/ui/use-stage-panels';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [tripPlan, setTripPlan] = useState<TripPlanResult | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<{ id: number; text: string } | null>(null);
  const {
    panelStates,
    activeMobilePanel,
    focusedPanel,
    openPanels,
    minimizedPanels,
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

  const panelButtons: Array<{ key: StagePanelKey; label: string; icon: typeof MessageSquareText; short: string }> = [
    { key: 'chat', label: '对话', icon: MessageSquareText, short: 'Chat' },
    { key: 'decision', label: '决策', icon: LayoutPanelTop, short: 'Decision' },
    { key: 'cards', label: '城市', icon: Map, short: 'Cities' },
  ];

  const desktopPanels: Array<{
    key: StagePanelKey;
    title: string;
    subtitle: string;
    positionClass: string;
    bodyClass: string;
    content: ReactNode;
  }> = [
    {
      key: 'chat',
      title: '对话台',
      subtitle: '自然语言控制地图与策略',
      positionClass: 'left-6 top-24 bottom-6 w-[390px]',
      bodyClass: 'h-[calc(100%-4.5rem)]',
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
      key: 'decision',
      title: '决策台',
      subtitle: '总结、比较与继续追问',
      positionClass: 'right-6 top-24 w-[430px] max-h-[40vh]',
      bodyClass: 'max-h-[calc(40vh-4.5rem)] overflow-y-auto custom-scrollbar',
      content: (
        <DecisionPanel
          tripPlan={tripPlan}
          selectedCity={selectedCity}
          weatherData={weatherData}
          onAskFollowUp={(text) => setQueuedPrompt({ id: Date.now(), text })}
        />
      ),
    },
    {
      key: 'cards',
      title: '城市台',
      subtitle: '快速筛选候选目的地',
      positionClass: 'right-6 bottom-6 w-[540px] max-h-[42vh]',
      bodyClass: 'max-h-[calc(42vh-4.5rem)] overflow-y-auto custom-scrollbar',
      content: (
        <CityCardGrid
          weatherData={weatherData}
          selectedCity={selectedCity}
          onCityClick={setSelectedCity}
        />
      ),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#dbeafe_0%,#e0f2fe_30%,#f8fafc_100%)]">
      <StageAmbient />

      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      <main className="relative h-screen w-full">
        <div className="absolute inset-0">
          <WeatherMap
            weatherData={weatherData}
            originCity={tripPlan?.origin}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            className="h-full w-full"
          />
        </div>

        <StageStatusBar
          focusedPanel={focusedPanel}
          openCount={openPanels.length}
          selectedCity={selectedCity}
          originCity={tripPlan?.origin ?? null}
          date={tripPlan?.date ?? null}
        />

        <StageWorkspace
          items={panelButtons}
          panels={desktopPanels}
          panelStates={panelStates}
          openPanelKeys={openPanels}
          minimizedPanelKeys={minimizedPanels}
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

              {activeMobilePanel === 'decision' && (
                <DecisionPanel
                  tripPlan={tripPlan}
                  selectedCity={selectedCity}
                  weatherData={weatherData}
                  onAskFollowUp={(text) => setQueuedPrompt({ id: Date.now(), text })}
                />
              )}

              {activeMobilePanel === 'cards' && (
                <CityCardGrid
                  weatherData={weatherData}
                  selectedCity={selectedCity}
                  onCityClick={setSelectedCity}
                />
              )}
            </>
          }
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
