import fs from 'node:fs';
import path from 'node:path';
import { Writable } from 'node:stream';

import env from '@env';
import { Debugger, DebuggerOptions } from './debug';


export function createLoggerWithDiskFlusher(
  filename?: string,
  options?: DebuggerOptions // eslint-disable-line comma-dangle
): Debugger {
  const debug = new Debugger(options);

  debug.on('log', event => {
    try {
      const p = path.join(env.getLogsPath(), filename ?? debug.namespace ? `${debug.namespace}.rayrc.log` : 'rayrc.log');
      if(!fs.existsSync(p)) return void fs.writeFileSync(p, event.target.asciCleanMessage);

      const prev = fs.readFileSync(p, 'utf-8').trim();
      fs.writeFileSync(p, `${prev}\n${event.target.asciCleanMessage.trim()}\n`);
    } catch (err: any) {
      console.error(err);
    }
  });

  return debug;
}


export function createLoggerWithStream(
  stream: NodeJS.WritableStream | Writable,
  options?: DebuggerOptions // eslint-disable-line comma-dangle
): Debugger {
  const debug = new Debugger(options);

  debug.on('log', event => {
    stream.write(event.target.asciCleanMessage);
  });

  return debug;
}
