'use client';

import type { ReactNode } from 'react';
import { Minus } from 'lucide-react';
import { stage } from '@/lib/ui/stage';

interface StagePanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  focused?: boolean;
  onFocus?: () => void;
  onMinimize?: () => void;
}

export function StagePanel({
  title,
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
      <div className="relative z-[1] flex items-center justify-between border-b border-[var(--panel-divider)] px-3.5 py-2.5">
        <span className="text-[13px] font-semibold panel-t1">{title}</span>
        <button
          type="button"
          onClick={onMinimize}
          className="rounded-full p-1.5 panel-t3 transition-colors hover:bg-slate-900/8 dark:hover:bg-white/10 hover:panel-t1"
          aria-label={`Hide ${title}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className={stage.panelBody(bodyClassName)}>{children}</div>
    </section>
  );
}
