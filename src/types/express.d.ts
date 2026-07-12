import { Request, Response, NextFunction } from 'express';

export type PromiseHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  fullName: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}