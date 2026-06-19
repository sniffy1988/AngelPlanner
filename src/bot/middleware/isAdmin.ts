import { t } from '../../i18n';
import { isParentRole } from '../../roles';
import type { BotContext } from '../context';

export async function isParent(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.state.user || !isParentRole(ctx.state.user.role)) {
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
