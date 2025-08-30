import pino from "pino";
import "pino-pretty";

export const pinoConfig = () => {
  const logger = pino({
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
