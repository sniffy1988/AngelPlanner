import { Markup } from 'telegraf';
import type { Locale, Role } from '@prisma/client';
import { isParentRole } from '../../roles';
import { t } from '../../i18n';

export function mainMenuKeyboard(locale: Locale, role: Role) {
  const rows: string[][] = [
    [t('menu.tasks', locale), t('menu.points', locale)],
    [t('menu.rewards', locale), t('menu.achievements', locale)],
    [t('menu.language', locale)],
  ];
  if (isParentRole(role)) {
    rows.push([t('menu.parent', locale)]);
  } else {
    rows.push([t('menu.family', locale)]);
  }
  return Markup.keyboard(rows).resize().persistent();
}

export function roleKeyboard(locale: Locale) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t('register.role_parent', locale), 'role:PARENT')],
    [Markup.button.callback(t('register.role_child', locale), 'role:CHILD')],
  ]);
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
