import path from 'node:path';
import * as fs from 'node:fs';

import { ensureDir, ensureDirSync } from './ensure';
import { FILE_PERMISSION } from '@@internals/constants';



const $kWriteStream = Symbol('FS::PERSISTENCE_REPLICATION::PERSISTENCE_REPLICATION_STREAM->WriteStream');


export type PersistenceReplicationOptions = {
  path: string;
  encoding?: BufferEncoding;
}

type BufferWriterOptions = {
  position?: number;
  offset?: number;
  length?: number;
}

export class PersistenceReplication {
  private readonly _path: string;
  private readonly _encoding?: BufferEncoding = 'binary';

  public constructor(options: PersistenceReplicationOptions) {
    this._path = options.path;
    this._encoding = options.encoding || 'binary';
  }

  public async writeBuffer(data: Buffer, options?: BufferWriterOptions): Promise<void> {
    data = Buffer.from(data.toString(this._encoding));

    await ensureDir(path.dirname(this._path));
    if(!options?.offset && !options?.length) return fs.promises.writeFile(this._path, data, { mode: FILE_PERMISSION });

    const descriptor = await fs.promises.open(this._path, 'w', FILE_PERMISSION);
    await descriptor.write(data, options?.offset, options?.length, options?.position);
    
    await descriptor.close();
  }

  public writeBufferSync(data: Buffer, offset?: number, length?: number): void {
    data = Buffer.from(data.toString(this._encoding));

    ensureDirSync(path.dirname(this._path));
    if(!offset && !length) return fs.writeFileSync(this._path, data, { mode: FILE_PERMISSION });

    const descriptor = fs.openSync(this._path, 'w', FILE_PERMISSION);
    fs.writeSync(descriptor, data, offset, length);

    fs.closeSync(descriptor);
  }
}


export class PersistenceReplicationStream /*implements Writable*/ {
  private readonly [$kWriteStream]: fs.WriteStream;

  public constructor() {
    //# this[$kWriteStream] = fs.createWriteStream('', {}); // autoClose: false
  }

  public get writable(): boolean {
    return this[$kWriteStream].writable;
  }
}
