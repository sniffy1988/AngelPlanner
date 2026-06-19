import type { BotContext } from '../context';
import { findByTelegramId } from '../../services/userService';

export async function loadUser(ctx: BotContext, next: () => Promise<void>) {
  const from = ctx.from;
  if (!from) return next();
  const user = await findByTelegramId(BigInt(from.id));
  if (user) ctx.state.user = user;
  return next();
}

