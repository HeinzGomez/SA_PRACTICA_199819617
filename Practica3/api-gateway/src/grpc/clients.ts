import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { env } from "../config/env";

const PROTO_ROOT = process.env.PROTO_ROOT ?? path.resolve(__dirname, "../../../proto");

const loaderOptions: protoLoader.Options = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

function loadClient<T = any>(
  protoRelativePath: string,
  packageName: string,
  serviceName: string,
  target: string
): T {
  const packageDefinition = protoLoader.loadSync(path.join(PROTO_ROOT, protoRelativePath), loaderOptions);
  const proto = grpc.loadPackageDefinition(packageDefinition) as any;
  const ServiceCtor = packageName.split(".").reduce((acc, key) => acc[key], proto)[serviceName];
  return new ServiceCtor(target, grpc.credentials.createInsecure()) as T;
}

// Clientes gRPC hacia los microservicios de dominio (east-west traffic).
// El Gateway es el UNICO componente autorizado a hablar directamente con ellos.
export const identityClient = loadClient(
  "identity/identity.proto",
  "youssac.identity.v1",
  "IdentityService",
  env.grpc.identityUrl
);

export const contentClient = loadClient(
  "content/content.proto",
  "youssac.content.v1",
  "ContentService",
  env.grpc.contentUrl
);

export const analyticsClient = loadClient(
  "analytics/analytics.proto",
  "youssac.analytics.v1",
  "AnalyticsService",
  env.grpc.analyticsUrl
);

export function grpcCall<TRequest, TResponse>(
  client: any,
  method: string,
  request: TRequest
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    client[method](request, (err: grpc.ServiceError | null, response: TResponse) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}
