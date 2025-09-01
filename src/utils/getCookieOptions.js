import env from "../config/env.js";

const isDev = env.NODE_ENV === "development";
const isProdlike = env.NODE_ENV === "production" || env.NODE_ENV === "staging";
const isTest = env.NODE_ENV === "test";

export default function getCookieOptions() {
  return {
    httpOnly: true,
    secure: isProdlike,
    sameSite: isDev ? "lax" : isTest ? "strict" : "none",
    maxAge: 8 * 60 * 60 * 1000,
  };
}
