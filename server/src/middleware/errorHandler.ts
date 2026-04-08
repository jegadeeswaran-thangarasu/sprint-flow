import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import ApiError from '../utils/ApiError';
import { TApiResponse } from '../types';
import logger from '../utils/logger';

const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  logger.error(err instanceof Error ? err.message : String(err));

  const body: TApiResponse<null> = {
    success: false,
    data: null,
    message,
  };

  if (process.env.NODE_ENV === 'development' && err instanceof Error && err.stack) {
    (body as TApiResponse<null> & { stack: string }).stack = err.stack;
  }

  res.status(statusCode).json(body);
};

export default errorHandler;
