import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

import env from "../config/env.js";
import { createLogger, format, transports } from "winston";

const { NODE_ENV } = env;

const { colorize, combine, timestamp, errors, printf } = format;

const isDev = NODE_ENV === "development";
const isPreview = NODE_ENV === "preview";
const isProdLike = ["production", "staging"].includes(NODE_ENV);

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level.toUpperCase()}: ${stack || message}`;
});

const loggerTransports = [];

// Console transport for dev and preview
if (isDev || isPreview) {
  loggerTransports.push(
    new transports.Console({
      format: combine(colorize(), errors({ stack: true }), logFormat),
    })
  );
}

// Telemetry transport for prod-like environments
if (isProdLike && env.LOGTAIL_TOKEN) {
  const logtail = new Logtail(env.LOGTAIL_TOKEN, {
    endpoint: `https://${env.LOGTAIL_INGESTING_HOST}`,
  });
  loggerTransports.push(new LogtailTransport(logtail));
}

const logger = createLogger({
  level: isProdLike ? "warn" : isPreview ? "info" : "debug",
  format: combine(timestamp(), errors({ stack: true }), logFormat),
  transports: loggerTransports,
});

export default logger;
