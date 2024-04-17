import type { Dict } from 'typesdk/types';
import { ExtendedSerializableError } from 'typesdk/errors/http/extended';


export class ExpiredError extends ExtendedSerializableError {
  public override readonly name: string = 'ExpiredError';
  public override readonly message: string;
  public readonly expiredAt: Date;

  constructor(message: string, expiredAt: Date, action?: string, context?: Dict<any>) {
    super(message, {
      action,
      context,
      statusCode: context?.statusCode ?? 401,
    });
    
    this.message = message;
    this.expiredAt = expiredAt;
  }
}

export default ExpiredError;
