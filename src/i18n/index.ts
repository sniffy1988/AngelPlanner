import type { Locale } from '@prisma/client';
import ua from './locales/ua.json';
import ru from './locales/ru.json';
import en from './locales/en.json';
import { config } from '../config';

const catalogs: Record<Locale, Record<string, string>> = { ua, ru, en };

export const ALL_LOCALES: Locale[] = ['ua', 'ru', 'en'];

export function t(
  key: string,
  locale: Locale = config.defaultLocale,
  params?: Record<string, string | number>
): string {
  const catalog = catalogs[locale] ?? catalogs[config.defaultLocale];
  let text = catalog[key] ?? catalogs.ua[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function menuLabels(key: string): string[] {
  return ALL_LOCALES.map((loc) => t(key, loc));
}

export function bar(value: number, max = 100, size = 10): string {
  const filled = Math.round((value / max) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}
