import path from 'path';
import fs from 'fs';
import { PetStage } from '@prisma/client';
import { prisma } from '../db/prisma';
import { config } from '../config';

const XP_PER_LEVEL = 50;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function stageFromLevel(level: number): PetStage {
  if (level >= 10) return 'ADULT';
  if (level >= 6) return 'TEEN';
  if (level >= 3) return 'BABY';
  return 'EGG';
}

export function getPetImagePath(stage: PetStage, happiness: number, hunger: number): string | null {
  const assetsDir = path.join(process.cwd(), 'assets', 'pets');
  const sad = happiness < 40 || hunger > 80;
  let file: string;
  if (stage === 'EGG') file = 'egg.png';
  else if (stage === 'BABY') file = sad ? 'baby_sad.png' : 'baby_happy.png';
  else if (stage === 'TEEN') file = sad ? 'teen_sad.png' : 'teen_happy.png';
  else file = sad ? 'adult_sad.png' : 'adult_happy.png';
  const full = path.join(assetsDir, file);
  return fs.existsSync(full) ? full : null;
}

export async function createPet(userId: number, name: string) {
  return prisma.pet.create({
    data: { userId, name: name || 'Пушок' },
  });
}

export async function getPet(userId: number) {
  return prisma.pet.findUnique({ where: { userId } });
}

export async function onTaskComplete(userId: number, taskPoints: number) {
  const pet = await prisma.pet.findUnique({ where: { userId } });
  if (!pet || taskPoints <= 0) {
    return { xpGain: 0, levelUp: false, newLevel: pet?.level ?? 1, petName: pet?.name };
  }

  const xpGain = Math.max(taskPoints, 5);
  const newXp = pet.xp + xpGain;
  const newLevel = levelFromXp(newXp);
  const newStage = stageFromLevel(newLevel);
  const levelUp = newLevel > pet.level;

  await prisma.pet.update({
    where: { id: pet.id },
    data: {
      xp: newXp,
      level: newLevel,
      stage: newStage,
      happiness: Math.min(100, pet.happiness + 15),
      hunger: Math.max(0, pet.hunger - 20),
    },
  });

  return { xpGain, levelUp, newLevel, petName: pet.name, stage: newStage };
}

export async function feed(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const pet = await prisma.pet.findUnique({ where: { userId } });
  if (!user || !pet) throw new Error('NO_PET');
  if (user.pointsBalance < config.petFeedCost) throw new Error('INSUFFICIENT_POINTS');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: user.pointsBalance - config.petFeedCost },
    }),
    prisma.pointTransaction.create({
      data: {
        userId,
        amount: -config.petFeedCost,
        type: 'ADMIN_ADJUST',
        note: 'pet_feed',
      },
    }),
    prisma.pet.update({
      where: { id: pet.id },
      data: { hunger: Math.max(0, pet.hunger - 30) },
    }),
  ]);
}

export async function play(userId: number) {
  const pet = await prisma.pet.findUnique({ where: { userId } });
  if (!pet) throw new Error('NO_PET');
  if (pet.lastPlayedAt) {
    const hours = (Date.now() - pet.lastPlayedAt.getTime()) / 3600000;
    if (hours < config.playCooldownHours) throw new Error('PLAY_COOLDOWN');
  }
  await prisma.pet.update({
    where: { id: pet.id },
    data: {
      happiness: Math.min(100, pet.happiness + 20),
      lastPlayedAt: new Date(),
    },
  });
}

export async function rename(userId: number, name: string) {
  return prisma.pet.update({ where: { userId }, data: { name } });
}

export async function applyDecay() {
  const pets = await prisma.pet.findMany({ include: { user: true } });
  const hungry: { telegramId: bigint; name: string; locale: import('@prisma/client').Locale }[] = [];

  for (const pet of pets) {
    const hunger = Math.min(100, pet.hunger + 10);
    let happiness = pet.happiness;
    if (hunger > 60) happiness = Math.max(0, happiness - 5);

    await prisma.pet.update({
      where: { id: pet.id },
      data: { hunger, happiness, lastDecayAt: new Date() },
    });

    if (hunger > 80 && happiness < 30) {
      hungry.push({
        telegramId: pet.user.telegramId,
        name: pet.name,
        locale: pet.user.locale,
      });
    }
  }

  return hungry;
}
