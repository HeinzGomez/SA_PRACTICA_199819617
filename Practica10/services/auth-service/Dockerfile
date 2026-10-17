# HeinzGomez - Práctica 10: imagen de auth-service (build multi-stage). Contexto de build: raíz del repositorio.
FROM node:22-alpine AS build
WORKDIR /app
COPY services/auth-service/package.json services/auth-service/package-lock.json ./
RUN npm ci
COPY services/auth-service/tsconfig.json ./
COPY services/auth-service/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PUERTO=8091
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
# Liveness de Docker/Kubernetes: la imagen no trae curl; se usa el propio Node.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "dist/observabilidad/healthcheck.js"]
CMD ["node", "dist/app.js"]
