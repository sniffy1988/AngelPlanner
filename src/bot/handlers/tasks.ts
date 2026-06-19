import type { Telegraf } from 'telegraf';
import { menuLabels, t } from '../../i18n';
import { listForAssignee } from '../../services/taskService';
import * as pointsService from '../../services/pointsService';
import { childTasksKeyboard } from '../keyboards/rewards';
import type { BotContext } from '../context';
import { showMainMenu } from './common';

export function registerTaskHandlers(bot: Telegraf<BotContext>) {
  bot.hears(menuLabels('menu.tasks'), async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    const tasks = await listForAssignee(user.id);
    if (!tasks.length) {
      await ctx.reply(t('task.list_empty', user.locale));
      return;
    }
    await ctx.reply(t('task.list_title', user.locale), childTasksKeyboard(tasks, user.locale));
  });

  bot.action('nav:tasks', async (ctx) => {
    await ctx.answerCbQuery();
    const user = ctx.state.user;
    if (!user) return;
    const tasks = await listForAssignee(user.id);
    await ctx.reply(
      tasks.length ? t('task.list_title', user.locale) : t('task.list_empty', user.locale),
      tasks.length ? childTasksKeyboard(tasks, user.locale) : undefined
    );
  });

  bot.action(/^done:task:(\d+)$/, async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    const taskId = Number(ctx.match[1]);
    try {
      const result = await pointsService.completeTask(bot, user.id, taskId);
      const mood =
        result.petResult.xpGain > 0 ? '😊' : '';
      await ctx.answerCbQuery();
      await ctx.reply(
        t('task.done', user.locale, {
          points: result.task.points,
          petName: result.petResult.petName ?? t('pet.default_name', user.locale),
          xp: result.petResult.xpGain,
          mood,
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ERR';
      const key =
        msg === 'NOT_OWNER'
          ? 'error.not_owner'
          : msg === 'ALREADY_DONE'
            ? 'error.already_done'
            : 'error.generic';
      await ctx.answerCbQuery(t(key, user.locale));
    }
  });
}
