import fs from 'node:fs';

import { FOLDER_PERMISSION } from '../@internals/constants';


/**
 * Ensures that the directory exists. If the directory structure does not exist, it is created.
 * @param dirname
 */
export async function ensureDir(dirname: fs.PathLike): Promise<void> {
  if(!fs.existsSync(dirname)) return new Promise((resolve, reject) => {
    fs.mkdir(dirname, { recursive: true, mode: FOLDER_PERMISSION }, (err) => {
      if(err) return reject(err);
      resolve();
    });
  });

  const stats = await fs.promises.stat(dirname);

  if(!stats.isDirectory()) {
    await fs.promises.mkdir(dirname, { recursive: true, mode: FOLDER_PERMISSION });
  }
}

/**
 * Ensures that the directory exists synchronous. If the directory structure does not exist, it is created.
 * @param dirname 
 * @returns 
 */
export function ensureDirSync(dirname: fs.PathLike): void {
  if(!fs.existsSync(dirname)) return void fs.mkdirSync(dirname, { recursive: true, mode: FOLDER_PERMISSION });
    
  const stats = fs.statSync(dirname);
    
  if(!stats.isDirectory()) {
    fs.mkdirSync(dirname, { recursive: true, mode: FOLDER_PERMISSION });
  }
}
