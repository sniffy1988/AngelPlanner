import { Markup } from 'telegraf';
import type { Locale, User } from '@prisma/client';
import { t } from '../../i18n';
import { TIME_SLOTS, addDaysKyiv } from '../../utils/time';

export function pointsKeyboard(locale: Locale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('5', 'wiz:points:5'),
      Markup.button.callback('10', 'wiz:points:10'),
      Markup.button.callback('20', 'wiz:points:20'),
      Markup.button.callback('50', 'wiz:points:50'),
    ],
    [Markup.button.callback('✏️', 'wiz:points:custom')],
    [Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')],
  ]);
}

export function childrenKeyboard(children: User[], locale: Locale) {
  return Markup.inlineKeyboard([
    ...children.map((c) => [Markup.button.callback(c.name ?? `#${c.id}`, `wiz:child:${c.id}`)]),
    [Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')],
  ]);
}

export function recurrenceKeyboard(locale: Locale) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t('wizard.recur.none', locale), 'wiz:recur:NONE')],
    [Markup.button.callback(t('wizard.recur.daily', locale), 'wiz:recur:DAILY')],
    [Markup.button.callback(t('wizard.recur.weekly', locale), 'wiz:recur:WEEKLY')],
    [Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')],
  ]);
}

export function dateKeyboard(locale: Locale) {
  const days = addDaysKyiv(7);
  const rows = days.map((d) => [Markup.button.callback(d, `wiz:date:${d}`)]);
  rows.push([Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')]);
  return Markup.inlineKeyboard(rows);
}

export function timeKeyboard(locale: Locale) {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < TIME_SLOTS.length; i += 4) {
    rows.push(
      TIME_SLOTS.slice(i, i + 4).map((slot) => Markup.button.callback(slot, `wiz:time:${slot}`))
    );
  }
  rows.push([Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')]);
  return Markup.inlineKeyboard(rows);
}

export function weekdaysKeyboard(selected: number[], locale: Locale) {
  const days = [
    { n: 1, key: 'day.mon' },
    { n: 2, key: 'day.tue' },
    { n: 3, key: 'day.wed' },
    { n: 4, key: 'day.thu' },
    { n: 5, key: 'day.fri' },
    { n: 6, key: 'day.sat' },
    { n: 7, key: 'day.sun' },
  ];
  return Markup.inlineKeyboard([
    days.map((d) =>
      Markup.button.callback(
        `${selected.includes(d.n) ? '✅' : ''}${t(d.key, locale)}`,
        `wiz:wd:${d.n}`
      )
    ),
    [Markup.button.callback(t('wizard.weekdays_done', locale), 'wiz:wd:done')],
    [Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')],
  ]);
}

export function remindKeyboard(locale: Locale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('wizard.remind.none', locale), 'wiz:remind:0'),
      Markup.button.callback('5', 'wiz:remind:5'),
      Markup.button.callback('10', 'wiz:remind:10'),
    ],
    [
      Markup.button.callback('15', 'wiz:remind:15'),
      Markup.button.callback('30', 'wiz:remind:30'),
      Markup.button.callback('60', 'wiz:remind:60'),
    ],
    [Markup.button.callback(t('common.cancel', locale), 'wiz:cancel')],
  ]);
}

export function confirmTaskKeyboard(locale: Locale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('wizard.confirm', locale), 'wiz:confirm'),
      Markup.button.callback(t('common.cancel', locale), 'wiz:cancel'),
    ],
  ]);
}
