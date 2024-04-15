import crypto from 'node:crypto';
import { EventLoop, Job } from 'not-synchronous';

import env from '@env';
import Lazy from '@@internals/lazy';
import type { Dict } from '@@types/common';
import Exception from '@errors/exception';
import { mask } from '@@internals/buffer';
import { jsonSafeStringify } from '@@internals/safe-json';
import { PersistenceReplication } from '@fs/persistence-replication';


type FSValue = {
  value: any;
  length: number;
  score?: number;
  createdAt: number;
  fieldType: 'z-index' | 'key-value';
}

type WriteJobPayload = {
  $ttl: Dict<number>;
  $data: Dict<FSValue>;
  namespace: string;
  pathname: string;
}

export const bufferMask = new Lazy(() => Buffer.from('f339db3a', 'hex'));

export const FileSystemCacheWriteQueue = new EventLoop({ concurrency: 1 });



export async function processFileSystemCacheWriteQueue(job: Job<WriteJobPayload>) {
  const hash = crypto.createHmac('sha512', env.getEnvironmentVariable('HMAC_KEY')!);
  hash.update(`${jsonSafeStringify(job.data.$ttl)}:${Object.values(job.data.$data).join('|')}`);
  hash.update(job.data.namespace);

  const output = jsonSafeStringify({
    $data: job.data.$data,
    $ttl: job.data.$ttl,
    $signature: hash.digest('hex'),
    $metadata: { signedAt: Date.now() },
  });

  if(!output) {
    throw new Exception('Failed to serialize cache data');
  }

  const baseBuffer = Buffer.from(output);
  const outputBuffer = Buffer.alloc(baseBuffer.length);
  mask(baseBuffer, bufferMask.value, outputBuffer, 0, baseBuffer.length);

  const fileWriter = new PersistenceReplication({ path: job.data.pathname });  
  await fileWriter.writeBuffer(outputBuffer);
}


export default FileSystemCacheWriteQueue;
