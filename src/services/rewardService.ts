import { prisma } from '../db/prisma';

export async function listActive() {
  return prisma.reward.findMany({ where: { isActive: true }, orderBy: { cost: 'asc' } });
}

export async function create(data: { title: string; description?: string; cost: number }) {
  return prisma.reward.create({ data });
}

export async function deactivate(id: number) {
  return prisma.reward.update({ where: { id }, data: { isActive: false } });
}

export async function get(id: number) {
  return prisma.reward.findUnique({ where: { id } });
}
