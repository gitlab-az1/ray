import fs from 'node:fs';
import path from 'node:path';
import * as http from 'node:http';
import * as https from 'node:https';

import routes from './routes';
import app, { port } from './app';
import * as inet from '@@internals/inet';
import authenticateRequest from './middlewares/auth';
import env, { liveNetworkStore, logger, readConfigFile } from '@env';
import FileSystemCacheWriteQueue, { processFileSystemCacheWriteQueue } from '@@internals/queue/fscache-flush';


const server = createServer();

server.server.listen(port,
  env.isProduction() ? inet.localIP().address : '127.0.0.1',
  onListening);


async function onListening() {
  FileSystemCacheWriteQueue.start(processFileSystemCacheWriteQueue);

  process.on('beforeExit', () => {
    FileSystemCacheWriteQueue.dispose();
  });

  process.on('exit', () => {
    FileSystemCacheWriteQueue.dispose();
  });

  server.server.on('connect', (request, socket) => {
    const currentClients = liveNetworkStore.get('connected_clients') ?? [];
    const config = readConfigFile();
    
    const client = {
      ip: request.socket.remoteAddress ?? inet.extractIPFromRequest(request).address,
      port: request.socket.remotePort!,
      connected_at: Date.now(),
    };

    const connectionsOfThisIP = currentClients.filter(c => c.ip === client.ip).length;

    if(connectionsOfThisIP >= (config.net?.max_connections_per_ip ?? 6)) return socket.end();
    if(currentClients.length >= (config.net?.max_connections ?? 16)) return socket.end();

    socket.on('close', () => {
      const currentClients = liveNetworkStore.get('connected_clients') ?? [];
      liveNetworkStore.set('connected_clients', currentClients.filter(c => !(c.ip === client.ip && c.port === client.port)));
    });

    return void liveNetworkStore.set('connected_clients', [...currentClients, client]);
  });

  server.server.on('upgrade', (request, socket) => {
    const currentClients = liveNetworkStore.get('connected_clients') ?? [];
    const config = readConfigFile();
    
    const client = {
      ip: request.socket.remoteAddress ?? inet.extractIPFromRequest(request).address,
      port: request.socket.remotePort!,
      connected_at: Date.now(),
    };

    const connectionsOfThisIP = currentClients.filter(c => c.ip === client.ip).length;

    if(connectionsOfThisIP >= (config.net?.max_connections_per_ip ?? 6)) return socket.end();
    if(currentClients.length >= (config.net?.max_connections ?? 16)) return socket.end();

    socket.on('close', () => {
      const currentClients = liveNetworkStore.get('connected_clients') ?? [];
      liveNetworkStore.set('connected_clients', currentClients.filter(c => !(c.ip === client.ip && c.port === client.port)));
    });

    return void liveNetworkStore.set('connected_clients', [...currentClients, client]);
  });

  logger.debug(`Ray server is running at ray${server.secure ? 's' : ''}://${inet.localIP().address}:${port}`);

  app.use('/rayrc', authenticateRequest, routes);

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

  if((config.net as Record<string, any>)?.force_ssl !== true) return {
    secure: false,
    server: http.createServer(app),
  };

  const keyPath = path.join(env.getTLSPath(), 'key.pem');
  const certPath = path.join(env.getTLSPath(), 'cert.pem');

  if(!fs.existsSync(keyPath)) {
    logger.fatal(`SSL key not found at '${keyPath}'`);
    return process.exit(1);
  }

  if(!fs.existsSync(certPath)) {
    logger.fatal(`SSL certificate not found at '${certPath}'`);
    return process.exit(1);
  }

  return {
    secure: true,
    server: https.createServer({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }, app),
  };
}
