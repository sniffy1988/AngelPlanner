import type { Telegraf } from 'telegraf';
import type { Locale } from '@prisma/client';
import { findOrCreate, updateName, updateLocale } from '../../services/userService';
import * as petService from '../../services/petService';
import { mainMenuKeyboard, localeKeyboard } from '../keyboards/mainMenu';
import { t } from '../../i18n';
import type { BotContext } from '../context';

export async function showMainMenu(ctx: BotContext) {
  const user = ctx.state.user;
  if (!user) return;
  await ctx.reply(t('start.welcome', user.locale, { name: user.name ?? t('app.child_name', user.locale) }), {
    reply_markup: mainMenuKeyboard(user.locale, user.role === 'ADMIN').reply_markup,
  });
}

export function registerCommonHandlers(bot: Telegraf<BotContext>) {
  bot.start(async (ctx) => {
    const from = ctx.from!;
    let user = await findOrCreate(BigInt(from.id), {
      firstName: from.first_name,
      lastName: from.last_name,
    });
    ctx.state.user = user;

    if (!user.name) {
      ctx.session.awaiting = 'name';
      await ctx.reply(t('start.new', user.locale));
      await ctx.reply(t('register.ask_name', user.locale));
      return;
    }

    if (user.role === 'CHILD' && !user.pet) {
      ctx.session.awaiting = 'pet_name';
      await ctx.reply(t('pet.ask_name', user.locale));
      return;
    }

    await showMainMenu(ctx);
  });

  bot.action(/^locale:(ua|ru|en)$/, async (ctx) => {
    const locale = ctx.match[1] as Locale;
    const user = ctx.state.user;
    if (!user) return;
    const updated = await updateLocale(user.id, locale);
    ctx.state.user = { ...user, locale: updated.locale };
    await ctx.answerCbQuery();
    await ctx.editMessageText(t('register.ask_locale', locale) + ` → ${locale.toUpperCase()}`);

    if (user.role === 'CHILD' && !user.pet) {
      ctx.session.awaiting = 'pet_name';
      await ctx.reply(t('pet.ask_name', locale));
      return;
    }
    await showMainMenu(ctx);
  });

  bot.on('text', async (ctx, next) => {
    const user = ctx.state.user;
    if (!user || !ctx.session.awaiting) return next();

    const text = ctx.message.text.trim();
    if (ctx.session.awaiting === 'name') {
      await updateName(user.id, text);
      ctx.state.user = { ...user, name: text };
      ctx.session.awaiting = undefined;
      await ctx.reply(t('register.ask_locale', user.locale), localeKeyboard());
      return;
    }

    if (ctx.session.awaiting === 'pet_name') {
      await petService.createPet(user.id, text || t('pet.default_name', user.locale));
      ctx.session.awaiting = undefined;
      await showMainMenu(ctx);
      return;
    }

    if (ctx.session.awaiting === 'pet_rename') {
      await petService.rename(user.id, text);
      ctx.session.awaiting = undefined;
      await ctx.reply('OK', { reply_markup: mainMenuKeyboard(user.locale, user.role === 'ADMIN').reply_markup });
      return;
    }

    return next();
  });

  bot.action('nav:main', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });
}
