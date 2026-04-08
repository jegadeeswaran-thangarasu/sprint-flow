import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError';
import { TJwtPayload } from '../types';

const authenticate: RequestHandler = (req, _res, next): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new ApiError(401, 'No token provided'));
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    next(new ApiError(500, 'JWT_SECRET is not configured'));
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === 'string') throw new ApiError(401, 'Invalid token');
    req.user = decoded as TJwtPayload;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export default authenticate;
