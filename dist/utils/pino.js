"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinoConfig = void 0;
const pino_1 = __importDefault(require("pino"));
require("pino-pretty");
const pinoConfig = () => {
    const logger = (0, pino_1.default)({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: true,
                ignore: "pid,hostname ",
            },
        },
    });
    return logger;
};
exports.pinoConfig = pinoConfig;
