'use client';

import type { ReactNode } from 'react';
import { Minus } from 'lucide-react';
import { stage } from '@/lib/ui/stage';

interface StagePanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  focused?: boolean;
  onFocus?: () => void;
  onMinimize?: () => void;
}

export function StagePanel({
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  focused,
  onFocus,
  onMinimize,
}: StagePanelProps) {
  return (
    <section
      onMouseDown={onFocus}
      className={stage.panelShell(focused, className)}
    >
      <div className={stage.panelHeader}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/90" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/56">{subtitle}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onMinimize}
          className={stage.actionCard('rounded-full p-2 text-white/70 hover:text-white')}
          aria-label={`Hide ${title}`}
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <div className={stage.panelBody(bodyClassName)}>{children}</div>
    </section>
  );
}
