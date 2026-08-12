# Contexto de build: RAIZ del repo (ver docker-compose.*.yml)
FROM node:20-alpine AS build
WORKDIR /app
COPY services/identity-service/package*.json ./
RUN npm install
COPY services/identity-service/tsconfig.json ./
COPY services/identity-service/src ./src
COPY proto /proto
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY services/identity-service/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /proto /proto

EXPOSE 50051
CMD ["node", "dist/index.js"]
