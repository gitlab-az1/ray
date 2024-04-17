import { Request, Response } from 'express';
import { jsonSafeStringify } from 'typesdk/safe-json';
import { ExtendedSerializableError } from 'typesdk/errors/http/extended';

import { logger } from '@env';
import * as inet from '@@internals/inet';
import { exclude } from '@@internals/utils';

interface DomainError {
  readonly message: string;
  statusCode?: number;
  location?: string;
}


export async function handleRouteError(context: DomainError, request: Request, response: Response): Promise<void>;
export async function handleRouteError(context: { [key: string]: any }, request: Request, response: Response): Promise<void>;
export async function handleRouteError(context: object, request: Request, response: Response): Promise<void>;
export async function handleRouteError(context: null, request: Request, response: Response): Promise<void>;
export async function handleRouteError(context: undefined, request: Request, response: Response): Promise<void>;
export async function handleRouteError(
  context: any,
  request: Request,
  response: Response // eslint-disable-line comma-dangle
): Promise<void> {
  if(!context) {
    logger.error('[uncaught exception] `handleRouteError` was called with an undefined or null context.');
  }

  if(!context) return void response.writeHead(500).end();
  response.setHeader('Content-Type', 'application/json');

  const s = context.statusCode ?? 500;
  response.status(s);
  
  if(s >= 500) {
    logger.error(`${context.message} [from=${inet.extractIPFromRequest(request).address}] at ${context.stack}`);
    logger.error(exclude(context, 'action'));
  } else {
    logger.warn(`${context.message} [from=${inet.extractIPFromRequest(request).address}] at ${context.stack}`);
    logger.warn(exclude(context, 'action'));
  }

  let normalizedContext: Record<string, any> = {};

  if(context instanceof ExtendedSerializableError) {
    normalizedContext = context.serialize();
  } else {
    normalizedContext = {
      action: context.action ?? 'Check the server logs for more information.',
      context: context.context ?? {},
      message: context.message,
      _raw: context,
    };
  }
  
  if(normalizedContext.action && normalizedContext.action.toLowerCase().split(' ').some((x: string) => ['support', 'contact'].includes(x))) {
    normalizedContext.action = 'Check the server logs for more information.';
  }

  delete normalizedContext.context?.location;
  delete normalizedContext.stack;

  response.send(jsonSafeStringify(normalizedContext) || '{}');
  response.end();
}
