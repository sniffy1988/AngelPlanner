import { Markup } from 'telegraf';
import type { Locale } from '@prisma/client';
import { t } from '../../i18n';

export function achievementsMenu(locale: Locale) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t('achievements.menu_pet', locale), 'ach:pet')],
    [Markup.button.callback(t('achievements.menu_badges', locale), 'ach:badges')],
    [Markup.button.callback(t('achievements.menu_stats', locale), 'ach:stats')],
    [Markup.button.callback(t('menu.main', locale), 'nav:main')],
  ]);
}

export function petActions(locale: Locale, feedCost: number) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('pet.feed', locale, { cost: feedCost }), 'pet:feed'),
      Markup.button.callback(t('pet.play', locale), 'pet:play'),
    ],
    [Markup.button.callback(t('pet.rename', locale), 'pet:rename')],
    [Markup.button.callback(t('common.back', locale), 'ach:menu')],
  ]);
}
