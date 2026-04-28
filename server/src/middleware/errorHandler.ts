import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = error.status || error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  console.error(`[${new Date().toISOString()}] Error:`, {
    status,
    message,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error: AppError = new Error(
    `Route not found: ${req.method} ${req.path}`
  );
  error.status = 404;
  next(error);
}
