import { createBot } from './bot/bot';
import { registerHandlers } from './bot/registerHandlers';
import { startScheduler } from './services/scheduler';
import { prisma } from './db/prisma';

async function main() {
  const bot = createBot();
  registerHandlers(bot);

  startScheduler(bot);

  await bot.launch();
  console.log('AngelPlanner bot started');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
