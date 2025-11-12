import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler<
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
  Locals extends Record<string, any> = Record<string, any>
> = (
  req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>,
  res: Response<ResBody, Locals>,
  next: NextFunction
) => Promise<unknown>;

export const catchAsync = <
  Params = Record<string, any>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, any>,
  Locals extends Record<string, any> = Record<string, any>
>(
  handler: AsyncRouteHandler<Params, ResBody, ReqBody, ReqQuery, Locals>
) => {
  return (req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>, res: Response<ResBody, Locals>, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};


