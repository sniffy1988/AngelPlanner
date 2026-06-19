import type { Locale } from '@prisma/client';
import type { Telegraf } from 'telegraf';
import { t } from '../i18n';
import { listAdmins } from './userService';
import type { BotContext } from '../bot/context';

export async function notifyAdmins(
  bot: Telegraf<BotContext>,
  key: string,
  params: Record<string, string | number>
) {
  const admins = await listAdmins();
  await Promise.all(
    admins.map((admin) =>
      bot.telegram
        .sendMessage(Number(admin.telegramId), t(key, admin.locale, params))
        .catch(() => undefined)
    )
  );
}

export async function taskCompleted(
  bot: Telegraf<BotContext>,
  childName: string,
  taskTitle: string,
  points: number
) {
  await notifyAdmins(bot, 'admin.notify.taskDone', {
    child: childName,
    task: taskTitle,
    points,
  });
}

export async function childTaskCompleted(
  bot: Telegraf<BotContext>,
  childName: string,
  taskTitle: string
) {
  await notifyAdmins(bot, 'admin.notify.childTaskDone', {
    child: childName,
    task: taskTitle,
  });
}

export async function rewardRedeemed(
  bot: Telegraf<BotContext>,
  childName: string,
  rewardTitle: string,
  cost: number
) {
  await notifyAdmins(bot, 'admin.notify.rewardRedeemed', {
    child: childName,
    reward: rewardTitle,
    cost,
  });
}

export async function petLevelUp(
  bot: Telegraf<BotContext>,
  childName: string,
  level: number
) {
  await notifyAdmins(bot, 'admin.notify.petLevelUp', { child: childName, level });
}
