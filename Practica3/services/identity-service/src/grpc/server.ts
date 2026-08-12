import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { identityHandlers } from "./handlers";
import { env } from "../config/env";

const PROTO_ROOT = process.env.PROTO_ROOT ?? path.resolve(__dirname, "../../../../proto");
const PROTO_PATH = path.join(PROTO_ROOT, "identity/identity.proto");

export function startGrpcServer() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition) as any;
  const server = new grpc.Server();

  server.addService(proto.youssac.identity.v1.IdentityService.service, identityHandlers as any);

  server.bindAsync(
    `0.0.0.0:${env.grpcPort}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error("[identity-service] Failed to bind gRPC server:", err);
        process.exit(1);
      }
      // eslint-disable-next-line no-console
      console.log(`[identity-service] gRPC server listening on port ${port}`);
    }
  );

  return server;
}
