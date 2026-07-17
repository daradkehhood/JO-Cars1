#!/bin/sh
npx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "Migration skipped"
exec node server.js
