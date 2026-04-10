'use client';

import { CalendarDays, Command, MapPinned, PanelsTopLeft } from 'lucide-react';
import { stage } from '@/lib/ui/stage';
import { formatDateDisplay } from '@/lib/ai/date';
import type { StagePanelKey } from '@/lib/ui/use-stage-panels';

const PANEL_LABELS: Record<StagePanelKey, string> = {
  chat: '对话台',
  decision: '决策台',
  cards: '城市台',
};

interface StageStatusBarProps {
  focusedPanel: StagePanelKey;
  openCount: number;
  selectedCity?: string | null;
  originCity?: string | null;
  date?: string | null;
}

export function StageStatusBar({
  focusedPanel,
  openCount,
  selectedCity,
  originCity,
  date,
}: StageStatusBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[8.9rem] z-40 flex justify-center px-3 sm:px-4">
      <div className={stage.controlBar('flex max-w-[min(94vw,980px)] flex-wrap items-center justify-center gap-2 shadow-[0_18px_45px_rgba(15,23,42,0.14)]', false)}>
        <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/82')}>
          <PanelsTopLeft className="h-3.5 w-3.5" />
          <span>当前焦点 {PANEL_LABELS[focusedPanel]}</span>
        </div>

        <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/74')}>
          <span>{openCount} 个窗口打开中</span>
        </div>

        {originCity && (
          <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/82')}>
            <MapPinned className="h-3.5 w-3.5" />
            <span>{originCity} 出发</span>
          </div>
        )}

        {selectedCity && (
          <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/82')}>
            <span>当前城市 {selectedCity}</span>
          </div>
        )}

        {date && (
          <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/76')}>
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDateDisplay(date)}</span>
          </div>
        )}

        <div className="hidden items-center gap-2 lg:inline-flex">
          <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/64')}>
            <Command className="h-3.5 w-3.5" />
            <span>1 2 3 打开窗口</span>
          </div>
          <div className={stage.pill('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/64')}>
            <span>Esc 收起焦点窗口</span>
          </div>
        </div>
      </div>
    </div>
  );
}
