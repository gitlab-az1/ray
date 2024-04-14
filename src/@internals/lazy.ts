import { isPlainObject } from './utils';


/**
 * A function that takes no arguments and returns a value of type `T`.
 */
export type LazyExecutor<T> = () => T;

/**
 * A lazy value.
 *
 * The lazy value is calculated once on first access and then cached.
 *
 * @param T The type of the lazy value.
 */
export class Lazy<T> {
  private _error: Error | undefined;
  private _didRun: boolean = false;
  private _value?: T;
  
  constructor(private readonly _executor: LazyExecutor<T>) { }

  /**
   * True if the lazy value has been resolved.
   */
  get hasValue() { return this._didRun; }

  /**
   * Get the wrapped value.
   *
   * This will force evaluation of the lazy value if it has not been resolved yet. Lazy values are only
   * resolved once. `getValue` will re-throw exceptions that are hit while resolving the value
   */
  get value(): T {
    if (!this._didRun) {
      try {
        this._value = this._executor();
      } catch (err: any) {
        let e = err;

        if(isPlainObject(err)) {
          e = new Error(err.message);
        }

        this._error = e;
      } finally {
        this._didRun = true;
      }
    }

    if(this._error) {
      throw this._error;
    }

    return this._value!;
  }

  /**
   * Get the wrapped value without forcing evaluation.
   */
  get rawValue(): T | undefined {
    return this._value;
  }
}

export default Lazy;
