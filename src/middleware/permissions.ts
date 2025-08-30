import { UnAuthorizedError } from '../errors';
import { Request, Response, NextFunction } from 'express';

export const isAuthorized = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    if (process.env.AUTH === 'false') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      throw new UnAuthorizedError(
        'You are not authorized to access this route'
      );
    }
    next();
  };
};
