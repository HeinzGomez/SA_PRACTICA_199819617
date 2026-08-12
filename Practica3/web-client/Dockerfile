# Contexto de build: RAIZ del repo (ver docker-compose.*.yml)

# --- Etapa "dev": usada por docker-compose.local.yml (vite dev server) ---
FROM node:20-alpine AS dev
WORKDIR /app
COPY web-client/package*.json ./
RUN npm install
COPY web-client/ ./
EXPOSE 5173
CMD ["npm", "run", "dev"]

# --- Etapa "build": compila el bundle de produccion ---
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_GATEWAY_URL
ENV VITE_API_GATEWAY_URL=${VITE_API_GATEWAY_URL}
COPY web-client/package*.json ./
RUN npm install
COPY web-client/ ./
RUN npm run build

# --- Etapa "runtime": usada por docker-compose.cloud.yml (nginx) ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
