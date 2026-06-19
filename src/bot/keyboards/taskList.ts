import { Markup } from 'telegraf';
import type { Locale, User } from '@prisma/client';
import { t } from '../../i18n';

export function childrenFilterKeyboard(children: User[], locale: Locale) {
  return Markup.inlineKeyboard([
    ...children.map((c) => [
      Markup.button.callback(c.name ?? `#${c.id}`, `admin:tasks_child:${c.id}`),
    ]),
    [Markup.button.callback(t('menu.main', locale), 'nav:main')],
  ]);
}

export function taskAdminActions(taskId: number, locale: Locale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('⏸', `admin:task_off:${taskId}`),
      Markup.button.callback('🗑', `admin:task_del:${taskId}`),
    ],
  ]);
}

export function confirmDelete(taskId: number, locale: Locale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('common.yes_delete', locale), `admin:task_del_yes:${taskId}`),
      Markup.button.callback(t('common.no', locale), 'admin:list_tasks'),
    ],
  ]);
}
