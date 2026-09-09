FROM node:20-alpine AS build

WORKDIR /app

COPY servicios/autenticacion/package.json servicios/autenticacion/tsconfig.json ./

RUN npm install

COPY servicios/autenticacion/src ./src
COPY contratos/autenticacion.proto ./contratos/autenticacion.proto

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY servicios/autenticacion/package.json ./
COPY --from=build /app/package-lock.json ./

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/contratos/autenticacion.proto ./contratos/autenticacion.proto

EXPOSE 50051 3001

CMD ["node", "dist/app.js"]
