/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("error", err);

  console.error(err);
  const defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong, try again later",
    fromPrisma: err.fromPrisma || false,
  };
  if (err.name === "ValidationError") {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;

    defaultError.message = Object.values(err.errors)
      .map((item: any) => item.message)
      .join(",");
  }
  if (err.code && err.code === 11000) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = `${Object.keys(
      err.keyValue
    )} field has to be unique`;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = err.meta?.cause || err.message;
    defaultError.fromPrisma = true;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = err.message;
    defaultError.fromPrisma = true;
  }
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    defaultError.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    defaultError.message = err.message;
    defaultError.fromPrisma = true;
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    defaultError.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    defaultError.message = err.message;
    defaultError.fromPrisma = true;
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    defaultError.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    defaultError.message = err.message;
    defaultError.fromPrisma = true;
  }

  if (err instanceof ZodError) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
    defaultError.message = err.issues.map((issue) => issue.message).join(",");
  }
  if (err.isAxiosError) {
    defaultError.statusCode =
      err.response?.status ||
      err.statusCode ||
      StatusCodes.INTERNAL_SERVER_ERROR;
    defaultError.message = err.response?.data || err.message;
  }

  res.status(defaultError.statusCode).json({
    message: defaultError.message,
    status: defaultError.statusCode,
    fromPrisma: defaultError.fromPrisma,
  });
};

export default errorHandlerMiddleware;
