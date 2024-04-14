import os from 'node:os';
import path from 'node:path';
import { isThenable } from 'not-synchronous/core';

import { Exception } from '@errors';
import { ensureDirSync } from '@fs';
import type { LooseAutocomplete, MaybePromise } from '@@types';
import { assertString, isPlainObject } from '@@internals/utils';



export interface MappedEnvironmentVariables {}

export interface EnvironmentVariables extends MappedEnvironmentVariables {
  [key: string]: string | undefined;
}


export interface VariableResolverContext {
  getAppRoot(): string | undefined;
  getExecPath(): string | undefined;
  getEnvironmentVariables(): MaybePromise<EnvironmentVariables>;
}

type BaseGetVariableOptions<T> = {
  rewrite?: (value: string) => T;
  strict?: boolean;
};

export type GetVariableOptionsWithFallback<T> = BaseGetVariableOptions<T> & {
  fallback: T;
}

export type GetVariableOptionsWithoutFallback<T> = BaseGetVariableOptions<T> & {
  fallback?: never;
}

export type GetVariableOptions<T> = GetVariableOptionsWithFallback<T> | GetVariableOptionsWithoutFallback<T>;

export class AbstractVariablesResolverService {
  public static readonly VARIABLE_LHS = '${';
  public static readonly VARIABLE_REGEXP = /\$\{(.*?)\}/g;

  private readonly _vars: EnvironmentVariables = process.env as EnvironmentVariables;

  public constructor(
    private readonly _context?: VariableResolverContext,
    variables?: EnvironmentVariables // eslint-disable-line comma-dangle
  ) {
    if(!!_context && typeof _context.getEnvironmentVariables === 'function') {
      const v = _context.getEnvironmentVariables();

      if(isThenable(v)) {
        throw new Exception('getEnvironmentVariables() must return a value, not a promise');
      }

      Object.assign(this._vars, v);
    }

    if(!!variables && isPlainObject(variables)) {
      Object.assign(this._vars, variables);
    }
  }

  public getAppRoot(): string {
    const root = this._context?.getAppRoot() ?? (
      this.isProduction() ? path.join(os.homedir(), '.ray') : process.cwd()
    );

    ensureDirSync(root);
    return root;
  }

  public getConfigPath(): string {
    const p = path.join(this.getAppRoot(), 'etc');
    ensureDirSync(p);

    return p;
  }

  public getExecPath(): string {
    const p = this._context?.getExecPath() ?? path.join(this.getAppRoot(), 'bin');
    ensureDirSync(p);

    return p;
  }

  public getTempPath(): string {
    const p = path.join(this.getAppRoot(), 'tmp');
    ensureDirSync(p);

    return p;
  }

  public getVariableDataPath(): string {
    const p = path.join(this.getAppRoot(), 'var');
    ensureDirSync(p);

    return p;
  }

  public getCachePath(): string {
    const p = path.join(this.getVariableDataPath(), 'cache');
    ensureDirSync(p);

    return p;
  }

  public getEnvironmentVariable<K extends keyof MappedEnvironmentVariables, T = string>(
    name: LooseAutocomplete<K>,
    options: GetVariableOptionsWithFallback<T> // eslint-disable-line comma-dangle
  ): T;

  public getEnvironmentVariable<K extends keyof MappedEnvironmentVariables, T = string>(
    name: LooseAutocomplete<K>,
    options?: GetVariableOptionsWithoutFallback<T> // eslint-disable-line comma-dangle
  ): T | null;

  public getEnvironmentVariable<K extends keyof MappedEnvironmentVariables, T = string>(
    name: LooseAutocomplete<K>,
    options?: GetVariableOptions<T> // eslint-disable-line comma-dangle
  ): T | null {
    assertString(name);

    if(!this._vars) return null;
    let env: string | T | null | undefined = this._vars[name] ?? options?.fallback;

    if(!env && options?.strict === true) {
      throw new Exception(`VariableResolverService: Environment variable '${name}' is not defined`);
    }

    if(!env) return null;

    if(AbstractVariablesResolverService.VARIABLE_REGEXP.test(env as string)) {
      env = (env as string).replace(AbstractVariablesResolverService.VARIABLE_REGEXP, (_, p1) => {
        return this.getEnvironmentVariable(p1 as any) as string;
      });
    }

    if(!!options && typeof options.rewrite === 'function') {
      const output = options.rewrite(env as string);

      if(isThenable(output)) {
        throw new Exception('VariableResolverService: rewrite function must return a value, not a promise');
      }

      env = output;
    }

    return env as T;
  }

  public setVariable<K extends keyof MappedEnvironmentVariables>(
    name: LooseAutocomplete<K>,
    value: string,
    override: boolean = true // eslint-disable-line comma-dangle
  ): void {
    assertString(name);

    if(!override && !!this._vars[name]) return;
    this._vars[name] = value;
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  public isEdge(): boolean {
    return process.env.NODE_ENV === 'edge';
  }

  public isDevelopment(): boolean {
    return (
      !this.isProduction() && 
      !this.isTest() && 
      !this.isEdge()
    );
  }

  public env(): EnvironmentVariables {
    return { ...this._vars };
  }
}


const env = new AbstractVariablesResolverService(undefined, process.env);
export default env;
