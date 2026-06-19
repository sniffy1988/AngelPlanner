import { Telegraf, session } from 'telegraf';
import { config } from '../config';
import type { BotContext } from './context';
import { loadUser } from './middleware/loadUser';

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.botToken);
  bot.use(session({ defaultSession: () => ({}) }));
  bot.use(loadUser);
  return bot;
}
