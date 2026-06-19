import type { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { t } from '../i18n';
import { listFamilyMembers } from './relationService';
import type { BotContext } from '../bot/context';

type NotifyOptions = {
  excludeUserIds?: number[];
  withTasksButton?: boolean;
};

async function notifyFamily(
  bot: Telegraf<BotContext>,
  childId: number,
  key: string,
  params: Record<string, string | number>,
  options: NotifyOptions = {}
) {
  const exclude = new Set(options.excludeUserIds ?? []);
  const members = await listFamilyMembers(childId);

  await Promise.all(
    members
      .filter((m) => !exclude.has(m.userId))
      .map((member) => {
        const text = t(key, member.locale, params);
        const extra = options.withTasksButton
          ? {
              reply_markup: Markup.inlineKeyboard([
                Markup.button.callback(t('menu.tasks', member.locale), 'nav:tasks'),
              ]).reply_markup,
            }
          : undefined;
        return bot.telegram
          .sendMessage(Number(member.telegramId), text, extra)
          .catch(() => undefined);
      })
  );
}

export async function taskCreated(
  bot: Telegraf<BotContext>,
  childId: number,
  creatorParentId: number,
  parentName: string,
  childName: string,
  taskTitle: string,
  points: number
) {
  await notifyFamily(
    bot,
    childId,
    'family.notify.taskAdded',
    { parent: parentName, child: childName, task: taskTitle, points },
    { excludeUserIds: [creatorParentId], withTasksButton: true }
  );
}

export async function taskCompleted(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  taskTitle: string,
  points: number
) {
  await notifyFamily(
    bot,
    childId,
    'family.notify.taskDone',
    { child: childName, task: taskTitle, points },
    { excludeUserIds: [childId] }
  );
}

export async function childTaskCompleted(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  taskTitle: string
) {
  await notifyFamily(
    bot,
    childId,
    'family.notify.childTaskDone',
    { child: childName, task: taskTitle },
    { excludeUserIds: [childId] }
  );
}

export async function rewardRedeemed(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  rewardTitle: string,
  cost: number
) {
  await notifyFamily(
    bot,
    childId,
    'family.notify.rewardRedeemed',
    { child: childName, reward: rewardTitle, cost },
    { excludeUserIds: [childId] }
  );
}

export async function petLevelUp(
  bot: Telegraf<BotContext>,
  childId: number,
  childName: string,
  level: number
) {
  await notifyFamily(bot, childId, 'family.notify.petLevelUp', { child: childName, level });
}
