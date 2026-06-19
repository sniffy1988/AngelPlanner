# AngelPlanner

Персональный Telegram-планировщик задач для **Ангелины** — поинты, награды, тамагочи, достижения и напоминания.

## О боте

**AngelPlanner** — это бот-напарник для Ангелины: помогает следить за задачами, копить звёздочки и растить виртуального питомца. Родитель управляет задачами и наградами через админ-панель в Telegram и Prisma Studio.

### Текст для BotFather

| Поле | Текст |
|------|-------|
| **Name** | `AngelPlanner` |
| **Description** | `Планувальник задач для Ангелини 🌟` |
| **About** | `Задачі, поінти, вихованець і нагороди. Створено з любов'ю для Ангелини.` |
| **Commands** | `start - Головне меню` |

## Stack

- **Telegraf** + TypeScript
- **SQLite** + Prisma ORM
- **node-cron** (Europe/Kyiv timezone)
- **Prisma Studio** on http://localhost:7777

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

5. Open http://localhost:7777 → set parent's `User.role` to `ADMIN`.

6. В боте: `⚙️ Адмін` → `👨‍👧 Мої діти` → **Прив'язати дитину** (выбрать Ангелину).

7. Теперь родитель может добавлять задачи только своим привязанным детям.

6. Send `/start` again → `⚙️ Админ` → create tasks and rewards.

## Environment

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Telegram bot token (required) |
| `DATABASE_URL` | SQLite path, default `file:./data/angelplanner.db` |
| `TZ` | Timezone, default `Europe/Kyiv` |
| `STUDIO_PORT` | Prisma Studio port, default `7777` |
| `DEFAULT_LOCALE` | Fallback locale: `ua`, `ru`, or `en` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start bot with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run production build |
| `npm run studio` | Prisma Studio at :7777 |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:seed` | Seed achievements |
| `npm run typecheck` | TypeScript check |

## Docker

```bash
docker compose build
docker compose up -d
docker compose logs -f bot
# Prisma Studio: http://localhost:7777
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

### 4. Назначить админа (Prisma Studio)

### 4. Prisma Studio (порт 7777)

Один контейнер `angelplanner` (бот + Studio). Порт `7777:7777`.

1. Удалите старые контейнеры `angelplanner-*`
2. **Stacks** → Update stack → вставьте `docker-compose.portainer.yml`
3. **Pull and redeploy** (после сборки образа в GitHub Actions)
4. В Portainer у контейнера должно быть **Published Ports: 7777→7777**
5. Откройте http://`10.10.20.22`:7777

**Проверка на сервере (SSH):**
```bash
ss -tlnp | grep 7777          # порт слушается?
curl -I http://127.0.0.1:7777   # отвечает локально?
docker logs $(docker ps -qf name=app) --tail 20
```

В логах должно быть:
```
Starting Prisma Studio on 0.0.0.0:7777
Starting AngelPlanner bot...
```

### 5. Обновление

Portainer → Stack `angelplanner` → **Pull and redeploy**  
или **Recreate** контейнера — volume с БД сохранится.

### Важно

- Не удаляйте volume `angelplanner-data` — там SQLite с пользователями и задачами
- `BOT_TOKEN` храните только в Environment variables Portainer, не в git
- Часовой пояс уже задан: `Europe/Kyiv`

## Parent–child links

- Родитель (`role=ADMIN`) привязывает детей в боте: `⚙️ Адмін` → `👨‍👧 Мої діти` → `➕ Прив'язати дитину`
- У ребёнка в меню `👨‍👩‍👧 Родичі` — список привязанных родителей
- Родитель видит задачи, поинты и уведомления **только своих** детей
- Таблица `ParentChild` в Prisma Studio для ручного редактирования связей

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
