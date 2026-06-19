import 'dotenv/config';
import type { Locale } from '@prisma/client';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

const defaultLocale = (process.env.DEFAULT_LOCALE ?? 'ua') as Locale;

export const config = {
  botToken: required('BOT_TOKEN'),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./data/angelplanner.db',
  tz: process.env.TZ ?? 'Europe/Kyiv',
  studioPort: Number(process.env.STUDIO_PORT ?? 7777),
  defaultLocale,
  stickerLevelUp: process.env.STICKER_LEVEL_UP || undefined,
  petFeedCost: 5,
  playCooldownHours: 4,
};

process.env.TZ = config.tz;
