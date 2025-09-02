"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const zod_1 = require("zod");
const errorHandlerMiddleware = (err, req, res, next) => {
    var _a, _b, _c;
    console.log("error", err);
    console.error(err);
    const defaultError = {
        statusCode: err.statusCode || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
        message: err.message || "Something went wrong, try again later",
        fromPrisma: err.fromPrisma || false,
    };
    if (err.name === "ValidationError") {
        defaultError.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        defaultError.message = Object.values(err.errors)
            .map((item) => item.message)
            .join(",");
    }
    if (err.code && err.code === 11000) {
        defaultError.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        defaultError.message = `${Object.keys(err.keyValue)} field has to be unique`;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        defaultError.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        defaultError.message = ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.cause) || err.message;
        defaultError.fromPrisma = true;
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        defaultError.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        defaultError.message = err.message;
        defaultError.fromPrisma = true;
    }
    if (err instanceof client_1.Prisma.PrismaClientRustPanicError) {
        defaultError.statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        defaultError.message = err.message;
        defaultError.fromPrisma = true;
    }
    if (err instanceof client_1.Prisma.PrismaClientInitializationError) {
        defaultError.statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        defaultError.message = err.message;
        defaultError.fromPrisma = true;
    }
    if (err instanceof client_1.Prisma.PrismaClientUnknownRequestError) {
        defaultError.statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        defaultError.message = err.message;
        defaultError.fromPrisma = true;
    }
    if (err instanceof zod_1.ZodError) {
        defaultError.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        defaultError.message = err.issues.map((issue) => issue.message).join(",");
    }
    if (err.isAxiosError) {
        defaultError.statusCode =
            ((_b = err.response) === null || _b === void 0 ? void 0 : _b.status) ||
                err.statusCode ||
                http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        defaultError.message = ((_c = err.response) === null || _c === void 0 ? void 0 : _c.data) || err.message;
    }
    res.status(defaultError.statusCode).json({
        message: defaultError.message,
        status: defaultError.statusCode,
        fromPrisma: defaultError.fromPrisma,
    });
};
exports.default = errorHandlerMiddleware;
