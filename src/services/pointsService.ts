import type { Telegraf } from 'telegraf';
import { prisma } from '../db/prisma';
import { todayKyiv, yesterdayKyiv } from '../utils/time';
import * as petService from './petService';
import * as achievementService from './achievementService';
import * as adminNotify from './adminNotifyService';
import { getTask } from './taskService';
import type { BotContext } from '../bot/context';
import { t } from '../i18n';

function updateStreak(lastDate: string | null, current: number, longest: number) {
  const today = todayKyiv();
  if (lastDate === today) return { current, longest, lastDate: today };
  const yesterday = yesterdayKyiv();
  const next = lastDate === yesterday ? current + 1 : 1;
  return { current: next, longest: Math.max(longest, next), lastDate: today };
}

export async function completeTask(
  bot: Telegraf<BotContext>,
  userId: number,
  taskId: number
) {
  const task = await getTask(taskId);
  if (!task) throw new Error('NOT_FOUND');
  if (task.assigneeId !== userId) throw new Error('NOT_OWNER');
  if (task.status !== 'PENDING') throw new Error('ALREADY_DONE');

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { pet: true } });
  if (!user) throw new Error('NO_USER');

  const streak = updateStreak(user.lastTaskCompletedDate, user.currentStreak, user.longestStreak);
  const earnsPoints = task.points > 0;

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: { status: 'DONE' },
    }),
    ...(earnsPoints
      ? [
          prisma.pointTransaction.create({
            data: {
              userId,
              amount: task.points,
              type: 'EARN_TASK',
              taskId: task.id,
            },
          }),
        ]
      : []),
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(earnsPoints ? { pointsBalance: user.pointsBalance + task.points } : {}),
        tasksCompletedCount: user.tasksCompletedCount + 1,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastTaskCompletedDate: streak.lastDate,
      },
    }),
  ]);

  const petResult = await petService.onTaskComplete(userId, task.points);

  if (earnsPoints) {
    await adminNotify.taskCompleted(bot, userId, user.name ?? 'Child', task.title, task.points);
  } else {
    await adminNotify.childTaskCompleted(bot, userId, user.name ?? 'Child', task.title);
  }

  if (petResult.levelUp) {
    await achievementService.notifyPetLevel(bot, userId, petResult.newLevel);
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { pet: true },
  });

  if (updatedUser) {
    await achievementService.checkAll(bot, updatedUser);
  }

  return { task, petResult, balance: user.pointsBalance + (earnsPoints ? task.points : 0), locale: user.locale };
}

export async function redeemReward(
  bot: Telegraf<BotContext>,
  userId: number,
  rewardId: number
) {
  const [user, reward] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.reward.findUnique({ where: { id: rewardId } }),
  ]);
  if (!user || !reward || !reward.isActive) throw new Error('NOT_FOUND');
  if (user.pointsBalance < reward.cost) throw new Error('INSUFFICIENT_POINTS');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: user.pointsBalance - reward.cost },
    }),
    prisma.pointTransaction.create({
      data: {
        userId,
        amount: -reward.cost,
        type: 'REDEEM_REWARD',
        rewardId,
      },
    }),
  ]);

  await adminNotify.rewardRedeemed(bot, userId, user.name ?? 'Child', reward.title, reward.cost);

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { pet: true },
  });
  if (updated) await achievementService.checkAll(bot, updated);

  return { balance: user.pointsBalance - reward.cost, locale: user.locale };
}

export async function adjustPoints(userId: number, delta: number, note?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('NO_USER');
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: user.pointsBalance + delta },
    }),
    prisma.pointTransaction.create({
      data: { userId, amount: delta, type: 'ADMIN_ADJUST', note },
    }),
  ]);
}

export async function recentTransactions(userId: number, limit = 5) {
  return prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function totalEarned(userId: number) {
  const r = await prisma.pointTransaction.aggregate({
    where: { userId, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  return r._sum.amount ?? 0;
}
