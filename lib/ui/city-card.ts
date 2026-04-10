import { cva } from 'class-variance-authority';
import { cn } from './cn';

const cityCardShell = cva(
  'city-card-shell group relative w-full overflow-hidden rounded-[26px] text-left transition-all duration-300 ease-out',
  {
    variants: {
      state: {
        default: 'border-white/45 hover:border-white/70',
        highlighted: 'border-white/70 shadow-[0_18px_38px_rgba(59,130,246,0.12)]',
        active: 'border-sky-300 ring-2 ring-sky-300/80 ring-offset-2 ring-offset-white/30 shadow-[0_20px_44px_rgba(14,165,233,0.16)]',
      },
      clickable: {
        true: 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.12)]',
        false: '',
      },
    },
    defaultVariants: {
      state: 'default',
      clickable: true,
    },
  },
);

const cityCardBadge = cva(
  'flex items-center gap-1 rounded-full border border-white/60 bg-white/74 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-md',
  {
    variants: {
      tone: {
        default: '',
        active: 'bg-sky-50/90 text-sky-700',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  },
);

export const cityCard = {
  shell: ({
    isActive,
    isHighlighted,
    clickable = true,
    extra,
  }: {
    isActive?: boolean;
    isHighlighted?: boolean;
    clickable?: boolean;
    extra?: string;
  }) =>
    cn(
      cityCardShell({
        state: isActive ? 'active' : isHighlighted ? 'highlighted' : 'default',
        clickable,
      }),
      extra,
    ),
  badge: (tone: 'default' | 'active' = 'default', extra?: string) => cn(cityCardBadge({ tone }), extra),
};
