# AngelPlanner

Telegram task planner bot for kids with points, rewards, tamagotchi pet, achievements, and reminders.

## Stack

- **Telegraf** + TypeScript
- **SQLite** + Prisma ORM
- **node-cron** (Europe/Kyiv timezone)
- **Prisma Studio** on http://localhost:6666

## Quick start

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.

2. Install dependencies and configure environment:

```bash
npm install
cp .env.example .env
# Edit .env — set BOT_TOKEN
mkdir -p data
npx prisma migrate dev
npm run db:seed
node scripts/generate-pet-assets.mjs
```

3. Run the bot and Prisma Studio (two terminals):

```bash
npm run dev
npm run studio
```

4. In Telegram: parent and child send `/start` to register.

5. Open http://localhost:6666 → set parent's `User.role` to `ADMIN`.

6. Send `/start` again → `⚙️ Админ` → create tasks and rewards.

## Environment

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Telegram bot token (required) |
| `DATABASE_URL` | SQLite path, default `file:./data/angelplanner.db` |
| `TZ` | Timezone, default `Europe/Kyiv` |
| `STUDIO_PORT` | Prisma Studio port, default `6666` |
| `DEFAULT_LOCALE` | Fallback locale: `ua`, `ru`, or `en` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start bot with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run production build |
| `npm run studio` | Prisma Studio at :6666 |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:seed` | Seed achievements |
| `npm run typecheck` | TypeScript check |

## Docker

```bash
docker compose build
docker compose up -d
docker compose logs -f bot
```

Image: `ghcr.io/sniffy1988/angelplanner:latest` (multi-arch: amd64 + arm64).

## Admin access

Admin role is assigned in Prisma Studio (`User.role = ADMIN`), not via environment variables.

## Features

- Button-based UI (only `/start` command)
- Tasks: one-time, daily, weekly with early reminders
- Points and rewards catalog
- Tamagotchi pet with stage images
- Achievements and streaks
- Multi-child support (`Task.assigneeId`)
- Parent push notifications on task completion and reward redemption
- i18n: Ukrainian, Russian, English

## License

MIT
