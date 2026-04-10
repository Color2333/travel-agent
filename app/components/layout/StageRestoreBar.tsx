'use client';

import type { LucideIcon } from 'lucide-react';
import { stage } from '@/lib/ui/stage';

interface RestoreItem {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface StageRestoreBarProps {
  items: RestoreItem[];
  className?: string;
  compact?: boolean;
}

export function StageRestoreBar({ items, className, compact = true }: StageRestoreBarProps) {
  if (items.length === 0) return null;

  return (
    <div className={stage.controlBar(className, compact)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          className={stage.toggleButton(false, '', compact ? 'sm' : 'md')}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
