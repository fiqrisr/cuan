import type { DatePreset } from '../types';

export function getDateRangeForPreset(preset: DatePreset): { from?: string; to?: string } {
  const now = new Date();

  switch (preset) {
    case 'today': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case 'this_week': {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToMonday,
        0,
        0,
        0,
        0,
      );
      const sunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6,
        23,
        59,
        59,
        999,
      );
      return { from: monday.toISOString(), to: sunday.toISOString() };
    }
    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from: firstDay.toISOString(), to: lastDay.toISOString() };
    }
    case 'last_30_days': {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      from.setHours(0, 0, 0, 0);
      return { from: from.toISOString(), to: now.toISOString() };
    }
    default:
      return {};
  }
}
