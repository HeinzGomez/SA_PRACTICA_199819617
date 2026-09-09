import fs from "fs";
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

export type GrpcUnaryMethod = (
  request: unknown,
  callback: (error: grpc.ServiceError | null, response: unknown) => void
) => grpc.ClientUnaryCall;

export type ServiceConstructor = new (
  address: string,
  credentials: grpc.ChannelCredentials
) => grpc.Client;

const protoLoaderOptions: protoLoader.Options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

function resolveProtoPath(protoFile: string): string {
  let dir = __dirname;
  while (dir !== path.parse(dir).root) {
    const candidate = path.join(dir, "contratos", protoFile);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`No se encontró 'contratos/${protoFile}'`);
}

export class GrpcBaseClient {
  protected readonly client: grpc.Client;

  constructor(protoFile: string, url: string) {
    const packageDefinition = protoLoader.loadSync(
      resolveProtoPath(protoFile),
      protoLoaderOptions
    );
    const grpcObject = grpc.loadPackageDefinition(packageDefinition);
    const service = this.resolveService(grpcObject);
    this.client = new service(url, grpc.credentials.createInsecure());
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    throw new Error("resolveService debe implementarse en la subclase");
  }

  protected unary<T>(method: string, request: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const invoke = (this.client as unknown as Record<string, GrpcUnaryMethod>)[method];
      invoke.call(this.client, request, (error: grpc.ServiceError | null, response: unknown) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response as T);
      });
    });
  }
}
