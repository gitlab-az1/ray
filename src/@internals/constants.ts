/**
 * permission for files created by the app `[chmod 644]`.
 * 
 * permissions role:
 * `rw-r--r--`
 * 
 * `owner: read, write`
 * 
 * `group: read`
 * 
 * `others: read`
 * 
 * ```js
 * 0o644
 * ```
 * 
 * @example
 * ```js
 * import fs from 'node:fs'
 * fs.writeFileSync('new-file.txt', 'Hello World!', { mode: 0o644, encoding: 'utf-8' });
 * ```
 */
export const FILE_PERMISSION = 0o644;

/**
 * permission for folders created by the app `[chmod 755]`.
 * 
 * permissions role:
 * `rwxr-xr-x`
 * 
 * `owner: read, write, execute`
 * 
 * `group: read, execute`
 * 
 * `others: read, execute`
 * 
 * ```js
 * 0o755 
 * ```
 * 
 * @example
 * ```js
 * import fs from 'node:fs';
 * await fs.mkdirSync('new-folder', { mode: 0o755 });
 * ```
 */
export const FOLDER_PERMISSION = 0o755;
