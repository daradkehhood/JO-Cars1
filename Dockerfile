FROM node:20-bullseye-slim
WORKDIR /app
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --ignore-scripts --legacy-peer-deps
RUN npx prisma generate
COPY . .
RUN rm -rf tsconfig.tsbuildinfo .next
RUN echo "Bugatti build $(date)" > .buildstamp
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build
EXPOSE 8080
CMD ["node", "server.js"]
