import env from '@env';

import express from 'express';
import cookieParser from 'cookie-parser';

import * as inet from '@@internals/inet';
import type { Writable } from './@types';
import { uuidWithoutDashes } from '@@internals/id';



export interface RequestInet {
  readonly ip: inet.IPv4 | inet.IPv6;
  readonly geo: inet.Geo;
  readonly isp?: inet.ISP;
}

export interface RequestContext {
  [key: string]: any;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      readonly requestId: string;
      readonly inet: RequestInet;
      readonly context?: RequestContext;
    }
  }
}


const app = express();
export const port = parseInt(env.getEnvironmentVariable('PORT', { fallback: '4160' }), 10);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.disable('x-powered-by');
app.set('port', port);


app.use(async (req, res, next) => {
  function qs() {
    if(!req.query) return '';

    const query = Object.entries(req.query).map(([key, value]) => `${key}=${value}`).join('&');
    return query && query.trim().length > 0 ? `?${query}` : '';
  }

  (req as Writable<typeof req>).requestId = uuidWithoutDashes();
  
  (req as Writable<typeof req>).inet = {
    ip: inet.extractIPFromRequest(req),
    geo: inet.extractGeoFromRequest(req),
    isp: inet.extractISPFromRequest(req),
  };

  (req as Writable<typeof req>).context = {};

  const abspath = req.path.split('?')[0].trim();

  if(abspath.endsWith('/') && abspath !== '/') return res.redirect(
    301,
    abspath.slice(0, -1) + qs() // eslint-disable-line comma-dangle
  );

  next();
});

export default app;
