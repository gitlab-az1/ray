import { format } from 'node:util';

import { isPlainObject } from './utils';
import { jsonSafeStringify } from './safe-json';
import { Event, EventEmitter } from 'not-synchronous/events';
import { ASCI_BLUE, ASCI_BRIGHT_BLUE, ASCI_BRIGHT_YELLOW, ASCI_GREEN, ASCI_MAGENTA, ASCI_RED, ASCI_RESET } from '@@internals/constants';


class LogEvent extends Event<{ message: string; asciCleanMessage: string }> {
  public constructor(target: { message: string; asciCleanMessage: string }) {
    super('log', target, { cancelable: false });
  }
}

export enum DebugLevel {
  Debug = 0xA,
  Info = 0x14,
  Warn = 0x1E,
  Error = 0x28,
  Fatal = 0x32,
}

export type DebuggerOptions = {
  namespace?: string;
  debugLevel?: DebugLevel;
}

export class Debugger extends EventEmitter {
  private readonly _namespace: string;
  private readonly _level: DebugLevel = DebugLevel.Debug;

  public constructor(options?: DebuggerOptions);
  public constructor(namespace: string, options?: Omit<DebuggerOptions, 'namespace'>);
  public constructor(
    namespaceOrOptions?: string | DebuggerOptions,
    options?: Omit<DebuggerOptions, 'namespace'> // eslint-disable-line comma-dangle
  ) {
    super({ onListenerError: console.error });

    const o = typeof namespaceOrOptions === 'string' ? 
      options ?? {} : isPlainObject(namespaceOrOptions) ? namespaceOrOptions : {};

    this._namespace = (typeof namespaceOrOptions === 'string' ?
      namespaceOrOptions : 
      (<any>o)?.namespace) ?? '';

    this._level = o?.debugLevel || DebugLevel.Debug;
  }

  public get namespace(): string {
    return this._namespace;
  }

  public get level(): number {
    return this._level;
  }

  public log(message: any, ...args: any[]): void {
    const msg = this.#makeMessage(this._level, message, ...args);
    const stream = this._level < DebugLevel.Warn ? 'stdout' : 'stderr';

    process[stream].write(msg.endsWith('\n') ? msg : `${msg}\n`);

    // eslint-disable-next-line no-control-regex
    this.emit('log', new LogEvent({ message: msg, asciCleanMessage: msg.replace(/\u001b\[\d+m/g, '') }));
  }

  public debug(message: any, ...args: any[]): void {
    const msg = this.#makeMessage(DebugLevel.Debug, message, ...args);
    process.stdout.write(msg.endsWith('\n') ? msg : `${msg}\n`);

    // eslint-disable-next-line no-control-regex
    this.emit('log', new LogEvent({ message: msg, asciCleanMessage: msg.replace(/\u001b\[\d+m/g, '') }));
  }

  public info(message: any, ...args: any[]): void {
    const msg = this.#makeMessage(DebugLevel.Info, message, ...args);
    process.stdout.write(msg.endsWith('\n') ? msg : `${msg}\n`);

    // eslint-disable-next-line no-control-regex
    this.emit('log', new LogEvent({ message: msg, asciCleanMessage: msg.replace(/\u001b\[\d+m/g, '') }));
  }

  public warn(message: any, ...args: any[]): void {
    const msg = this.#makeMessage(DebugLevel.Warn, message, ...args);
    process.stderr.write(msg.endsWith('\n') ? msg : `${msg}\n`);

    // eslint-disable-next-line no-control-regex
    this.emit('log', new LogEvent({ message: msg, asciCleanMessage: msg.replace(/\u001b\[\d+m/g, '') }));
  }

  public error(message: any, ...args: any[]): void {
    const msg = this.#makeMessage(DebugLevel.Error, message, ...args);
    process.stderr.write(msg.endsWith('\n') ? msg : `${msg}\n`);

    // eslint-disable-next-line no-control-regex
    this.emit('log', new LogEvent({ message: msg, asciCleanMessage: msg.replace(/\u001b\[\d+m/g, '') }));
  }

  public fatal(message: any, ...args: any[]): void {
    const msg = this.#makeMessage(DebugLevel.Fatal, message, ...args);
    process.stderr.write(msg.endsWith('\n') ? msg : `${msg}\n`);

    // eslint-disable-next-line no-control-regex
    this.emit('log', new LogEvent({ message: msg, asciCleanMessage: msg.replace(/\u001b\[\d+m/g, '') }));
  }

  #makeMessage(level: DebugLevel, message: any, ...args: any[]): string {
    let msg = `${ASCI_GREEN}${new Date().toISOString()}${ASCI_RESET} ${this.#extractLevelColor(level)}[${DebugLevel[level].toLowerCase()}]${ASCI_RESET}`;

    if(this._namespace) {
      msg += ` ${ASCI_MAGENTA}(${this._namespace})${ASCI_RESET}`;
    }/* else {
      msg += ` ${ASCI_MAGENTA}(${process.pid})${ASCI_RESET}`;
    }*/

    for(let i = 0; i < args.length; i++) {
      if(typeof args[i] === 'object' && isPlainObject(args[i])) {
        args[i] = jsonSafeStringify(args[i], null, 2);
      }
    }

    if(typeof message !== 'string') {
      message = typeof message === 'number' ? message.toString() : jsonSafeStringify(message, null, 2) || '{}';
    }

    msg += ` ${format(message, ...args)}`;
    return msg;
  }

  #extractLevelColor(level: DebugLevel): string {
    switch(level) {
      case DebugLevel.Debug:
        return ASCI_MAGENTA;
      case DebugLevel.Info:
        return ASCI_BRIGHT_BLUE;
      case DebugLevel.Warn:
        return ASCI_BRIGHT_YELLOW;
      case DebugLevel.Fatal:
      case DebugLevel.Error:
        return ASCI_RED;
      default:
        return ASCI_BLUE;
    }
  }

  public on(event: 'log', listener: (e: LogEvent) => any): void;
  public on(event: string, listener: (e: Event<any>) => void): void {
    this.subscribe(event, listener);
  }
}
