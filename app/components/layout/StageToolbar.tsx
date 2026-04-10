'use client';

import type { LucideIcon } from 'lucide-react';
import { stage } from '@/lib/ui/stage';

interface ToolbarItem {
  key: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

interface StageToolbarProps {
  items: ToolbarItem[];
  className?: string;
}

export function StageToolbar({ items, className }: StageToolbarProps) {
  return (
    <div className={stage.controlBar(`inline-flex flex-wrap items-center gap-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)] ${className ?? ''}`)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className={stage.toggleButton(item.active)}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
