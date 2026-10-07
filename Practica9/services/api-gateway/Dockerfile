# HeinzGomez - Práctica 7: imagen del API Gateway (build multi-stage). Contexto de build: raíz del repositorio.
FROM node:22-alpine AS build
WORKDIR /app
COPY services/api-gateway/package.json services/api-gateway/package-lock.json ./
RUN npm ci
COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PROTO_DIR=/app/proto PORT=8080
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY proto ./proto
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "dist/server.js"]
