import type { Telegraf } from 'telegraf';
import { prisma } from '../db/prisma';
import { t } from '../i18n';
import type { BotContext } from '../bot/context';
import { petLevelUp } from './adminNotifyService';

type UserStats = {
  id: number;
  locale: import('@prisma/client').Locale;
  name: string | null;
  tasksCompletedCount: number;
  currentStreak: number;
  longestStreak: number;
  pointsBalance: number;
  pet: { level: number } | null;
};

export async function checkAll(
  bot: Telegraf<BotContext>,
  user: UserStats
): Promise<string[]> {
  const earned = await prisma.pointTransaction.aggregate({
    where: { userId: user.id, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  const totalEarned = earned._sum.amount ?? 0;
  const redeemCount = await prisma.pointTransaction.count({
    where: { userId: user.id, type: 'REDEEM_REWARD' },
  });

  const checks: { code: string; ok: boolean }[] = [
    { code: 'FIRST_TASK', ok: user.tasksCompletedCount >= 1 },
    { code: 'TASKS_10', ok: user.tasksCompletedCount >= 10 },
    { code: 'TASKS_50', ok: user.tasksCompletedCount >= 50 },
    { code: 'STREAK_3', ok: user.currentStreak >= 3 },
    { code: 'STREAK_7', ok: user.currentStreak >= 7 },
    { code: 'POINTS_100', ok: totalEarned >= 100 },
    { code: 'POINTS_500', ok: totalEarned >= 500 },
    { code: 'PET_LEVEL_5', ok: (user.pet?.level ?? 0) >= 5 },
    { code: 'PET_LEVEL_10', ok: (user.pet?.level ?? 0) >= 10 },
    { code: 'FIRST_REWARD', ok: redeemCount >= 1 },
  ];

  const unlockedTitles: string[] = [];

  for (const check of checks) {
    if (!check.ok) continue;
    const achievement = await prisma.achievement.findFirst({
      where: { code: check.code as import('@prisma/client').AchievementCode },
    });
    if (!achievement) continue;

    const exists = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId: user.id, achievementId: achievement.id },
      },
    });
    if (exists) continue;

    await prisma.userAchievement.create({
      data: { userId: user.id, achievementId: achievement.id },
    });

    const title = t(achievement.titleKey, user.locale);
    unlockedTitles.push(title);

    await bot.telegram
      .sendMessage(
        Number((await prisma.user.findUnique({ where: { id: user.id } }))!.telegramId),
        t('achievements.unlocked', user.locale, { title, emoji: achievement.emoji })
      )
      .catch(() => undefined);
  }

  return unlockedTitles;
}

export async function listForUser(userId: number) {
  const all = await prisma.achievement.findMany();
  const unlocked = await prisma.userAchievement.findMany({ where: { userId } });
  const set = new Set(unlocked.map((u) => u.achievementId));
  return all.map((a) => ({ ...a, unlocked: set.has(a.id) }));
}

export async function notifyPetLevel(
  bot: Telegraf<BotContext>,
  userId: number,
  level: number
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await petLevelUp(bot, user.name ?? 'Child', level);
}
