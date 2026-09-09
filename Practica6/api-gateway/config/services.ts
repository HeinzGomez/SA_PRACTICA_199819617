export const servicesConfig = {
  auth: {
    httpUrl: process.env.AUTH_SERVICE_HTTP_URL  ?? 'http://localhost:3001',
    grpcUrl: process.env.AUTH_SERVICE_GRPC_URL ?? 'localhost:50051',
  },
  inscripcion: {
    httpUrl: process.env.INS_SERVICE_HTTP_URL ?? 'http://localhost:3002',
    grpcUrl: process.env.INS_SERVICE_GRPC_URL ?? 'localhost:50052',
  },
  grabaciones: {
    httpUrl: process.env.GRAB_SERVICE_HTTP_URL ?? 'http://localhost:3003',
    grpcUrl: process.env.GRAB_SERVICE_GRPC_URL ?? 'localhost:50053',
  },
  analitica: {
    httpUrl: process.env.ANAL_SERVICE_HTTP_URL ?? 'http://localhost:3004',
    grpcUrl: process.env.ANAL_SERVICE_GRPC_URL ?? 'localhost:50054',
  },
  history: {
    httpUrl: process.env.HISTORY_SERVICE_HTTP_URL ?? 'http://localhost:3005',
    grpcUrl: process.env.HISTORY_SERVICE_GRPC_URL ?? 'localhost:50055',
  },
  notification:{
    httpUrl: process.env.NOTIFICATION_SERVICE_HTTP_URL ?? 'http://localhost:3006',
    grpcUrl: process.env.NOTIFICATION_SERVICE_GRPC_URL ?? 'localhost:50056',
  },
  resources:{
    httpUrl: process.env.RESOURCE_SERVICE_HTTP_URL ?? 'http://localhost:3007',
    grpcUrl: process.env.RESOURCE_SERVICE_GRPC_URL ?? 'localhost:50057',
  },
  frontend:{
    httpurl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    produccion: process.env.NODE_ENV ?? 'develop'
  }
};