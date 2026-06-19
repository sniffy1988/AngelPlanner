import type { Context } from 'telegraf';
import type { Locale, Role, User } from '@prisma/client';

export interface SessionData {
  wizard?: Record<string, unknown>;
  awaiting?: string;
  editTaskId?: number;
  redeemRewardId?: number;
}

export interface BotContext extends Context {
  session: SessionData;
  state: {
    user?: User & { role: Role; locale: Locale };
  };
}
