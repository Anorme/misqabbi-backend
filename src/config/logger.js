import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import env from "../config/env.js";
import { createLogger, format, transports } from "winston";

const { NODE_ENV } = env;

const { colorize, combine, timestamp, errors, printf } = format;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = NODE_ENV === "development";
const isPreview = NODE_ENV === "preview";
const isProdLike = NODE_ENV === "staging" || NODE_ENV === "production";

if (isProdLike) {
  const logDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level.toUpperCase()}: ${stack || message}`;
});

const logger = createLogger({
  level: isDev ? "debug" : isPreview ? "info" : "warn",
  format: combine(timestamp(), errors({ stack: true }), logFormat),
  transports: [
    ...(isDev || isPreview
      ? [new transports.Console({ format: combine(colorize(), logFormat) })]
      : []),
    ...(isProdLike
      ? [
          new transports.File({
            filename: path.join(__dirname, "logs", "error.log"),
            level: "error",
          }),
          new transports.File({
            filename: path.join(__dirname, "logs", "combined.log"),
          }),
        ]
      : []),
  ],
});

export default logger;
