import { prisma } from '../db/prisma';

export async function linkParentChild(parentId: number, childId: number) {
  if (parentId === childId) throw new Error('SAME_USER');
  const [parent, child] = await Promise.all([
    prisma.user.findUnique({ where: { id: parentId } }),
    prisma.user.findUnique({ where: { id: childId } }),
  ]);
  if (!parent || parent.role !== 'ADMIN') throw new Error('NOT_PARENT');
  if (!child || child.role !== 'CHILD') throw new Error('NOT_CHILD');

  return prisma.parentChild.upsert({
    where: { parentId_childId: { parentId, childId } },
    create: { parentId, childId },
    update: {},
  });
}

export async function unlinkParentChild(parentId: number, childId: number) {
  return prisma.parentChild.delete({
    where: { parentId_childId: { parentId, childId } },
  });
}

export async function isParentOf(parentId: number, childId: number) {
  const link = await prisma.parentChild.findUnique({
    where: { parentId_childId: { parentId, childId } },
  });
  return !!link;
}

export async function listChildrenForParent(parentId: number) {
  const links = await prisma.parentChild.findMany({
    where: { parentId },
    include: { child: true },
    orderBy: { child: { name: 'asc' } },
  });
  return links.map((l) => l.child);
}

export async function listParentsForChild(childId: number) {
  const links = await prisma.parentChild.findMany({
    where: { childId },
    include: { parent: true },
    orderBy: { parent: { name: 'asc' } },
  });
  return links.map((l) => l.parent);
}

export async function listUnlinkedChildrenForParent(parentId: number) {
  const linked = await prisma.parentChild.findMany({
    where: { parentId },
    select: { childId: true },
  });
  const linkedIds = linked.map((l) => l.childId);
  return prisma.user.findMany({
    where: {
      role: 'CHILD',
      ...(linkedIds.length ? { id: { notIn: linkedIds } } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

export async function listParentTelegramIdsForChild(childId: number) {
  const parents = await listParentsForChild(childId);
  return parents.map((p) => ({ telegramId: p.telegramId, locale: p.locale }));
}
