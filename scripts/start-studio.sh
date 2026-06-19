#!/bin/sh
set -e

DB_PATH="/app/data/angelplanner.db"
export DATABASE_URL="file:${DB_PATH}?connection_limit=1&socket_timeout=30"
export BROWSER=none

echo "Prisma Studio: waiting for database..."
i=0
while [ ! -f "$DB_PATH" ] && [ "$i" -lt 60 ]; do
  i=$((i + 1))
  sleep 2
done

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found, running migrations..."
  mkdir -p /app/data
  npx prisma migrate deploy
fi

echo "Starting Prisma Studio on 0.0.0.0:6666"
exec npx prisma studio --port 6666 --hostname 0.0.0.0 -b none
