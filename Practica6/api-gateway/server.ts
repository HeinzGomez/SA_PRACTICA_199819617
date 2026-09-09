import { createApp } from "./app";

const PORT = Number(process.env.GATEWAY_PORT ?? 4000);

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[API Gateway] Escuchando en el puerto ${PORT}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
