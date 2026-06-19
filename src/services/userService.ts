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
  profile: { firstName?: string; lastName?: string }
): Promise<User & { pet: { id: number } | null }> {
  const existing = await prisma.user.findUnique({
    where: { telegramId },
    include: { pet: true },
  });
  if (existing) return existing;

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null;
  return prisma.user.create({
    data: { telegramId, name },
    include: { pet: true },
  });
}

export async function updateName(userId: number, name: string) {
  return prisma.user.update({ where: { id: userId }, data: { name } });
}

export async function updateLocale(userId: number, locale: Locale) {
  return prisma.user.update({ where: { id: userId }, data: { locale } });
}

export async function listChildren() {
  return prisma.user.findMany({
    where: { role: 'CHILD' },
    orderBy: { name: 'asc' },
  });
}

export async function listAdmins() {
  return prisma.user.findMany({ where: { role: 'ADMIN' } });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id }, include: { pet: true } });
}
