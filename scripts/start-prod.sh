#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/app/data/angelplanner.db}"
export BROWSER=none

mkdir -p /app/data

echo "Running migrations..."
npx prisma migrate deploy
npx prisma db seed

echo "Starting Prisma Studio on 0.0.0.0:6666"
npx prisma studio --port 6666 --hostname 0.0.0.0 --browser none &
sleep 2

echo "Starting AngelPlanner bot..."
exec node dist/index.js
