import type { Dict } from 'typesdk/types';
import { Exception } from 'typesdk/errors';


export class ValidationError extends Exception {
  public override readonly name: string = 'ValidationError';
  public override readonly message: string;
  public readonly context: Dict<any>;
  public readonly action?: string;

  constructor(message: string, action?: string, context?: Dict<any>) {
    super(message, { statusCode: 400 });
    this.context = context ?? {};
    this.message = message;
    this.action = action;
  }
}

export default ValidationError;
