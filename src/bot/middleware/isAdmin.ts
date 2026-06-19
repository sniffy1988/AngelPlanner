import { t } from '../../i18n';
import type { BotContext } from '../context';

export async function isAdmin(ctx: BotContext, next: () => Promise<void>) {
  if (ctx.state.user?.role !== 'ADMIN') {
    const locale = ctx.state.user?.locale ?? 'ua';
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery(t('admin.access_denied', locale));
      return;
    }
    await ctx.reply(t('admin.access_denied', locale));
    return;
  }
  return next();
}
