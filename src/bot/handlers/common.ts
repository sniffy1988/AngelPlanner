import type { Telegraf } from 'telegraf';
import type { Locale } from '@prisma/client';
import {
  findOrCreate,
  updateName,
  updateLocale,
  updateRole,
  advanceRegistrationStep,
  completeRegistration,
} from '../../services/userService';
import * as petService from '../../services/petService';
import { isParentRole } from '../../roles';
import { mainMenuKeyboard, localeKeyboard, roleKeyboard } from '../keyboards/mainMenu';
import { t } from '../../i18n';
import type { BotContext } from '../context';

function isRegistering(user: { registrationStep: string }) {
  return user.registrationStep !== 'done';
}

async function finishRegistration(ctx: BotContext) {
  const user = ctx.state.user!;
  const updated = await completeRegistration(user.id);
  ctx.state.user = { ...user, ...updated, registrationStep: 'done' };
  await showMainMenu(ctx);
}

export async function showMainMenu(ctx: BotContext) {
  const user = ctx.state.user;
  if (!user) return;
  const welcomeKey = isParentRole(user.role) ? 'start.welcome_parent' : 'start.welcome';
  await ctx.reply(t(welcomeKey, user.locale, { name: user.name ?? t('app.child_name', user.locale) }), {
    reply_markup: mainMenuKeyboard(user.locale, user.role).reply_markup,
  });
}

async function promptRegistrationStep(ctx: BotContext): Promise<boolean> {
  const user = ctx.state.user;
  if (!user || !isRegistering(user)) return false;

  switch (user.registrationStep) {
    case 'name':
      ctx.session.awaiting = 'name';
      await ctx.reply(t('register.welcome', user.locale));
      await ctx.reply(t('register.ask_name', user.locale));
      return true;
    case 'role':
      ctx.session.awaiting = undefined;
      await ctx.reply(t('register.ask_role', user.locale), roleKeyboard(user.locale));
      return true;
    case 'locale':
      ctx.session.awaiting = undefined;
      await ctx.reply(t('register.ask_locale', user.locale), localeKeyboard());
      return true;
    case 'pet':
      ctx.session.awaiting = 'pet_name';
      await ctx.reply(t('pet.ask_name', user.locale));
      return true;
    default:
      return false;
  }
}

export function registerCommonHandlers(bot: Telegraf<BotContext>) {
  bot.start(async (ctx) => {
    const from = ctx.from!;
    const user = await findOrCreate(BigInt(from.id), {
      firstName: from.first_name,
      lastName: from.last_name,
    });
    ctx.state.user = user;

    if (await promptRegistrationStep(ctx)) return;

    if (user.role === 'CHILD' && !user.pet) {
      ctx.session.awaiting = 'pet_name';
      await ctx.reply(t('pet.ask_name', user.locale));
      return;
    }

    await showMainMenu(ctx);
  });

  bot.action(/^role:(PARENT|CHILD)$/, async (ctx) => {
    const user = ctx.state.user;
    if (!user || !isRegistering(user) || user.registrationStep !== 'role') return;
    const role = ctx.match[1] as 'PARENT' | 'CHILD';
    const updated = await updateRole(user.id, role);
    ctx.state.user = { ...user, role: updated.role, registrationStep: 'locale' };
    await ctx.answerCbQuery();
    const roleLabel = t(role === 'PARENT' ? 'register.role_parent' : 'register.role_child', user.locale);
    await ctx.editMessageText(t('register.role_confirmed', user.locale, { role: roleLabel }));
    await ctx.reply(t('register.ask_locale', user.locale), localeKeyboard());
  });

  bot.action(/^locale:(ua|ru|en)$/, async (ctx) => {
    const locale = ctx.match[1] as Locale;
    const user = ctx.state.user;
    if (!user) return;
    const updated = await updateLocale(user.id, locale);
    ctx.state.user = { ...user, locale: updated.locale };
    await ctx.answerCbQuery();
    await ctx.editMessageText(t('register.ask_locale', locale) + ` → ${locale.toUpperCase()}`);

    if (isRegistering(user) && user.registrationStep === 'locale') {
      if (ctx.state.user.role === 'CHILD') {
        const stepped = await advanceRegistrationStep(user.id, 'pet');
        ctx.state.user = { ...ctx.state.user, registrationStep: stepped.registrationStep };
        ctx.session.awaiting = 'pet_name';
        await ctx.reply(t('pet.ask_name', locale));
        return;
      }
      await finishRegistration(ctx);
      return;
    }

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
      const updated = await updateName(user.id, text);
      ctx.state.user = { ...user, name: text, registrationStep: updated.registrationStep };
      ctx.session.awaiting = undefined;
      await ctx.reply(t('register.ask_role', user.locale), roleKeyboard(user.locale));
      return;
    }

    if (ctx.session.awaiting === 'pet_name') {
      await petService.createPet(user.id, text || t('pet.default_name', user.locale));
      ctx.session.awaiting = undefined;
      if (isRegistering(user)) {
        await finishRegistration(ctx);
        return;
      }
      await showMainMenu(ctx);
      return;
    }

    if (ctx.session.awaiting === 'pet_rename') {
      await petService.rename(user.id, text);
      ctx.session.awaiting = undefined;
      await ctx.reply('OK', { reply_markup: mainMenuKeyboard(user.locale, user.role).reply_markup });
      return;
    }

    return next();
  });

  bot.action('nav:main', async (ctx) => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
  });
}
