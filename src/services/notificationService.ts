import { addMinutes, isSameDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { config } from '../config';
import { t, menuLabels } from '../i18n';
import { listActiveForScheduler } from './taskService';
import { prisma } from '../db/prisma';
import { kyivWeekday, timeKyiv, todayKyiv } from '../utils/time';
import type { BotContext } from '../bot/context';

function sameKyivDay(a: Date | null | undefined, b = new Date()): boolean {
  if (!a) return false;
  return formatInTimeZone(a, config.tz, 'yyyy-MM-dd') === formatInTimeZone(b, config.tz, 'yyyy-MM-dd');
}

function timeMatches(now: Date, target: string): boolean {
  const current = timeKyiv(now);
  const [ch, cm] = current.split(':').map(Number);
  const [th, tm] = target.split(':').map(Number);
  const curMin = ch * 60 + cm;
  const tgtMin = th * 60 + tm;
  return Math.abs(curMin - tgtMin) <= 1;
}

function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m - minutes;
  const nh = Math.floor((total + 1440) % 1440 / 60);
  const nm = ((total % 1440) + 1440) % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export async function processNotifications(bot: Telegraf<BotContext>) {
  const tasks = await listActiveForScheduler();
  const now = new Date();

  for (const task of tasks) {
    const locale = task.assignee.locale;
    const chatId = Number(task.assignee.telegramId);

    if (task.recurrence === 'NONE' && task.dueAt) {
      if (task.remindBeforeMinutes && !task.lastEarlyNotifiedAt) {
        const earlyAt = addMinutes(task.dueAt, -task.remindBeforeMinutes);
        if (now >= earlyAt) {
          await sendEarly(bot, task.id, chatId, locale, task.title, task.points, task.remindBeforeMinutes);
          await prisma.task.update({
            where: { id: task.id },
            data: { lastEarlyNotifiedAt: now },
          });
        }
      }
      if (!task.lastNotifiedAt && now >= task.dueAt) {
        await sendDue(bot, task.id, chatId, locale, task.title, task.points);
        await prisma.task.update({
          where: { id: task.id },
          data: { lastNotifiedAt: now },
        });
      }
      continue;
    }

    if (!task.notifyTime) continue;
    const weekday = kyivWeekday(now);
    const weekOk =
      task.recurrence === 'DAILY' ||
      (task.recurrence === 'WEEKLY' && task.weekDays?.split(',').includes(String(weekday)));

    if (!weekOk) continue;

    if (task.remindBeforeMinutes) {
      const earlyTime = subtractMinutes(task.notifyTime, task.remindBeforeMinutes);
      if (timeMatches(now, earlyTime) && !sameKyivDay(task.lastEarlyNotifiedAt, now)) {
        await sendEarly(bot, task.id, chatId, locale, task.title, task.points, task.remindBeforeMinutes);
        await prisma.task.update({
          where: { id: task.id },
          data: { lastEarlyNotifiedAt: now },
        });
      }
    }

    if (timeMatches(now, task.notifyTime) && !sameKyivDay(task.lastNotifiedAt, now)) {
      await sendDue(bot, task.id, chatId, locale, task.title, task.points);
      await prisma.task.update({
        where: { id: task.id },
        data: { lastNotifiedAt: now },
      });
    }
  }
}

async function sendEarly(
  bot: Telegraf<BotContext>,
  taskId: number,
  chatId: number,
  locale: import('@prisma/client').Locale,
  title: string,
  points: number,
  minutes: number
) {
  const text = t('notify.early', locale, { n: minutes, title, points });
  await bot.telegram.sendMessage(chatId, text, {
    reply_markup: Markup.inlineKeyboard([
      Markup.button.callback(t('menu.tasks', locale), 'nav:tasks'),
    ]).reply_markup,
  });
  await prisma.notificationLog.create({
    data: { taskId, kind: 'EARLY', message: text },
  });
}

async function sendDue(
  bot: Telegraf<BotContext>,
  taskId: number,
  chatId: number,
  locale: import('@prisma/client').Locale,
  title: string,
  points: number
) {
  const text = t('notify.due', locale, { title, points });
  await bot.telegram.sendMessage(chatId, text, {
    reply_markup: Markup.inlineKeyboard([
      Markup.button.callback(t('task.done_btn', locale), `done:task:${taskId}`),
    ]).reply_markup,
  });
  await prisma.notificationLog.create({
    data: { taskId, kind: 'DUE', message: text },
  });
}

export async function sendPetHungryNotifications(
  bot: Telegraf<BotContext>,
  pets: { telegramId: bigint; name: string; locale: import('@prisma/client').Locale }[]
) {
  for (const p of pets) {
    const text = t('pet.hungry_notify', p.locale, { name: p.name });
    await bot.telegram
      .sendMessage(Number(p.telegramId), text, {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback(t('menu.tasks', p.locale), 'nav:tasks'),
        ]).reply_markup,
      })
      .catch(() => undefined);
  }
}
