import type { Telegraf } from 'telegraf';
import { menuLabels, t } from '../../i18n';
import { listParentsForChild } from '../../services/relationService';
import type { BotContext } from '../context';

export function registerFamilyHandlers(bot: Telegraf<BotContext>) {
  bot.hears(menuLabels('menu.family'), async (ctx) => {
    const user = ctx.state.user;
    if (!user || user.role !== 'CHILD') return;

    const parents = await listParentsForChild(user.id);
    if (!parents.length) {
      await ctx.reply(t('family.no_parents', user.locale));
      return;
    }

    const lines = parents.map((p) => `👤 ${p.name ?? `#${p.id}`}`).join('\n');
    await ctx.reply(`${t('family.parents_title', user.locale)}\n\n${lines}`);
  });
}
