import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';
import { RandomHandlers } from './proto/randomPackage/Random';

const PORT = 8082;
const PROTO_FILES = './proto/random.proto';

const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILES));
const grpcObj = (grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;
const randomPackage = grpcObj.randomPackage;

function main() {
  const server = getServer();

  server.bindAsync(`127.0.0.1:${PORT}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if(err) {
      console.error(err);
      return;
    }

    console.log(`Your server as started on port: ${port}`);
    server.start();
  })
}

function getServer() {
  const server = new grpc.Server();
  server.addService(randomPackage.Random.service, {
    PingPong: (req, res) => {
      req.request;
      console.log(req.request);
      res(null, { message: 'Pong' })
    }
  } as RandomHandlers);

  return server;
}

main()