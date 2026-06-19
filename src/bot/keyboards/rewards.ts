import { Markup } from 'telegraf';
import type { Locale, Reward } from '@prisma/client';
import { t } from '../../i18n';

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
  return Markup.inlineKeyboard([
    ...tasks.map((task) => [
      Markup.button.callback(
        `${task.title} ${t('task.points', locale, { n: task.points })}`,
        `done:task:${task.id}`
      ),
      Markup.button.callback(t('task.done_btn', locale), `done:task:${task.id}`),
    ]),
    [Markup.button.callback(t('menu.main', locale), 'nav:main')],
  ]);
}
