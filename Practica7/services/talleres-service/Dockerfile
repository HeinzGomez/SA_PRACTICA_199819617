# HeinzGomez - Práctica 7: imagen de talleres-service (build multi-stage). Contexto de build: raíz del repositorio.
FROM node:22-alpine AS build
WORKDIR /app
COPY services/talleres-service/package.json services/talleres-service/package-lock.json ./
RUN npm ci
COPY services/talleres-service/tsconfig.json ./
COPY services/talleres-service/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PROTO_PATH=/app/proto/talleres.proto GRPC_PORT=50052
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY proto ./proto
USER node
EXPOSE 50052
CMD ["node", "dist/server.js"]
