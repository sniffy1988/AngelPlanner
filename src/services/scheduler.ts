import cron from 'node-cron';
import type { Telegraf } from 'telegraf';
import { config } from '../config';
import type { BotContext } from '../bot/context';
import { processNotifications, sendPetHungryNotifications } from './notificationService';
import * as petService from './petService';
import { resetRecurringTasks } from './taskService';

export function startScheduler(bot: Telegraf<BotContext>) {
  cron.schedule(
    '* * * * *',
    async () => {
      try {
        await processNotifications(bot);
      } catch (e) {
        console.error('Notification cron error:', e);
      }
    },
    { timezone: config.tz }
  );

  cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        await resetRecurringTasks();
      } catch (e) {
        console.error('Recurring reset cron error:', e);
      }
    },
    { timezone: config.tz }
  );

  cron.schedule(
    '0 */4 * * *',
    async () => {
      try {
        const hungry = await petService.applyDecay();
        await sendPetHungryNotifications(bot, hungry);
      } catch (e) {
        console.error('Pet decay cron error:', e);
      }
    },
    { timezone: config.tz }
  );

  console.log(`Scheduler started (${config.tz})`);
}
