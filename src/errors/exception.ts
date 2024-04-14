import type { Dict } from '../@types/common';


export class Exception extends Error {
  [key: string]: any;
  
  public readonly message: string;
  public readonly name: string;
  public readonly context?: Dict<unknown>;

  constructor(message?: string, contextObject?: Dict<unknown>) {
    super(message);
    
    this.message = message ?? '';
    this.name = 'Exception';

    if(typeof contextObject === 'object' && Object.keys(contextObject).length > 0) {
      for(const prop in contextObject) {
        if(['name', 'message', 'cause', 'stack', 'context'].includes(prop)) continue;
        (this as unknown as Dict<any>)[prop] = contextObject[prop];
      }

      this.context = contextObject;
    }
  }
}

export default Exception;
