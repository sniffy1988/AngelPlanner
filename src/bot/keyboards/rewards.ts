import { Markup } from 'telegraf';
import type { Locale, Reward } from '@prisma/client';
import { t } from '../../i18n';

function taskPointsLabel(points: number, locale: Locale): string {
  return points > 0 ? t('task.points', locale, { n: points }) : t('task.no_points', locale);
}

export function rewardsKeyboard(rewards: Reward[], balance: number, locale: Locale) {
  const rows = rewards.map((r) => {
    const can = balance >= r.cost;
    return [
      Markup.button.callback(
        can
          ? `${r.title} (${r.cost}⭐)`
          : `🔒 ${r.title}`,
        can ? `redeem:ask:${r.id}` : `redeem:locked:${r.id}`
      ),
    ];
  });
  rows.push([Markup.button.callback(t('menu.main', locale), 'nav:main')]);
  return Markup.inlineKeyboard(rows);
}

export function confirmRedeem(rewardId: number, locale: Locale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('common.confirm', locale), `redeem:yes:${rewardId}`),
      Markup.button.callback(t('common.cancel', locale), 'nav:rewards'),
    ],
  ]);
}

export function childTasksKeyboard(
  tasks: { id: number; title: string; points: number }[],
  locale: Locale
) {
  const rows = tasks.map((task) => [
    Markup.button.callback(
      `${task.title} ${taskPointsLabel(task.points, locale)}`,
      `done:task:${task.id}`
    ),
    Markup.button.callback(t('task.done_btn', locale), `done:task:${task.id}`),
  ]);
  rows.push([Markup.button.callback(t('task.add_btn', locale), 'task:add')]);
  rows.push([Markup.button.callback(t('menu.main', locale), 'nav:main')]);
  return Markup.inlineKeyboard(rows);
}

export function childTasksEmptyKeyboard(locale: Locale) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t('task.add_btn', locale), 'task:add')],
    [Markup.button.callback(t('menu.main', locale), 'nav:main')],
  ]);
}
