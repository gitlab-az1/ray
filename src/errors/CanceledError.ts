import { Exception } from 'typesdk/errors';


export class CanceledError extends Exception {
  public override readonly name = 'CanceledError' as const;
}

export default CanceledError;
