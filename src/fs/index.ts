import fs from 'node:fs';
import path from 'node:path';

import { ensureDir, ensureDirSync } from './ensure';

export * from './ensure';
export * from './persistence-replication';


export async function readReplicationFile(pathname: string, encoding: BufferEncoding = 'binary'): Promise<Buffer> {
  await ensureDir(path.dirname(pathname));

  const buf = await fs.promises.readFile(pathname);
  return Buffer.from(buf.toString(), encoding);
}

export function readReplicationFileSync(pathname: string, encoding: BufferEncoding = 'binary'): Buffer {
  ensureDirSync(path.dirname(pathname));

  const buf = fs.readFileSync(pathname);
  return Buffer.from(buf.toString(), encoding);
}
