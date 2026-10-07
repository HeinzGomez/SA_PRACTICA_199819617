# HeinzGomez - Práctica 9: imagen de auth-service (build multi-stage). Contexto de build: raíz del repositorio.
FROM node:22-alpine AS build
WORKDIR /app
COPY services/auth-service/package.json services/auth-service/package-lock.json ./
RUN npm ci
COPY services/auth-service/tsconfig.json ./
COPY services/auth-service/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/app.js"]
