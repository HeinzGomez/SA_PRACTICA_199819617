// HeinzGomez - Práctica 7: arranque del API Gateway (HTTP :8080)
import { createApp } from './app';
import { crearServicios } from './grpc-clients';

const app = createApp(crearServicios(), {
  origenesPermitidos: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,*.vercel.app').split(','),
  cupoStreamMs: Number(process.env.CUPO_STREAM_MS ?? 2000),
  limiteReservasPorMinuto: Number(process.env.RESERVAS_POR_MINUTO ?? 20),
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`api-gateway escuchando en :${port}`));
