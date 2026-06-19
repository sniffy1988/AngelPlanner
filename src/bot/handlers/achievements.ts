import fs from 'fs';
import type { Telegraf } from 'telegraf';
import { menuLabels, t, bar } from '../../i18n';
import * as petService from '../../services/petService';
import * as achievementService from '../../services/achievementService';
import * as pointsService from '../../services/pointsService';
import { achievementsMenu, petActions } from '../keyboards/achievements';
import { localeKeyboard } from '../keyboards/mainMenu';
import { config } from '../../config';
import type { BotContext } from '../context';

async function sendPetCard(ctx: BotContext) {
  const user = ctx.state.user!;
  const pet = await petService.getPet(user.id);
  if (!pet) {
    await ctx.reply('—');
    return;
  }
  const stageLabel = t(`pet.stage.${pet.stage}`, user.locale);
  const caption = [
    `${pet.name} · Lv.${pet.level} · ${stageLabel}`,
    `${t('pet.hunger', user.locale)}: ${bar(100 - pet.hunger)} ${100 - pet.hunger}%`,
    `${t('pet.happiness', user.locale)}: ${bar(pet.happiness)} ${pet.happiness}%`,
    `${t('pet.xp', user.locale)}: ${pet.xp % 50}/50`,
    '',
    t('pet.hint', user.locale),
  ].join('\n');

  const imagePath = petService.getPetImagePath(pet.stage, pet.happiness, pet.hunger);
  if (imagePath && fs.existsSync(imagePath)) {
    await ctx.replyWithPhoto({ source: imagePath }, { caption, ...petActions(user.locale, config.petFeedCost) });
  } else {
    await ctx.reply(caption, petActions(user.locale, config.petFeedCost));
  }
}

export function registerAchievementHandlers(bot: Telegraf<BotContext>) {
  bot.hears(menuLabels('menu.achievements'), async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    await ctx.reply('🏆', achievementsMenu(user.locale));
  });

  bot.hears(menuLabels('menu.language'), async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    await ctx.reply(t('register.ask_locale', user.locale), localeKeyboard());
  });

  bot.action('ach:menu', async (ctx) => {
    await ctx.answerCbQuery();
    const user = ctx.state.user!;
    await ctx.reply('🏆', achievementsMenu(user.locale));
  });

  bot.action('ach:pet', async (ctx) => {
    await ctx.answerCbQuery();
    await sendPetCard(ctx);
  });

  bot.action('ach:badges', async (ctx) => {
    await ctx.answerCbQuery();
    const user = ctx.state.user!;
    const list = await achievementService.listForUser(user.id);
    const text = list
      .map((a) => {
        const title = t(a.titleKey, user.locale);
        const icon = a.unlocked ? '✅' : '🔒';
        return `${icon} ${a.emoji} ${title}`;
      })
      .join('\n');
    await ctx.reply(text || '—', achievementsMenu(user.locale));
  });

  bot.action('ach:stats', async (ctx) => {
    await ctx.answerCbQuery();
    const user = ctx.state.user!;
    const earned = await pointsService.totalEarned(user.id);
    const list = await achievementService.listForUser(user.id);
    const unlocked = list.filter((a) => a.unlocked).length;
    const pet = await petService.getPet(user.id);
    await ctx.reply(
      t('achievements.stats', user.locale, {
        tasks: user.tasksCompletedCount,
        streak: user.currentStreak,
        best: user.longestStreak,
        earned,
        achievements: unlocked,
        total: list.length,
        petName: pet?.name ?? '—',
        level: pet?.level ?? 1,
      }),
      achievementsMenu(user.locale)
    );
  });

  bot.action('pet:feed', async (ctx) => {
    const user = ctx.state.user!;
    try {
      await petService.feed(user.id);
      await ctx.answerCbQuery('OK');
      await sendPetCard(ctx);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      await ctx.answerCbQuery(t(msg === 'INSUFFICIENT_POINTS' ? 'error.insufficient_points' : 'error.generic', user.locale));
    }
  });

  bot.action('pet:play', async (ctx) => {
    const user = ctx.state.user!;
    try {
      await petService.play(user.id);
      await ctx.answerCbQuery('OK');
      await sendPetCard(ctx);
    } catch (e) {
      await ctx.answerCbQuery(t('error.play_cooldown', user.locale));
    }
  });

  bot.action('pet:rename', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.awaiting = 'pet_rename';
    await ctx.reply(t('pet.ask_name', ctx.state.user!.locale));
  });
}
