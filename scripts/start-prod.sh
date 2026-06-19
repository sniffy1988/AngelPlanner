#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/app/data/angelplanner.db?connection_limit=1&socket_timeout=30}"
export BROWSER=none

mkdir -p /app/data

echo "Running migrations..."
npx prisma migrate deploy
npx prisma db seed

echo "Starting Prisma Studio on 0.0.0.0:6666"
npx prisma studio -p 6666 -n 0.0.0.0 -b none &

echo "Starting AngelPlanner bot..."
exec node dist/index.js
