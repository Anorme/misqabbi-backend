import env from "../config/env.js";

const cookieEnv = env.COOKIE_ENV || "local";

const COOKIE_SETTINGS = {
  local: { secure: false, sameSite: "lax", domain: undefined },
  development: { secure: true, sameSite: "none", domain: undefined },
  staging: { secure: true, sameSite: "none", domain: ".misqabbi.com" },
  production: { secure: true, sameSite: "none", domain: ".misqabbi.com" },
};

export default function getCookieOptions() {
  const opts = COOKIE_SETTINGS[cookieEnv] || COOKIE_SETTINGS["local"];

  return {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    domain: opts.domain,
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export function getAccessTokenCookieOptions() {
  const opts = COOKIE_SETTINGS[cookieEnv] || COOKIE_SETTINGS["local"];

  return {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    domain: opts.domain,
    maxAge: Number(env.ACCESS_TOKEN_EXPIRES_IN) * 1000 || 15 * 60 * 1000, // 15 minutes
  };
}

export function getRefreshTokenCookieOptions() {
  const opts = COOKIE_SETTINGS[cookieEnv] || COOKIE_SETTINGS["local"];

  return {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    domain: opts.domain,
    path: "/auth/refresh", // Restrict to refresh endpoint
    maxAge:
      Number(env.REFRESH_TOKEN_EXPIRES_IN) * 1000 || 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
