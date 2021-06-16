import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';
import { RandomHandlers } from './proto/randomPackage/Random';

const PORT = 8082;
const PROTO_FILES = './proto/random.proto';

const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILES));
const grpcObj = (grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;

const client = new grpcObj.randomPackage.Random(
  `127.0.0.1:${PORT}`, grpc.credentials.createInsecure()
);

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);
client.waitForReady(deadline, (err) =>{
  if(err) {
    console.error(err);
    return;
  }

  onClientReady();
});

function onClientReady() {
  client.PingPong({message: 'Ping'}, (err, result) => {
    if(err){
      console.error(err);
      return;
    }

    console.log(result)
  });
}