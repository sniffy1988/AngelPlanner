import type { Telegraf } from 'telegraf';
import { menuLabels, t } from '../../i18n';
import * as pointsService from '../../services/pointsService';
import * as rewardService from '../../services/rewardService';
import { rewardsKeyboard, confirmRedeem } from '../keyboards/rewards';
import { config } from '../../config';
import type { BotContext } from '../context';

export function registerPointsHandlers(bot: Telegraf<BotContext>) {
  bot.hears(menuLabels('menu.points'), async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    const txs = await pointsService.recentTransactions(user.id);
    const lines = txs.map((tx) =>
      t('points.history_item', user.locale, {
        sign: tx.amount > 0 ? '+' : '',
        amount: tx.amount,
        type: tx.type,
      })
    );
    const hint =
      user.role === 'CHILD'
        ? `\n\n${t('points.spend_hint', user.locale, { cost: config.petFeedCost })}`
        : '';
    await ctx.reply(
      `${t('points.balance', user.locale, { balance: user.pointsBalance })}${hint}\n\n${t('points.history', user.locale)}\n${lines.join('\n') || '—'}`
    );
  });

  bot.hears(menuLabels('menu.rewards'), async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    const rewards = await rewardService.listActive();
    await ctx.reply(
      t('reward.list_title', user.locale),
      rewardsKeyboard(rewards, user.pointsBalance, user.locale)
    );
  });

  bot.action('nav:rewards', async (ctx) => {
    await ctx.answerCbQuery();
    const user = ctx.state.user;
    if (!user) return;
    const rewards = await rewardService.listActive();
    await ctx.reply(t('reward.list_title', user.locale), rewardsKeyboard(rewards, user.pointsBalance, user.locale));
  });

  bot.action(/^redeem:ask:(\d+)$/, async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    const id = Number(ctx.match[1]);
    await ctx.answerCbQuery();
    await ctx.reply(t('reward.confirm_title', user.locale), confirmRedeem(id, user.locale));
  });

  bot.action(/^redeem:yes:(\d+)$/, async (ctx) => {
    const user = ctx.state.user;
    if (!user) return;
    const id = Number(ctx.match[1]);
    try {
      const r = await pointsService.redeemReward(bot, user.id, id);
      await ctx.answerCbQuery();
      await ctx.reply(t('reward.redeemed', user.locale, { balance: r.balance }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      await ctx.answerCbQuery(
        t(msg === 'INSUFFICIENT_POINTS' ? 'error.insufficient_points' : 'error.generic', user.locale)
      );
    }
  });

  bot.action(/^redeem:locked:/, async (ctx) => {
    const user = ctx.state.user;
    await ctx.answerCbQuery(t('error.insufficient_points', user?.locale ?? 'ua'));
  });
}
