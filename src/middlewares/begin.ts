import type { NextFunction, Request, Response } from 'express';
import LengthRequiredError from 'typesdk/errors/http/extended/LengthRequiredError';

import { readConfigFile } from '@env';
import { handleRouteError } from '@errors/except';


export async function begin(
  request: Request,
  response: Response,
  next: NextFunction // eslint-disable-line comma-dangle
): Promise<void> {
  try {
    const config = readConfigFile();

    if(config.server?.require_length === true) {
      if(request.method.trim().toLowerCase() !== 'get') {
        if(!!request.body && !request.headers['content-length']) {
          throw new LengthRequiredError('The `Content-Length` header is required for this request.');
        }
      }
    }

    next();
  } catch (err: any) {
    return await handleRouteError(err, request, response);
  }
}

export default begin;
