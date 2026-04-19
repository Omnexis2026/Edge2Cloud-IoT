FROM node:22-alpine AS iot_web
WORKDIR /web
COPY apps/iot-web/package.json apps/iot-web/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY apps/iot-web/ ./
RUN npm run build

FROM node:22-alpine AS deps
WORKDIR /app
COPY services/iot-api/package.json services/iot-api/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/iot-api/package.json services/iot-api/tsconfig.json services/iot-api/tsconfig.build.json ./
COPY services/iot-api/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=iot_web /web/dist ./public
USER node
EXPOSE 4010
CMD ["node", "dist/index.js"]
