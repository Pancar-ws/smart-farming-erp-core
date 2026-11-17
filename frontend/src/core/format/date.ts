// src/core/format/date.ts
import { formatInTimeZone } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';

const TZ = 'Asia/Jakarta';

export const fmtDate = (v: string | Date | null | undefined): string => {
  if (!v) return '—';
  if (typeof v === 'string' && v.length === 10) {
    return format(parseISO(v), 'dd/MM/yyyy');
  }
  return formatInTimeZone(new Date(v), TZ, 'dd/MM/yyyy');
};

export const fmtDateTime = (v: string | Date | null | undefined): string => {
  if (!v) return '—';
  return formatInTimeZone(new Date(v), TZ, 'dd/MM/yyyy HH:mm');
};

export const todayIso = (): string => formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');

