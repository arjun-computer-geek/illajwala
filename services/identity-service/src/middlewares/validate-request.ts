import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "../utils/app-error";

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

const parseSegment = (schema: ZodTypeAny, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw AppError.fromZod(result.error);
  }
  return result.data;
};

export const validateRequest =
  (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = parseSegment(schemas.body, req.body);
      }
      if (schemas.query) {
        const parsedQuery = parseSegment(schemas.query, req.query) as typeof req.query;
        // express@5 defines req.query as a getter-only property; mutate instead of reassigning
        const currentQuery = req.query as Record<string, unknown>;
        Object.keys(currentQuery).forEach((key) => {
          if (!(key in parsedQuery)) {
            delete currentQuery[key];
          }
        });
        Object.assign(currentQuery, parsedQuery);
      }
      if (schemas.params) {
        req.params = parseSegment(schemas.params, req.params) as typeof req.params;
      }
      next();
    } catch (error) {
      next(error);
    }
  };


