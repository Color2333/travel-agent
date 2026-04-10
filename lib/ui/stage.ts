import { cva } from 'class-variance-authority';
import { cn } from './cn';

const panelSurface = cva('floating-stage-panel stage-panel-enter overflow-hidden rounded-[30px]', {
  variants: {
    layout: {
      floating: 'pointer-events-auto absolute',
      docked: 'pointer-events-auto',
      inline: '',
    },
    focus: {
      active: 'is-focused z-[46]',
      idle: 'z-[44]',
      none: '',
    },
  },
  defaultVariants: {
    layout: 'docked',
    focus: 'none',
  },
});

const subpanel = cva('stage-subpanel', {
  variants: {
    tone: {
      default: '',
      strong: 'bg-slate-900/[0.06] dark:bg-white/14',
      soft: 'bg-slate-900/[0.03] dark:bg-white/10',
    },
  },
  defaultVariants: {
    tone: 'default',
  },
});

const pill = cva('stage-pill', {
  variants: {
    emphasis: {
      default: '',
      strong: 'bg-slate-900/[0.08] panel-t1 dark:bg-white/16 dark:text-white',
      muted: 'panel-t3 dark:text-white/68',
    },
  },
  defaultVariants: {
    emphasis: 'default',
  },
});

const actionCard = cva(
  'rounded-2xl border border-slate-900/[0.10] bg-slate-900/[0.04] transition-colors hover:bg-slate-900/[0.08] dark:border-white/12 dark:bg-white/8 dark:hover:bg-white/14',
  {
    variants: {
      interactive: {
        true: 'hover:border-slate-900/[0.16] dark:hover:border-white/18',
        false: '',
      },
    },
    defaultVariants: {
      interactive: true,
    },
  }
);

const controlBar = cva('floating-stage-panel stage-panel-enter pointer-events-auto overflow-hidden rounded-full', {
  variants: {
    compact: {
      true: 'px-1.5 py-1.5',
      false: 'px-3 py-2',
    },
  },
  defaultVariants: {
    compact: true,
  },
});

const emptyState = cva('stage-subpanel flex flex-col items-center justify-center rounded-[26px] text-center', {
  variants: {
    size: {
      sm: 'h-40 px-4 py-5',
      md: 'h-48 px-5 py-6 sm:h-56',
      lg: 'h-64 px-6 py-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const toggleButton = cva('inline-flex items-center gap-2 rounded-full text-sm transition-colors', {
  variants: {
    active: {
      true: 'bg-slate-900/[0.09] panel-t1 dark:bg-white/22 dark:text-white',
      false: 'panel-t3 hover:bg-slate-900/[0.06] hover:panel-t1 dark:text-white/70 dark:hover:bg-white/12 dark:hover:text-white',
    },
    size: {
      sm: 'px-3 py-2',
      md: 'px-4 py-2',
    },
  },
  defaultVariants: {
    active: false,
    size: 'md',
  },
});

export const stage = {
  panelShell: (focused?: boolean, extra?: string) =>
    cn(panelSurface({ layout: 'floating', focus: focused ? 'active' : 'idle' }), extra),
  panelDock: (extra?: string) => cn(panelSurface({ layout: 'docked' }), extra),
  controlBar: (extra?: string, compact: boolean = true) => cn(controlBar({ compact }), extra),
  panelHeader: 'relative z-[1] flex items-center justify-between border-b border-[var(--panel-divider)] px-4 py-3',
  panelBody: (extra?: string) => cn('relative z-[1]', extra),
  subpanel: (extra?: string, tone: 'default' | 'strong' | 'soft' = 'default') => cn(subpanel({ tone }), extra),
  pill: (extra?: string, emphasis: 'default' | 'strong' | 'muted' = 'default') => cn(pill({ emphasis }), extra),
  actionCard: (extra?: string, interactive: boolean = true) => cn(actionCard({ interactive }), extra),
  emptyState: (extra?: string, size: 'sm' | 'md' | 'lg' = 'md') => cn(emptyState({ size }), extra),
  toggleButton: (active: boolean, extra?: string, size: 'sm' | 'md' = 'md') => cn(toggleButton({ active, size }), extra),
  mutedText: 'panel-t3',
  strongText: 'panel-t1',
};
