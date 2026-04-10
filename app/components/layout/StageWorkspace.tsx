'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { StageDesktopPanels, type DesktopStagePanel } from './StageDesktopPanels';
import { StageMobileDock } from './StageMobileDock';
import { StageRestoreBar } from './StageRestoreBar';
import { StageToolbar } from './StageToolbar';
import type { StagePanelKey, StagePanelState } from '@/lib/ui/use-stage-panels';

export interface StageWorkspaceItem {
  key: StagePanelKey;
  label: string;
  short: string;
  icon: LucideIcon;
}

interface StageWorkspaceProps {
  items: StageWorkspaceItem[];
  panels: DesktopStagePanel[];
  panelStates: Record<StagePanelKey, StagePanelState>;
  openPanelKeys: StagePanelKey[];
  minimizedPanelKeys: StagePanelKey[];
  focusedPanel: StagePanelKey;
  activeMobilePanel: StagePanelKey;
  onTogglePanel: (key: StagePanelKey) => void;
  onFocusPanel: (key: StagePanelKey) => void;
  onSetPanelState: (key: StagePanelKey, state: StagePanelState) => void;
  onSetActiveMobilePanel: (key: StagePanelKey) => void;
  mobileContent: ReactNode;
}

export function StageWorkspace({
  items,
  panels,
  panelStates,
  openPanelKeys,
  minimizedPanelKeys,
  focusedPanel,
  activeMobilePanel,
  onTogglePanel,
  onFocusPanel,
  onSetPanelState,
  onSetActiveMobilePanel,
  mobileContent,
}: StageWorkspaceProps) {
  const minimizedItems = items.filter((item) => minimizedPanelKeys.includes(item.key));
  const openMobileItems = items.filter((item) => openPanelKeys.includes(item.key));

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-[5.4rem] z-40 flex justify-center px-3 sm:px-4">
        <StageToolbar
          items={items.map((item) => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
            active: panelStates[item.key] === 'open',
            onClick: () => onTogglePanel(item.key),
          }))}
        />
      </div>

      <StageDesktopPanels
        panels={panels}
        openPanelKeys={openPanelKeys}
        focusedPanel={focusedPanel}
        onFocus={onFocusPanel}
        onMinimize={(key) => onSetPanelState(key, 'minimized')}
      />

      <StageMobileDock
        items={openMobileItems}
        activeKey={activeMobilePanel}
        onSelect={(key) => onSetActiveMobilePanel(key as StagePanelKey)}
        onMinimize={(key) => onSetPanelState(key as StagePanelKey, 'minimized')}
        hidden={openMobileItems.length === 0}
      >
        {mobileContent}
      </StageMobileDock>

      {openMobileItems.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 lg:hidden">
          <StageRestoreBar
            items={items.map((item) => ({
              key: item.key,
              label: item.label,
              icon: item.icon,
              onClick: () => onSetPanelState(item.key, 'open'),
            }))}
            className="flex items-center justify-center gap-2"
          />
        </div>
      )}
    </>
  );
}
