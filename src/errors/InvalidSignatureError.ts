import type { Dict } from 'typesdk/types';
import { Exception } from 'typesdk/errors';


export class InvalidSignatureError extends Exception {
  public override readonly name: string = 'InvalidSignatureError';
  public override readonly message: string;
  public readonly expected: string;
  public readonly received: string;

  constructor(message: string, expected: string, actual: string, context?: Dict<any>) {
    context ??= {};
    if(!context.statusCode) {
      context.statusCode = 401;
    }

    super(message, context);

    this.message = message;
    this.expected = expected;
    this.received = actual;
  }
}

export default InvalidSignatureError;
