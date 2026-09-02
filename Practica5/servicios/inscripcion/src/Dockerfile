FROM node:20-alpine AS build

WORKDIR /app

COPY servicios/inscripcion/package.json servicios/inscripcion/tsconfig.json ./

RUN npm install

COPY servicios/inscripcion/src ./src
COPY contratos/inscripcion.proto ./contratos/inscripcion.proto

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY servicios/inscripcion/package.json ./
COPY --from=build /app/package-lock.json ./

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/contratos/inscripcion.proto ./contratos/inscripcion.proto

EXPOSE 50052 3002

CMD ["node", "dist/app.js"]
