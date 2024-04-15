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



export const ASCI_RED = '\x1b[31m';
export const ASCI_BOLD = '\x1b[1m';
export const ASCI_BLUE = '\x1b[34m';
export const ASCI_CYAN = '\x1b[36m';
export const ASCI_RESET = '\x1b[0m';
export const ASCI_GREEN = '\x1b[32m';
export const ASCI_YELLOW = '\x1b[33m';
export const ASCI_MAGENTA = '\x1b[35m';
export const ASCI_BRIGHT_RED = '\x1b[91m';
export const ASCI_BRIGHT_BLUE = '\x1b[94m';
export const ASCI_BRIGHT_CYAN = '\x1b[96m';
export const ASCI_BRIGHT_GREEN = '\x1b[92m';
export const ASCI_BRIGHT_YELLOW = '\x1b[93m';
export const ASCI_UNDERLINE = '\x1b[4m';
