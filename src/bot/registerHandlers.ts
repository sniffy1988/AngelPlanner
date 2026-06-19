import type { Telegraf } from 'telegraf';
import { registerCommonHandlers } from './handlers/common';
import { registerTaskHandlers } from './handlers/tasks';
import { registerPointsHandlers } from './handlers/points';
import { registerAchievementHandlers } from './handlers/achievements';
import { registerFamilyHandlers } from './handlers/family';
import { registerAdminHandlers } from './handlers/admin';
import type { BotContext } from './context';

export function registerHandlers(bot: Telegraf<BotContext>) {
  registerCommonHandlers(bot);
  registerTaskHandlers(bot);
  registerPointsHandlers(bot);
  registerAchievementHandlers(bot);
  registerFamilyHandlers(bot);
  registerAdminHandlers(bot);
}
