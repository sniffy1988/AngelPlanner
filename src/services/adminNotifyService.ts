import type { Locale } from '@prisma/client';
import type { Telegraf } from 'telegraf';
import { t } from '../i18n';
import { listParentTelegramIdsForChild } from './relationService';
import type { BotContext } from '../bot/context';

export async function notifyParentsOfChild(
  bot: Telegraf<BotContext>,
  childId: number,
  key: string,
  params: Record<string, string | number>
) {
  const parents = await listParentTelegramIdsForChild(childId);
  await Promise.all(
    parents.map((parent) =>
      bot.telegram
        .sendMessage(Number(parent.telegramId), t(key, parent.locale, params))
        .catch(() => undefined)
    )
  );
}

export async function taskCompleted(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  taskTitle: string,
  points: number
) {
  await notifyParentsOfChild(bot, childId, 'admin.notify.taskDone', {
    child: childName,
    task: taskTitle,
    points,
  });
}

export async function childTaskCompleted(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  taskTitle: string
) {
  await notifyParentsOfChild(bot, childId, 'admin.notify.childTaskDone', {
    child: childName,
    task: taskTitle,
  });
}

export async function rewardRedeemed(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  rewardTitle: string,
  cost: number
) {
  await notifyParentsOfChild(bot, childId, 'admin.notify.rewardRedeemed', {
    child: childName,
    reward: rewardTitle,
    cost,
  });
}

export async function petLevelUp(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  level: number
) {
  await notifyParentsOfChild(bot, childId, 'admin.notify.petLevelUp', {
    child: childName,
    level,
  });
}
