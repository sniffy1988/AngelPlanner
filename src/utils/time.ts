import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { config } from '../config';

export function nowKyiv(): Date {
  return new Date();
}

export function todayKyiv(): string {
  return formatInTimeZone(new Date(), config.tz, 'yyyy-MM-dd');
}

export function yesterdayKyiv(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatInTimeZone(d, config.tz, 'yyyy-MM-dd');
}

export function timeKyiv(date = new Date()): string {
  return formatInTimeZone(date, config.tz, 'HH:mm');
}

export function kyivWeekday(date = new Date()): number {
  const day = Number(formatInTimeZone(date, config.tz, 'i'));
  return day;
}

export function parseTimeOnDate(dateStr: string, time: string): Date {
  return fromZonedTime(`${dateStr}T${time}:00`, config.tz);
}

export function addDaysKyiv(days: number): string[] {
  const result: string[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    result.push(formatInTimeZone(d, config.tz, 'yyyy-MM-dd'));
  }
  return result;
}

export const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00',
];
