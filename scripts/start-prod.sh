#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/app/data/angelplanner.db}"
export BROWSER=none

mkdir -p /app/data

echo "Running migrations..."
npx prisma migrate deploy
npx prisma db seed

STUDIO_PORT="${STUDIO_PORT:-7777}"
echo "Starting Prisma Studio on 0.0.0.0:${STUDIO_PORT}"
npx prisma studio --port "${STUDIO_PORT}" --hostname 0.0.0.0 --browser none &
sleep 2

echo "Starting AngelPlanner bot..."
exec node dist/index.js
