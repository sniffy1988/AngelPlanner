import type { Telegraf } from 'telegraf';
import type { RecurrenceType } from '@prisma/client';
import { menuLabels, t } from '../../i18n';
import {
  isParentOf,
  linkParentChild,
  listChildrenForParent,
  listUnlinkedChildrenForParent,
  unlinkParentChild,
} from '../../services/relationService';
import * as taskService from '../../services/taskService';
import * as rewardService from '../../services/rewardService';
import * as pointsService from '../../services/pointsService';
import * as adminNotify from '../../services/adminNotifyService';
import { adminMenuKeyboard } from '../keyboards/adminMenu';
import {
  childrenFilterKeyboard,
  confirmDelete,
  confirmUnlink,
  linkChildKeyboard,
  myChildrenKeyboard,
  taskAdminActions,
} from '../keyboards/taskList';
import {
  pointsKeyboard,
  childrenKeyboard,
  recurrenceKeyboard,
  dateKeyboard,
  timeKeyboard,
  weekdaysKeyboard,
  remindKeyboard,
  confirmTaskKeyboard,
} from '../keyboards/wizardSteps';
import { buildDueAt } from '../../services/taskService';
import type { BotContext } from '../context';

type WizardState = {
  title?: string;
  description?: string;
  points?: number;
  assigneeId?: number;
  recurrence?: RecurrenceType;
  date?: string;
  time?: string;
  weekDays?: number[];
  remindBeforeMinutes?: number | null;
};

function wiz(ctx: BotContext): WizardState {
  if (!ctx.session.wizard) ctx.session.wizard = {};
  return ctx.session.wizard as WizardState;
}

function parentId(ctx: BotContext): number {
  return ctx.state.user!.id;
}

async function myChildren(ctx: BotContext) {
  return listChildrenForParent(parentId(ctx));
}

async function ensureParentOf(ctx: BotContext, childId: number): Promise<boolean> {
  const ok = await isParentOf(parentId(ctx), childId);
  if (!ok) {
    await ctx.answerCbQuery(t('admin.not_your_child', ctx.state.user!.locale));
  }
  return ok;
}

async function ensureParentOfTask(ctx: BotContext, taskId: number): Promise<boolean> {
  const task = await taskService.getTask(taskId);
  if (!task) {
    await ctx.answerCbQuery('—');
    return false;
  }
  return ensureParentOf(ctx, task.assigneeId);
}

async function preview(ctx: BotContext) {
  const w = wiz(ctx);
  const locale = ctx.state.user!.locale;
  const child = (await myChildren(ctx)).find((c) => c.id === w.assigneeId);
  const type =
    w.recurrence === 'NONE'
      ? t('wizard.recur.none', locale)
      : w.recurrence === 'DAILY'
        ? t('wizard.recur.daily', locale)
        : t('wizard.recur.weekly', locale);
  const schedule =
    w.recurrence === 'NONE'
      ? `${w.date} ${w.time}`
      : w.recurrence === 'DAILY'
        ? w.time ?? ''
        : `${w.weekDays?.join(',')} ${w.time}`;
  const remind =
    w.remindBeforeMinutes && w.remindBeforeMinutes > 0
      ? `${w.remindBeforeMinutes} min`
      : t('wizard.remind.none', locale);
  return t('wizard.preview', locale, {
    title: w.title ?? '',
    description: w.description ?? '—',
    child: child?.name ?? '',
    points: w.points ?? 0,
    type,
    schedule,
    remind,
  });
}

async function promptLinkChildren(ctx: BotContext) {
  const locale = ctx.state.user!.locale;
  await ctx.reply(t('admin.no_linked_children', locale), {
    reply_markup: {
      inline_keyboard: [
        [{ text: t('admin.link_child_btn', locale), callback_data: 'admin:link_child' }],
        [{ text: t('menu.main', locale), callback_data: 'nav:main' }],
      ],
    },
  });
}

export function registerAdminHandlers(bot: Telegraf<BotContext>) {
  bot.hears(menuLabels('menu.admin'), async (ctx) => {
    const user = ctx.state.user;
    if (!user || user.role !== 'ADMIN') {
      await ctx.reply(t('admin.access_denied', user?.locale ?? 'ua'));
      return;
    }
    await ctx.reply(t('admin.title', user.locale), adminMenuKeyboard(user.locale));
  });

  bot.action('admin:children', async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    await ctx.answerCbQuery();
    const children = await myChildren(ctx);
    const locale = ctx.state.user.locale;
    if (!children.length) {
      await ctx.reply(t('admin.children_empty', locale), linkChildKeyboard([], locale));
      return;
    }
    await ctx.reply(t('admin.children_title', locale), myChildrenKeyboard(children, locale));
  });

  bot.action('admin:link_child', async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    await ctx.answerCbQuery();
    const unlinked = await listUnlinkedChildrenForParent(parentId(ctx));
    await ctx.reply(
      t('admin.link_child_prompt', ctx.state.user.locale),
      linkChildKeyboard(unlinked, ctx.state.user.locale)
    );
  });

  bot.action(/^admin:link_child:(\d+)$/, async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    const childId = Number(ctx.match[1]);
    const locale = ctx.state.user.locale;
    try {
      await linkParentChild(parentId(ctx), childId);
      const children = await myChildren(ctx);
      await ctx.answerCbQuery(t('admin.child_linked', locale));
      await ctx.reply(t('admin.children_title', locale), myChildrenKeyboard(children, locale));
    } catch {
      await ctx.answerCbQuery(t('error.generic', locale));
    }
  });

  bot.action(/^admin:unlink_child:(\d+)$/, async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    const childId = Number(ctx.match[1]);
    if (!(await ensureParentOf(ctx, childId))) return;
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(confirmUnlink(childId, ctx.state.user.locale).reply_markup);
  });

  bot.action(/^admin:unlink_yes:(\d+)$/, async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    const childId = Number(ctx.match[1]);
    if (!(await ensureParentOf(ctx, childId))) return;
    await unlinkParentChild(parentId(ctx), childId);
    const locale = ctx.state.user.locale;
    await ctx.answerCbQuery(t('admin.child_unlinked', locale));
    const children = await myChildren(ctx);
    await ctx.reply(
      children.length ? t('admin.children_title', locale) : t('admin.children_empty', locale),
      children.length ? myChildrenKeyboard(children, locale) : linkChildKeyboard([], locale)
    );
  });

  bot.action('admin:add_task', async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    const children = await myChildren(ctx);
    if (!children.length) {
      await ctx.answerCbQuery();
      await promptLinkChildren(ctx);
      return;
    }
    ctx.session.wizard = { weekDays: [] };
    ctx.session.awaiting = 'wiz_title';
    await ctx.answerCbQuery();
    await ctx.reply(t('wizard.title', ctx.state.user.locale));
  });

  bot.action('admin:list_tasks', async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    await ctx.answerCbQuery();
    const children = await myChildren(ctx);
    const locale = ctx.state.user.locale;
    if (!children.length) {
      await promptLinkChildren(ctx);
      return;
    }
    await ctx.reply(t('admin.select_child', locale), childrenFilterKeyboard(children, locale));
  });

  bot.action(/^admin:tasks_child:(\d+)$/, async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    const childId = Number(ctx.match[1]);
    if (!(await ensureParentOf(ctx, childId))) return;
    const tasks = await taskService.listForChildFilter(childId);
    await ctx.answerCbQuery();
    const locale = ctx.state.user.locale;
    for (const task of tasks.slice(0, 10)) {
      await ctx.reply(
        `#${task.id} ${task.title} → ${task.assignee.name} [${task.status}]`,
        taskAdminActions(task.id, locale)
      );
    }
    if (!tasks.length) await ctx.reply('—');
  });

  bot.action(/^admin:task_off:(\d+)$/, async (ctx) => {
    const taskId = Number(ctx.match[1]);
    if (!(await ensureParentOfTask(ctx, taskId))) return;
    await taskService.deactivateTask(taskId);
    await ctx.answerCbQuery('OK');
  });

  bot.action(/^admin:task_del:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[1]);
    if (!(await ensureParentOfTask(ctx, id))) return;
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(confirmDelete(id, ctx.state.user!.locale).reply_markup);
  });

  bot.action(/^admin:task_del_yes:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[1]);
    if (!(await ensureParentOfTask(ctx, id))) return;
    await taskService.deleteTask(id);
    await ctx.answerCbQuery('Deleted');
  });

  bot.action('admin:rewards', async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    await ctx.answerCbQuery();
    ctx.session.awaiting = 'reward_title';
    await ctx.reply(t('admin.reward_ask_title', ctx.state.user.locale));
  });

  bot.action('admin:users', async (ctx) => {
    if (ctx.state.user?.role !== 'ADMIN') return;
    const children = await myChildren(ctx);
    await ctx.answerCbQuery();
    const locale = ctx.state.user.locale;
    if (!children.length) {
      await promptLinkChildren(ctx);
      return;
    }
    for (const c of children) {
      await ctx.reply(`${c.name} — ${c.pointsBalance}⭐`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '+5', callback_data: `admin:pts:${c.id}:5` },
              { text: '+10', callback_data: `admin:pts:${c.id}:10` },
              { text: '-5', callback_data: `admin:pts:${c.id}:-5` },
            ],
          ],
        },
      });
    }
  });

  bot.action(/^admin:pts:(\d+):(-?\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    if (!(await ensureParentOf(ctx, userId))) return;
    const delta = Number(ctx.match[2]);
    await pointsService.adjustPoints(userId, delta, 'admin');
    await ctx.answerCbQuery('OK');
  });

  bot.action('wiz:cancel', async (ctx) => {
    ctx.session.wizard = {};
    ctx.session.awaiting = undefined;
    await ctx.answerCbQuery();
    await ctx.reply(t('common.cancel', ctx.state.user!.locale));
  });

  bot.action(/^wiz:points:(\d+|custom)$/, async (ctx) => {
    const locale = ctx.state.user!.locale;
    if (ctx.match[1] === 'custom') {
      ctx.session.awaiting = 'wiz_points';
      await ctx.answerCbQuery();
      await ctx.reply(t('wizard.points', locale));
      return;
    }
    wiz(ctx).points = Number(ctx.match[1]);
    const children = await myChildren(ctx);
    if (!children.length) {
      await ctx.answerCbQuery();
      await promptLinkChildren(ctx);
      return;
    }
    await ctx.answerCbQuery();
    await ctx.reply(t('admin.select_child', locale), childrenKeyboard(children, locale));
  });

  bot.action(/^wiz:child:(\d+)$/, async (ctx) => {
    const childId = Number(ctx.match[1]);
    if (!(await ensureParentOf(ctx, childId))) return;
    wiz(ctx).assigneeId = childId;
    await ctx.answerCbQuery();
    await ctx.reply(t('wizard.recurrence', ctx.state.user!.locale), recurrenceKeyboard(ctx.state.user!.locale));
  });

  bot.action(/^wiz:recur:(NONE|DAILY|WEEKLY)$/, async (ctx) => {
    const w = wiz(ctx);
    w.recurrence = ctx.match[1] as RecurrenceType;
    await ctx.answerCbQuery();
    const locale = ctx.state.user!.locale;
    if (w.recurrence === 'NONE') {
      await ctx.reply(t('wizard.date', locale), dateKeyboard(locale));
    } else if (w.recurrence === 'DAILY') {
      await ctx.reply(t('wizard.time', locale), timeKeyboard(locale));
    } else {
      await ctx.reply(t('wizard.weekdays', locale), weekdaysKeyboard(w.weekDays ?? [], locale));
    }
  });

  bot.action(/^wiz:date:(.+)$/, async (ctx) => {
    wiz(ctx).date = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply(t('wizard.time', ctx.state.user!.locale), timeKeyboard(ctx.state.user!.locale));
  });

  bot.action(/^wiz:time:(.+)$/, async (ctx) => {
    wiz(ctx).time = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply(t('wizard.remind', ctx.state.user!.locale), remindKeyboard(ctx.state.user!.locale));
  });

  bot.action(/^wiz:wd:(\d+|done)$/, async (ctx) => {
    const w = wiz(ctx);
    if (!w.weekDays) w.weekDays = [];
    if (ctx.match[1] === 'done') {
      await ctx.answerCbQuery();
      await ctx.reply(t('wizard.time', ctx.state.user!.locale), timeKeyboard(ctx.state.user!.locale));
      return;
    }
    const day = Number(ctx.match[1]);
    if (w.weekDays.includes(day)) w.weekDays = w.weekDays.filter((d) => d !== day);
    else w.weekDays.push(day);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(weekdaysKeyboard(w.weekDays, ctx.state.user!.locale).reply_markup);
  });

  bot.action(/^wiz:remind:(\d+)$/, async (ctx) => {
    const n = Number(ctx.match[1]);
    wiz(ctx).remindBeforeMinutes = n > 0 ? n : null;
    await ctx.answerCbQuery();
    const text = await preview(ctx);
    await ctx.reply(text, confirmTaskKeyboard(ctx.state.user!.locale));
  });

  bot.action('wiz:confirm', async (ctx) => {
    const w = wiz(ctx);
    const locale = ctx.state.user!.locale;
    if (!w.title || !w.points || !w.assigneeId || !w.recurrence) {
      await ctx.answerCbQuery('Incomplete');
      return;
    }
    if (!(await ensureParentOf(ctx, w.assigneeId))) return;

    let dueAt: Date | null = null;
    let notifyTime: string | null = null;
    let weekDays: string | null = null;

    if (w.recurrence === 'NONE' && w.date && w.time) {
      dueAt = buildDueAt(w.date, w.time);
    } else if (w.recurrence === 'DAILY') {
      notifyTime = w.time ?? null;
    } else if (w.recurrence === 'WEEKLY') {
      notifyTime = w.time ?? null;
      weekDays = (w.weekDays ?? []).join(',');
    }

    await taskService.createTask({
      title: w.title,
      description: w.description ?? null,
      points: w.points,
      assigneeId: w.assigneeId,
      recurrence: w.recurrence,
      dueAt,
      notifyTime,
      weekDays,
      remindBeforeMinutes: w.remindBeforeMinutes ?? null,
    });

    const parent = ctx.state.user!;
    const child = (await myChildren(ctx)).find((c) => c.id === w.assigneeId);
    await adminNotify.taskCreated(
      bot,
      w.assigneeId,
      parent.id,
      parent.name ?? 'Parent',
      child?.name ?? t('app.child_name', locale),
      w.title,
      w.points
    );

    ctx.session.wizard = {};
    await ctx.answerCbQuery();
    await ctx.reply(t('admin.task_created', locale));
  });

  bot.on('text', async (ctx, next) => {
    if (ctx.state.user?.role !== 'ADMIN') return next();
    const awaiting = ctx.session.awaiting;
    const w = wiz(ctx);
    const text = ctx.message.text.trim();
    const locale = ctx.state.user.locale;

    if (awaiting === 'wiz_title') {
      w.title = text;
      ctx.session.awaiting = 'wiz_desc';
      await ctx.reply(t('wizard.description', locale));
      return;
    }

    if (awaiting === 'wiz_desc') {
      w.description = text === '-' ? '' : text;
      ctx.session.awaiting = undefined;
      await ctx.reply(t('wizard.points', locale), pointsKeyboard(locale));
      return;
    }

    if (awaiting === 'wiz_points') {
      w.points = Number(text) || 10;
      ctx.session.awaiting = undefined;
      const children = await myChildren(ctx);
      if (!children.length) {
        await promptLinkChildren(ctx);
        return;
      }
      await ctx.reply(t('admin.select_child', locale), childrenKeyboard(children, locale));
      return;
    }

    if (awaiting === 'reward_title') {
      (ctx.session.wizard as Record<string, string>).rewardTitle = text;
      ctx.session.awaiting = 'reward_cost';
      await ctx.reply(t('admin.reward_ask_cost', locale));
      return;
    }

    if (awaiting === 'reward_cost') {
      const title = (ctx.session.wizard as { rewardTitle?: string }).rewardTitle ?? 'Reward';
      await rewardService.create({ title, cost: Number(text) || 10 });
      ctx.session.awaiting = undefined;
      await ctx.reply(t('admin.reward_created', locale));
      return;
    }

    return next();
  });
}
