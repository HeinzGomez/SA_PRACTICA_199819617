# NOTA: este Dockerfile se construye con el contexto en la RAIZ del repo
# (ver docker-compose.*.yml: build.context: . / dockerfile: api-gateway/Dockerfile)
# para poder incluir los contratos compartidos en /proto.

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm install
COPY api-gateway/tsconfig.json ./
COPY api-gateway/src ./src
COPY proto /proto
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY api-gateway/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /proto /proto

EXPOSE 8080
CMD ["node", "dist/index.js"]
