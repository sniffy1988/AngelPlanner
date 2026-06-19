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

export function linkChildKeyboard(children: User[], locale: Locale) {
  if (!children.length) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(t('admin.no_children_to_link', locale), 'admin:children')],
      [Markup.button.callback(t('menu.main', locale), 'nav:main')],
    ]);
  }
  return Markup.inlineKeyboard([
    ...children.map((c) => [
      Markup.button.callback(c.name ?? `#${c.id}`, `admin:link_child:${c.id}`),
    ]),
    [Markup.button.callback(t('common.cancel', locale), 'admin:children')],
  ]);
}

export function myChildrenKeyboard(children: User[], locale: Locale) {
  const rows = children.map((c) => [
    Markup.button.callback(c.name ?? `#${c.id}`, `admin:tasks_child:${c.id}`),
    Markup.button.callback('❌', `admin:unlink_child:${c.id}`),
  ]);
  rows.push([Markup.button.callback(t('admin.link_child_btn', locale), 'admin:link_child')]);
  rows.push([Markup.button.callback(t('menu.main', locale), 'nav:main')]);
  return Markup.inlineKeyboard(rows);
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

export function confirmUnlink(childId: number, locale: Locale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t('common.yes_delete', locale), `admin:unlink_yes:${childId}`),
      Markup.button.callback(t('common.no', locale), 'admin:children'),
    ],
  ]);
}
