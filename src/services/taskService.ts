import type { RecurrenceType, Task } from '@prisma/client';
import { prisma } from '../db/prisma';
import { kyivWeekday, parseTimeOnDate } from '../utils/time';

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  points: number;
  assigneeId: number;
  recurrence: RecurrenceType;
  dueAt?: Date | null;
  notifyTime?: string | null;
  weekDays?: string | null;
  remindBeforeMinutes?: number | null;
};

export async function createTask(data: CreateTaskInput) {
  return prisma.task.create({ data });
}

export async function getTask(id: number) {
  return prisma.task.findUnique({
    where: { id },
    include: { assignee: true },
  });
}

export async function listForAssignee(assigneeId: number) {
  return prisma.task.findMany({
    where: {
      assigneeId,
      isActive: true,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listForChildFilter(assigneeId?: number) {
  return prisma.task.findMany({
    where: {
      ...(assigneeId ? { assigneeId } : {}),
      isActive: true,
    },
    include: { assignee: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deactivateTask(id: number) {
  return prisma.task.update({ where: { id }, data: { isActive: false } });
}

export async function deleteTask(id: number) {
  return prisma.task.delete({ where: { id } });
}

export async function listActiveForScheduler() {
  return prisma.task.findMany({
    where: { isActive: true, status: 'PENDING' },
    include: { assignee: true },
  });
}

export function buildDueAt(dateStr: string, time: string): Date {
  return parseTimeOnDate(dateStr, time);
}

export async function resetRecurringTasks() {
  await prisma.task.updateMany({
    where: { recurrence: 'DAILY', status: 'DONE', isActive: true },
    data: { status: 'PENDING', lastNotifiedAt: null, lastEarlyNotifiedAt: null },
  });

  const weekday = kyivWeekday();
  const weekly = await prisma.task.findMany({
    where: { recurrence: 'WEEKLY', status: 'DONE', isActive: true },
  });

  for (const task of weekly) {
    if (task.weekDays?.split(',').includes(String(weekday))) {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'PENDING', lastNotifiedAt: null, lastEarlyNotifiedAt: null },
      });
    }
  }
}

export type TaskWithAssignee = Task & {
  assignee: { id: number; telegramId: bigint; locale: import('@prisma/client').Locale; name: string | null };
};
