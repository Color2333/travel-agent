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

const STORAGE_KEY = 'stage_workspace_layout_v1';

function getNextOpenPanel(states: PanelStateMap, excluded?: StagePanelKey) {
  return (Object.entries(states) as Array<[StagePanelKey, StagePanelState]>).find(
    ([key, state]) => key !== excluded && state === 'open',
  )?.[0];
}

function isPanelKey(value: unknown): value is StagePanelKey {
  return value === 'chat' || value === 'decision' || value === 'cards';
}

function isPanelState(value: unknown): value is StagePanelState {
  return value === 'open' || value === 'minimized';
}

function normalizePanelStates(value: unknown): PanelStateMap | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  const nextStates = { ...DEFAULT_PANEL_STATES };

  for (const key of Object.keys(nextStates) as StagePanelKey[]) {
    const nextValue = candidate[key];
    if (isPanelState(nextValue)) {
      nextStates[key] = nextValue;
    }
  }

  return nextStates;
}

function readStoredLayout() {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as {
      panelStates?: unknown;
      activeMobilePanel?: unknown;
      focusedPanel?: unknown;
    };

    return {
      panelStates: normalizePanelStates(parsed.panelStates),
      activeMobilePanel: isPanelKey(parsed.activeMobilePanel) ? parsed.activeMobilePanel : null,
      focusedPanel: isPanelKey(parsed.focusedPanel) ? parsed.focusedPanel : null,
    };
  } catch {
    return null;
  }
}

export function useStagePanels(initialState: PanelStateMap = DEFAULT_PANEL_STATES) {
  const [panelStates, setPanelStates] = useState<PanelStateMap>(initialState);
  const [activeMobilePanel, setActiveMobilePanel] = useState<StagePanelKey>('chat');
  const [focusedPanel, setFocusedPanel] = useState<StagePanelKey>('chat');

  useEffect(() => {
    const storedLayout = readStoredLayout();
    if (!storedLayout?.panelStates) return;

    const nextOpenPanel = getNextOpenPanel(storedLayout.panelStates) ?? 'chat';

    setPanelStates(storedLayout.panelStates);
    setActiveMobilePanel(storedLayout.activeMobilePanel ?? nextOpenPanel);
    setFocusedPanel(storedLayout.focusedPanel ?? nextOpenPanel);
  }, []);

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
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        panelStates,
        activeMobilePanel,
        focusedPanel,
      }),
    );
  }, [activeMobilePanel, focusedPanel, panelStates]);

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
