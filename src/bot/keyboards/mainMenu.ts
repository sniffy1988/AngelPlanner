import { Markup } from 'telegraf';
import type { Locale } from '@prisma/client';
import { t } from '../../i18n';

export function mainMenuKeyboard(locale: Locale, isAdmin: boolean) {
  const rows: string[][] = [
    [t('menu.tasks', locale), t('menu.points', locale)],
    [t('menu.rewards', locale), t('menu.achievements', locale)],
    [t('menu.language', locale)],
  ];
  if (isAdmin) {
    rows.push([t('menu.admin', locale)]);
  } else {
    rows.push([t('menu.family', locale)]);
  }
  return Markup.keyboard(rows).resize().persistent();
}

export function localeKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🇺🇦 UA', 'locale:ua'),
      Markup.button.callback('🇷🇺 RU', 'locale:ru'),
      Markup.button.callback('🇬🇧 EN', 'locale:en'),
    ],
  ]);
}

export function cancelInline(locale: Locale) {
  return Markup.inlineKeyboard([[Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')]]);
}

export function mainNavInline(locale: Locale) {
  return Markup.inlineKeyboard([[Markup.button.callback(t('menu.main', locale), 'nav:main')]]);
}
