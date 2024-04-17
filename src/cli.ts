import os from 'node:os';
import path from 'node:path';
import { spinner } from 'typesdk/utils/asci';
import { Stringify } from 'typed-config-parser';
import { EventLoop } from 'not-synchronous/event-loop';

import version from '@@internals/version';
import minimist from '@@internals/minimist';
import Password from '@@internals/password';
import { PersistenceReplication } from './fs';
import env, { logger, readConfigFile } from '@env';
import { ASCI_BOLD, ASCI_RESET } from '@@internals/constants';
import FileSystemCacheWriteQueue, { processFileSystemCacheWriteQueue } from '@@internals/queue/fscache-flush';


export async function __$main(): Promise<void> {
  const argv = minimist(process.argv.slice(2), {
    '--': true,
    alias: {
      verbose: 'v',
      help: 'h',
    },
  });

  if(argv.help) {
    printUsage();
    return process.exit(0);
  }

  FileSystemCacheWriteQueue.start(processFileSystemCacheWriteQueue);

  process.on('beforeExit', () => {
    FileSystemCacheWriteQueue.dispose();
  });

  process.on('exit', () => {
    FileSystemCacheWriteQueue.dispose();
  });

  const command = argv._[0];
  
  switch(command) {
    case 'pwdset':
      await _setPassword(argv);
      break;
    default:
      logger.error(`${command}: command not found.`);
      process.exit(1);
  }
}


async function _setPassword(argv: minimist.ParsedArgs): Promise<void> {
  if(!argv.set) {
    logger.error('Expected a `--set` flag to set the password.');
    return process.exit(1);
  }

  const _doSetPassword = async (): Promise<void> => {
    try {
      const password = Password.create(argv.set, false, env.getEnvironmentVariable('HMAC_KEY')!);

      if(password.isLeft()) {
        throw password.value;
      }

      const config = readConfigFile();
      const auth = config.auth as Record<string, string | number | boolean> | undefined;

      if(auth?.hashing_algorithm &&
        typeof auth.hashing_algorithm === 'string' &&
        (auth.hashing_algorithm === 'pbkdf2' ||
        auth.hashing_algorithm === 'argon2')) {
        password.value.algorithm = auth.hashing_algorithm as 'pbkdf2' | 'argon2';
      }

      config.auth ??= {};

      const hashed = await password.value.getHashedValue();
      (<any>config.auth).hashed_password = hashed;

      const str = new Stringify(config as any, os.EOL);

      const writer = new PersistenceReplication({
        path: path.join(env.getConfigPath(), 'ray.conf'),
        encoding: 'utf-8',
      });

      await writer.writeBuffer(Buffer.from(str.toString()));
    } catch (err: any) {
      logger.error(`failed to set password due to ${err.message} at ${err.stack || 'unknown stack trace'}`);
      logger.error(err);
      
      EventLoop.immediate(() => {
        process.exit(1);
      });
    }
  };

  await spinner('setting password', _doSetPassword);
}

function printUsage(): void {
  let out = `${ASCI_BOLD}ray ${version}${ASCI_RESET}\n  A super fast in-memory service for real-time apps.\n\n`;

  out += `${ASCI_BOLD}Usage${ASCI_RESET}\n`;
  out += '  ray <command> [options]\n\n';

  out += '--verbose, -v   Enable verbose output\n';
  out += '--help, -h      Print this help message\n';

  console.clear();
  console.log(out);
}
