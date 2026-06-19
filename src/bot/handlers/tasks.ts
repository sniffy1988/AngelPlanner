import type { Telegraf } from 'telegraf';
import { menuLabels, t } from '../../i18n';
import { createChildTask, listForAssignee } from '../../services/taskService';
import * as pointsService from '../../services/pointsService';
import { childTasksEmptyKeyboard, childTasksKeyboard } from '../keyboards/rewards';
import { cancelInline } from '../keyboards/mainMenu';
import type { BotContext } from '../context';

async function showTaskList(ctx: BotContext) {
  const user = ctx.state.user;
  if (!user) return;
  const tasks = await listForAssignee(user.id);
  if (!tasks.length) {
    await ctx.reply(t('task.list_empty', user.locale), childTasksEmptyKeyboard(user.locale));
    return;
  }
  await ctx.reply(t('task.list_title', user.locale), childTasksKeyboard(tasks, user.locale));
}

export function registerTaskHandlers(bot: Telegraf<BotContext>) {
  bot.hears(menuLabels('menu.tasks'), async (ctx) => {
    await showTaskList(ctx);
  });

  bot.action('nav:tasks', async (ctx) => {
    await ctx.answerCbQuery();
    await showTaskList(ctx);
  });

  bot.action('task:add', async (ctx) => {
    const user = ctx.state.user;
    if (!user || user.role !== 'CHILD') {
      await ctx.answerCbQuery();
      return;
    }
    ctx.session.awaiting = 'child_task_title';
    await ctx.answerCbQuery();
    await ctx.reply(t('task.add_title', user.locale), cancelInline(user.locale));
  });

  bot.action(/^done:task:(\d+)$/, async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    const taskId = Number(ctx.match[1]);
    try {
      const result = await pointsService.completeTask(bot, user.id, taskId);
      const mood = result.petResult.xpGain > 0 ? '😊' : '';
      await ctx.answerCbQuery();
      const key = result.task.points > 0 ? 'task.done' : 'task.done_no_points';
      await ctx.reply(
        t(key, user.locale, {
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

  bot.on('text', async (ctx, next) => {
    const user = ctx.state.user;
    const awaiting = ctx.session.awaiting;
    if (!user || user.role !== 'CHILD') return next();

    const text = ctx.message.text.trim();
    const locale = user.locale;

    if (awaiting === 'child_task_title') {
      if (!text) {
        await ctx.reply(t('task.add_title', locale));
        return;
      }
      ctx.session.wizard = { childTaskTitle: text };
      ctx.session.awaiting = 'child_task_desc';
      await ctx.reply(t('task.add_description', locale), cancelInline(locale));
      return;
    }

    if (awaiting === 'child_task_desc') {
      const title = (ctx.session.wizard as { childTaskTitle?: string })?.childTaskTitle;
      if (!title) {
        ctx.session.awaiting = undefined;
        return next();
      }
      const description = text === '-' ? null : text;
      await createChildTask(user.id, title, description);
      ctx.session.awaiting = undefined;
      ctx.session.wizard = {};
      await ctx.reply(t('task.add_created', locale));
      await showTaskList(ctx);
      return;
    }

    return next();
  });
}
