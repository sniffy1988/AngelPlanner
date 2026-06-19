import { AchievementCode, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements: {
  code: AchievementCode;
  titleKey: string;
  descKey: string;
  emoji: string;
}[] = [
  { code: 'FIRST_TASK', titleKey: 'achievements.FIRST_TASK.title', descKey: 'achievements.FIRST_TASK.desc', emoji: '🎖' },
  { code: 'TASKS_10', titleKey: 'achievements.TASKS_10.title', descKey: 'achievements.TASKS_10.desc', emoji: '🎖' },
  { code: 'TASKS_50', titleKey: 'achievements.TASKS_50.title', descKey: 'achievements.TASKS_50.desc', emoji: '🏅' },
  { code: 'STREAK_3', titleKey: 'achievements.STREAK_3.title', descKey: 'achievements.STREAK_3.desc', emoji: '🔥' },
  { code: 'STREAK_7', titleKey: 'achievements.STREAK_7.title', descKey: 'achievements.STREAK_7.desc', emoji: '🔥' },
  { code: 'POINTS_100', titleKey: 'achievements.POINTS_100.title', descKey: 'achievements.POINTS_100.desc', emoji: '💰' },
  { code: 'POINTS_500', titleKey: 'achievements.POINTS_500.title', descKey: 'achievements.POINTS_500.desc', emoji: '💎' },
  { code: 'PET_LEVEL_5', titleKey: 'achievements.PET_LEVEL_5.title', descKey: 'achievements.PET_LEVEL_5.desc', emoji: '🐣' },
  { code: 'PET_LEVEL_10', titleKey: 'achievements.PET_LEVEL_10.title', descKey: 'achievements.PET_LEVEL_10.desc', emoji: '🐔' },
  { code: 'FIRST_REWARD', titleKey: 'achievements.FIRST_REWARD.title', descKey: 'achievements.FIRST_REWARD.desc', emoji: '🎁' },
];

async function main() {
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      create: a,
      update: { titleKey: a.titleKey, descKey: a.descKey, emoji: a.emoji },
    });
  }
  console.log('Seeded achievements:', achievements.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
