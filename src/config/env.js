import fs from "node:fs";
import dotenvFlow from "dotenv-flow";
import { cleanEnv, str, url } from "envalid";

if (fs.existsSync(".env")) {
  dotenvFlow.config();
}

const rawEnv = process.env.NODE_ENV || "development";
const isProdLike = ["preview", "production", "staging"].includes(rawEnv);

const baseSchema = {
  NODE_ENV: str({
    choices: ["development", "preview", "production", "staging", "test"],
    default: "development",
  }),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  GOOGLE_CALLBACK_URL: url(),
  GOOGLE_REDIRECT_URL: url(),
  BASE_URL: url(),
  EMAIL_PASS: str(),
  EMAIL_USER: str(),
  EMAIL_FROM: str(),

  COOKIE_ENV: str({
    choices: ["local", "development", "staging", "production"],
    default: "local",
  }),
};

const fullSchema = {
  ...baseSchema,
  LOGTAIL_TOKEN: str(),
  LOGTAIL_INGESTING_HOST: str(),
};

export default cleanEnv(process.env, isProdLike ? fullSchema : baseSchema);
