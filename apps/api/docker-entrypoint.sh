#!/bin/sh
set -e

# Apply committed migrations (prisma/migrations) to the database. Deterministic
# and idempotent — already-applied migrations are skipped, and it works on both
# a fresh volume and an existing one.
echo "Applying database migrations..."
npx prisma migrate deploy

# Seed demo data only on a fresh database. The seed no-ops when users already
# exist, so restarts/rebuilds never wipe real data (pass --force to override).
echo "Seeding database..."
npm run db:seed

echo "Starting API..."
exec node dist/main.js
