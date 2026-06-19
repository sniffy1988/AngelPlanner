import type { Role } from '@prisma/client';

export function isParentRole(role: Role): boolean {
  return role === 'PARENT' || role === 'ADMIN';
}
