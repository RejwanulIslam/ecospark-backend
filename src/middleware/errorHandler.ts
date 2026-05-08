import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Error:", err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err.name === "ZodError") {
    res.status(400).json({ error: "Validation failed", details: err.issues || err.errors || err.message });
    return;
  }

  if (err.name === "PrismaClientKnownRequestError") {
    res.status(400).json({ error: "Database error", details: err.message });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message, stack: err.stack }),
  });
};
