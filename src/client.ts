import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';
import { RandomHandlers } from './proto/randomPackage/Random';
import readline from 'readline';

const PORT = 8082;
const PROTO_FILES = './proto/random.proto';

const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILES));
const grpcObj = (grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;

const client = new grpcObj.randomPackage.Random(
  `127.0.0.1:${PORT}`, grpc.credentials.createInsecure()
);

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);
client.waitForReady(deadline, (err) => {
  if (err) {
    console.error(err);
    return;
  }

  onClientReady();
});

function onClientReady() {
  // client.PingPong({message: 'Ping'}, (err, result) => {
  //   if(err){
  //     console.error(err);
  //     return;
  //   }

  //    console.log(result)
  // });

  // const stream = client.RandomNumbers({maxVal: 85});
  // stream.on('data', (chunk) => {
  //   console.log(chunk);
  // });
  // stream.on('end', () => {
  //   console.log('Communication ended');

  // });

  // const stream = client.TodoList((err, result) => {
  //   if(err) {
  //     console.error(err);
  //     return;
  //   }

  //   console.log(result);
  // })

  // stream.write({ todo: 'Walk on the street', status: 'Never'});
  // stream.write({ todo: 'Take a shower', status: 'Daily'});
  // stream.write({ todo: 'Drive on street', status: 'Weekly'});

  // stream.end();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const username = process.argv[2]
  if (!username) console.error("No username, can't join chat"), process.exit()


  const metadata = new grpc.Metadata()
  metadata.set('username', username)
  const call = client.Chat(metadata)

  call.write({
    message: 'register'
  })

  call.on('data', (chunk) => {
    console.log(`${chunk.username} ==> ${chunk.message}`)
  })

  rl.on('line', (line) => {
    if (line === 'quit') {
      call.end()
    } else {
      call.write({
        message: line
      })
    }

  })
}