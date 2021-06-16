import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';
import { RandomHandlers } from './proto/randomPackage/Random';
import { ChatRequest } from './proto/randomPackage/ChatRequest';
import { ChatResponse } from './proto/randomPackage/ChatResponse';

const PORT = 8082;
const PROTO_FILES = './proto/random.proto';

const packageDefinition = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILES));
const grpcObj = (grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;
const randomPackage = grpcObj.randomPackage;

const todoList: any = [];
const callObjByUsername = new Map<string, grpc.ServerDuplexStream<ChatRequest, ChatResponse>>();

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
    },

    RandomNumbers: (call) => {
      const { maxVal = 1 } = call.request;
      call.write({ num: Math.floor(Math.random() * maxVal) });
      call.end();
    },

    TodoList: (call, callback) => {
      call.on('data', (chunk) => {
        todoList.push(chunk);
        console.log(chunk);
      })

      call.on('end', () => {
        callback(null, { todos: todoList});
      });
    },

    Chat: (call) => {
      call.on('data', (req) => {
        const userName = call.metadata.get('username')[0] as string;
        const msg = req.message;

        for(let [user, usersCall] of callObjByUsername) {
          if(userName !== user) {
            usersCall.write({
              username: userName,
              message: msg
            })
          }
        }

        if(callObjByUsername.get(userName) === undefined) {
          callObjByUsername.set(userName, call);
        }
      });

      call.on('end', () => {
        const userName = call.metadata.get('username')[0] as string;
        callObjByUsername.delete(userName);
        console.log(`${userName} is leaving`);
        
        for(let [user, usersCall] of callObjByUsername) {
          usersCall.write({
            username: userName,
            message: 'Has Left the Chat!'
          })
        }

        call.write({
          username: userName,
          message: `See you later ${userName}`
        })

        call.end();
      })
    }
  } as RandomHandlers);

  return server;
}

main()