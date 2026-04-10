'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Minus } from 'lucide-react';
import { stage } from '@/lib/ui/stage';

interface DockItem {
  key: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

interface StageMobileDockProps {
  items: DockItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  onMinimize: (key: string) => void;
  children: ReactNode;
  hidden?: boolean;
}

export function StageMobileDock({
  items,
  activeKey,
  onSelect,
  onMinimize,
  children,
  hidden = false,
}: StageMobileDockProps) {
  const activeItem = items.find((item) => item.key === activeKey) ?? items[0];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 lg:hidden">
      <div className={stage.panelDock(`overflow-hidden rounded-[30px] ${hidden ? 'hidden' : ''}`)}>
        <div className="relative z-[1] border-b border-[var(--panel-divider)] px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium panel-t1">{activeItem?.label}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] panel-t3">{activeItem?.short}</div>
            </div>
            <button
              type="button"
              onClick={() => activeItem && onMinimize(activeItem.key)}
              className={stage.actionCard('rounded-full p-2 panel-t3 hover:panel-t1')}
              aria-label="Hide panel"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                className={stage.toggleButton(activeKey === item.key, '', 'sm')}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-[1] max-h-[56vh] min-h-[42vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
