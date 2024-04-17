import type { NextFunction, Request, Response } from 'express';
import UnauthorizedError from 'typesdk/errors/http/extended/UnauthorizedError';
import UnprocessableEntityError from 'typesdk/errors/http/extended/UnprocessableEntityError';

import { Dict } from '@@types/common';
import env, { readConfigFile } from '@env';
import Password from '@@internals/password';
import { Stacktrace, ValidationError, handleRouteError } from '@errors';


export async function authenticateRequest(
  request: Request,
  response: Response,
  next: NextFunction // eslint-disable-line comma-dangle
): Promise<void> {
  try {
    const config = readConfigFile();
    const auth = config.auth as Dict<string | number | boolean> | undefined;

    if(auth?.enable_authentication !== true) return next();


    if(!auth?.hashed_password) {
      throw new UnprocessableEntityError('No hashed password found in the configuration file.', undefined, Stacktrace.create().value);
    }

    if(typeof auth.hashed_password !== 'string') {
      throw new UnprocessableEntityError('Invalid hashed password found in the configuration file.', undefined, Stacktrace.create().value);
    }

    if(!auth?.username) {
      throw new UnprocessableEntityError('No username found in the configuration file.', undefined, Stacktrace.create().value);
    }

    if(!request.headers.authorization) {
      throw new UnauthorizedError('No authorization header found.', undefined, Stacktrace.create().value);
    }

    const [scheme, token] = request.headers.authorization.split(' ');
    
    if(scheme !== 'Basic') {
      throw new UnauthorizedError('Invalid authorization scheme.', undefined, Stacktrace.create().value, {
        reason: 'Only the `Basic` authorization scheme is supported yet.',
        scheme,
      });
    }

    const [username, password] = Buffer.from(token, 'base64').toString().split(':');

    if(username !== auth.username) {
      throw new UnauthorizedError('Invalid credentials provided.', undefined, Stacktrace.create().value);
    }

    const pwd = Password.create(auth.hashed_password, true, env.getEnvironmentVariable('HMAC_KEY')!);

    if(pwd.isLeft()) {
      throw new ValidationError(pwd.value.message, pwd.value.action, Object.assign(pwd.value.context ?? {}, {
        location: Stacktrace.create().value,
      }));
    }

    if(auth.hashing_algorithm &&
      typeof auth.hashing_algorithm === 'string' &&
      (auth.hashing_algorithm === 'pbkdf2' ||
      auth.hashing_algorithm === 'argon2')) {
      pwd.value.algorithm = auth.hashing_algorithm as 'pbkdf2' | 'argon2';
    }

    const isPasswordValid = await pwd.value.compare(password);

    if(!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials provided.', undefined, Stacktrace.create().value);
    }

    next();
  } catch (err: any) {
    return await handleRouteError(err, request, response);
  }
}

export default authenticateRequest;
