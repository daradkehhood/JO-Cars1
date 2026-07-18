#!/bin/sh
npx prisma db push --accept-data-loss --skip-generate
node server.js
