import * as http from 'node:http';
import * as https from 'node:https';

import app, { port } from './app';
import * as inet from '@@internals/inet';
import env, { readConfigFile } from '@env';


const server = createServer();

server.server.listen(port,
  env.isProduction() ? inet.localIP().address : '127.0.0.1',
  onListening);


async function onListening() {
  app.use('*', (_, res) => {
    res.setHeader('Connection', 'close');
    res.writeHead(226).end();
  });
}


type Srv = (
  | {
    server: http.Server;
    secure: false;
  }
  | {
    secure: true;
    server: https.Server;
  }
);

function createServer(): Srv {
  const config = readConfigFile();

  if(config.force_ssl) return {
    secure: true,
    server: https.createServer({
      // key: config.ssl_key,
      // cert: config.ssl_cert,
    }, app),
  };

  return {
    secure: false,
    server: http.createServer(app),
  };
}
