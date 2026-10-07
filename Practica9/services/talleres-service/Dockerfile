# HeinzGomez - Práctica 9: imagen de talleres-service (build multi-stage). Contexto de build: raíz del repositorio.
FROM node:22-alpine AS build
WORKDIR /app
COPY services/talleres-service/package.json services/talleres-service/package-lock.json ./
RUN npm ci
COPY services/talleres-service/tsconfig.json ./
COPY services/talleres-service/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/app.js"]
