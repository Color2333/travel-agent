'use client';

import { useEffect, useMemo, useState } from 'react';

export type StagePanelKey = 'chat' | 'decision' | 'cards';
export type StagePanelState = 'open' | 'minimized';

type PanelStateMap = Record<StagePanelKey, StagePanelState>;

const DEFAULT_PANEL_STATES: PanelStateMap = {
  chat: 'open',
  decision: 'open',
  cards: 'open',
};

function getNextOpenPanel(states: PanelStateMap, excluded?: StagePanelKey) {
  return (Object.entries(states) as Array<[StagePanelKey, StagePanelState]>).find(
    ([key, state]) => key !== excluded && state === 'open',
  )?.[0];
}

export function useStagePanels(initialState: PanelStateMap = DEFAULT_PANEL_STATES) {
  const [panelStates, setPanelStates] = useState<PanelStateMap>(initialState);
  const [activeMobilePanel, setActiveMobilePanel] = useState<StagePanelKey>('chat');
  const [focusedPanel, setFocusedPanel] = useState<StagePanelKey>('chat');

  const setPanelState = (panel: StagePanelKey, nextState: StagePanelState) => {
    setPanelStates((current) => {
      const nextStates = { ...current, [panel]: nextState };

      if (nextState === 'open') {
        setActiveMobilePanel(panel);
        setFocusedPanel(panel);
        return nextStates;
      }

      setActiveMobilePanel((currentActive) => {
        if (currentActive !== panel) return currentActive;
        return getNextOpenPanel(nextStates, panel) ?? currentActive;
      });

      setFocusedPanel((currentFocused) => {
        if (currentFocused !== panel) return currentFocused;
        return getNextOpenPanel(nextStates, panel) ?? currentFocused;
      });

      return nextStates;
    });
  };

  const togglePanel = (panel: StagePanelKey) => {
    setPanelState(panel, panelStates[panel] === 'open' ? 'minimized' : 'open');
  };

  const openPanels = useMemo(
    () =>
      (Object.entries(panelStates) as Array<[StagePanelKey, StagePanelState]>)
        .filter(([, state]) => state === 'open')
        .map(([key]) => key),
    [panelStates],
  );

  const minimizedPanels = useMemo(
    () =>
      (Object.entries(panelStates) as Array<[StagePanelKey, StagePanelState]>)
        .filter(([, state]) => state === 'minimized')
        .map(([key]) => key),
    [panelStates],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && ['1', '2', '3'].includes(event.key)) {
        const panel = ({ '1': 'chat', '2': 'decision', '3': 'cards' } as const)[event.key];
        if (!panel) return;
        event.preventDefault();
        setPanelState(panel, 'open');
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setPanelState(focusedPanel, 'minimized');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedPanel, panelStates]);

  return {
    panelStates,
    activeMobilePanel,
    focusedPanel,
    openPanels,
    minimizedPanels,
    setActiveMobilePanel,
    setFocusedPanel,
    setPanelState,
    togglePanel,
  };
}
