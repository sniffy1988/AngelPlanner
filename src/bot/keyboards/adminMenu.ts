import { Markup } from 'telegraf';
import type { Locale } from '@prisma/client';
import { t } from '../../i18n';

export function adminMenuKeyboard(locale: Locale) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t('admin.menu_add_task', locale), 'admin:add_task')],
    [Markup.button.callback(t('admin.menu_tasks', locale), 'admin:list_tasks')],
    [Markup.button.callback(t('admin.menu_children', locale), 'admin:children')],
    [Markup.button.callback(t('admin.menu_rewards', locale), 'admin:rewards')],
    [Markup.button.callback(t('admin.menu_users', locale), 'admin:users')],
    [Markup.button.callback(t('menu.main', locale), 'nav:main')],
  ]);
}
