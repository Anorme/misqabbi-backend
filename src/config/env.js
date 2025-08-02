import dotenvFlow from "dotenv-flow";
dotenvFlow.config();

import { cleanEnv, str, port, url, num } from "envalid";

export default cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "staging", "preview", "production"],
  }),
  PORT: port({ default: 3000 }),
  MONGO_URL: str(),
  JWT_SECRET: str(),
  JWT_EXPIRES_IN: num(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  GOOGLE_CALLBACK_URL: url(),
});
