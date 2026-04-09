import { format, startOfDay } from 'date-fns';

// Returns the number of days until the target weekday (0=Sun, 1=Mon, ..., 6=Sat).
// Returns 0 if today is the target day, never returns negative.
function daysUntilWeekday(todayDay: number, targetDay: number): number {
  return (targetDay - todayDay + 7) % 7;
}

export function parseDateQuery(query: string, referenceDate: Date = new Date()): string {
  const today = startOfDay(referenceDate);

  const m = query.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (m) return m[1];

  const offset = (days: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return d;
  };

  const todayDay = today.getDay();

  const map: Record<string, () => Date> = {
    '今天':   () => offset(0),
    '明天':   () => offset(1),
    '后天':   () => offset(2),
    '大后天': () => offset(3),

    // "这周X" = this week's X; if today IS that day, return today
    '这周一': () => offset(daysUntilWeekday(todayDay, 1)),
    '这周二': () => offset(daysUntilWeekday(todayDay, 2)),
    '这周三': () => offset(daysUntilWeekday(todayDay, 3)),
    '这周四': () => offset(daysUntilWeekday(todayDay, 4)),
    '这周五': () => offset(daysUntilWeekday(todayDay, 5)),
    '这周六': () => offset(daysUntilWeekday(todayDay, 6)),
    '这周日': () => offset(daysUntilWeekday(todayDay, 0)),
    '本周六': () => offset(daysUntilWeekday(todayDay, 6)),
    '本周日': () => offset(daysUntilWeekday(todayDay, 0)),

    // "下周X" = always NEXT week's occurrence, even if today is that weekday
    '下周一': () => offset(daysUntilWeekday(todayDay, 1) || 7),
    '下周二': () => offset(daysUntilWeekday(todayDay, 2) || 7),
    '下周三': () => offset(daysUntilWeekday(todayDay, 3) || 7),
    '下周四': () => offset(daysUntilWeekday(todayDay, 4) || 7),
    '下周五': () => offset(daysUntilWeekday(todayDay, 5) || 7),
    '下周六': () => offset(daysUntilWeekday(todayDay, 6) + 7),
    '下周日': () => offset(daysUntilWeekday(todayDay, 0) + 7),

    // Shorthand aliases: next occurrence from tomorrow onwards
    '周六':   () => offset(daysUntilWeekday(todayDay, 6) || 7),
    '周日':   () => offset(daysUntilWeekday(todayDay, 0) || 7),
  };

  const resolver = map[query];
  if (resolver) return format(resolver(), 'yyyy-MM-dd');

  // Fallback: next Saturday (safest default for trip planning)
  return format(offset(daysUntilWeekday(todayDay, 6) || 7), 'yyyy-MM-dd');
}

export function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`;
}
