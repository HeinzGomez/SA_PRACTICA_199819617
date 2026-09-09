FROM node:20-alpine AS build

WORKDIR /app

COPY api-gateway/package.json api-gateway/tsconfig.json ./

RUN npm install

COPY api-gateway/app.ts api-gateway/server.ts ./
COPY api-gateway/config ./config
COPY api-gateway/grpc ./grpc
COPY api-gateway/middleware ./middleware
COPY api-gateway/routes ./routes
COPY api-gateway/types ./types
COPY api-gateway/services ./services
COPY contratos/ ./contratos/

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY api-gateway/package.json ./
COPY --from=build /app/package-lock.json ./

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/contratos ./contratos

EXPOSE 4000

CMD ["node", "dist/server.js"]
