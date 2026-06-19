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

## Portainer

Бот рассчитан на запуск как **Stack** в Portainer. База SQLite хранится в named volume `angelplanner-data`.

### 1. Подготовка

1. Создайте бота в [@BotFather](https://t.me/BotFather) и скопируйте `BOT_TOKEN`.
2. Убедитесь, что образ доступен: `ghcr.io/sniffy1988/angelplanner:latest`  
   Если пакет в GHCR приватный — в Portainer добавьте registry: **Settings → Registries → Add registry** (GitHub / `ghcr.io`, Personal Access Token с `read:packages`).

### 2. Создание стека

1. Portainer → **Stacks** → **Add stack**
2. Имя: `angelplanner`
3. Вставьте содержимое [`docker-compose.portainer.yml`](docker-compose.portainer.yml)
4. Внизу **Environment variables** добавьте:

| Name | Value |
|------|-------|
| `BOT_TOKEN` | токен от BotFather |

5. **Deploy the stack**

При первом старте контейнер сам применит миграции и засеет достижения.

### 3. Проверка

- **Containers** → `angelplanner-bot` → **Logs** — должно быть `AngelPlanner bot started`
- В Telegram: `/start` (родитель + ребёнок)

### 4. Назначить админа

Prisma Studio в контейнере не запущен (только бот). Варианты:

**A. Локально на своём ПК** (рекомендуется):

```bash
git clone https://github.com/sniffy1988/AngelPlanner.git
cd AngelPlanner
npm install
# Скопируйте БД с сервера:
docker cp angelplanner-bot:/app/data/angelplanner.db ./data/
DATABASE_URL="file:./data/angelplanner.db" npm run studio
```

Откройте http://localhost:6666 → у родителя `User.role` = `ADMIN`.

**B. Через Portainer Console** (если есть доступ к shell):

```bash
npx prisma studio --port 6666 --hostname 0.0.0.0
```

И пробросьте порт 6666 (временно, только для настройки).

### 5. Обновление

Portainer → Stack `angelplanner` → **Pull and redeploy**  
или **Recreate** контейнера — volume с БД сохранится.

### Важно

- Не удаляйте volume `angelplanner-data` — там SQLite с пользователями и задачами
- `BOT_TOKEN` храните только в Environment variables Portainer, не в git
- Часовой пояс уже задан: `Europe/Kyiv`

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
