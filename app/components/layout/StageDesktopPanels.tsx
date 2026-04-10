'use client';

import type { ReactNode } from 'react';
import { StagePanel } from './StagePanel';
import type { StagePanelKey } from '@/lib/ui/use-stage-panels';

export interface DesktopStagePanel {
  key: StagePanelKey;
  title: string;
  subtitle: string;
  positionClass: string;
  bodyClass: string;
  content: ReactNode;
}

interface StageDesktopPanelsProps {
  panels: DesktopStagePanel[];
  openPanelKeys: StagePanelKey[];
  focusedPanel: StagePanelKey;
  onFocus: (key: StagePanelKey) => void;
  onMinimize: (key: StagePanelKey) => void;
}

export function StageDesktopPanels({
  panels,
  openPanelKeys,
  focusedPanel,
  onFocus,
  onMinimize,
}: StageDesktopPanelsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 hidden lg:block">
      {panels.map((panel) => (
        openPanelKeys.includes(panel.key) && (
          <StagePanel
            key={panel.key}
            onFocus={() => onFocus(panel.key)}
            className={panel.positionClass}
            bodyClassName={panel.bodyClass}
            focused={focusedPanel === panel.key}
            onMinimize={() => onMinimize(panel.key)}
            title={panel.title}
            subtitle={panel.subtitle}
          >
            {panel.content}
          </StagePanel>
        )
      ))}
    </div>
  );
}
