import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import { AuthUser } from '../types/express';

export type Role = 'ADMIN';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;

    if (!user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(user.role as Role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;

  if (!user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (user.role !== 'ADMIN') {
    return next(ApiError.forbidden('Admin access required'));
  }

  next();
};

export const requireManager = (req: Request, res: Response, next: NextFunction) => {
  // Redirect to requireAdmin - only ADMIN role is allowed
  return requireAdmin(req, res, next);
};

export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;

    if (!user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (user.role !== 'ADMIN') {
      return next(ApiError.forbidden('Admin access required'));
    }

    next();
  };
};
