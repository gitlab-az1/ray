import { logger } from '@env';

export * from './inet';
export * from './exception';
export * from './CanceledError';
export * from './except';
export * from './ExpiredError';
export * from './InvalidSignatureError';
export * from './ValidationError';


export class Stacktrace {
  public static create(): Stacktrace {
    return new Stacktrace(new Error().stack ?? '');
  }

  private constructor(readonly value: string) { }

  public print(): void {
    logger.warn(this.value.split('\n').slice(2).join('\n'));
  }

  public toString(): string {
    return this.value;
  }
}
