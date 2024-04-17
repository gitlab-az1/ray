import type { RequestHandler } from 'express';


export const middlewareStack = new Set<RequestHandler>();

export default middlewareStack;
