import type { Locale, User } from '@prisma/client';
import { prisma } from '../db/prisma';

export async function findByTelegramId(telegramId: bigint) {
  return prisma.user.findUnique({
    where: { telegramId },
    include: { pet: true },
  });
}

export async function findOrCreate(
  telegramId: bigint,
  _profile: { firstName?: string; lastName?: string }
): Promise<User & { pet: { id: number } | null }> {
  const existing = await prisma.user.findUnique({
    where: { telegramId },
    include: { pet: true },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: { telegramId, registrationStep: 'name' },
    include: { pet: true },
  });
}

export async function updateName(userId: number, name: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { name, registrationStep: 'role' },
  });
}

export async function updateLocale(userId: number, locale: Locale) {
  return prisma.user.update({ where: { id: userId }, data: { locale } });
}

export async function updateRole(userId: number, role: 'PARENT' | 'CHILD') {
  return prisma.user.update({
    where: { id: userId },
    data: { role, registrationStep: 'locale' },
  });
}

export async function advanceRegistrationStep(
  userId: number,
  step: 'name' | 'role' | 'locale' | 'pet' | 'done'
) {
  return prisma.user.update({
    where: { id: userId },
    data: { registrationStep: step },
    include: { pet: true },
  });
}

export async function completeRegistration(userId: number) {
  return advanceRegistrationStep(userId, 'done');
}

export async function listChildren() {
  return prisma.user.findMany({
    where: { role: 'CHILD' },
    orderBy: { name: 'asc' },
  });
}

export async function listParents() {
  return prisma.user.findMany({
    where: { role: { in: ['PARENT', 'ADMIN'] } },
    orderBy: { name: 'asc' },
  });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id }, include: { pet: true } });
}
