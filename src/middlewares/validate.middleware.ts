import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import apiResponse from '../utils/apiResponse';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json(apiResponse.badRequest('Validation failed', errors));
      }
      next(error);
    }
  };
};