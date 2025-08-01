import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack }) => {
      return `[${timestamp}]  ${level.toUpperCase()}: ${stack || message}`;
    })
  ),
  transports: [new transports.Console()],
});

export default logger;
