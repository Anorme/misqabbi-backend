import env from "../config/env.js";

const cookieEnv = env.COOKIE_ENV || "local";

const COOKIE_SETTINGS = {
  local: { secure: false, sameSite: "lax", domain: undefined },
  development: { secure: true, sameSite: "none", domain: ".misqabbigh.com" },
  staging: { secure: true, sameSite: "none", domain: ".misqabbigh.com" },
  production: { secure: true, sameSite: "none", domain: ".misqabbigh.com" },
};

function resolveOpts() {
  return COOKIE_SETTINGS[cookieEnv] || COOKIE_SETTINGS["local"];
}

export default function getCookieOptions() {
  const opts = resolveOpts();
  return {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    domain: opts.domain,
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export function getAccessTokenCookieOptions() {
  const opts = resolveOpts();

  return {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    domain: opts.domain,
    maxAge: Number(env.ACCESS_TOKEN_EXPIRES_IN) * 1000 || 15 * 60 * 1000, // 15 minutes
  };
}

export function getRefreshTokenCookieOptions() {
  const opts = resolveOpts();

  return {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    domain: opts.domain,
    path: `${env.API_PREFIX}/auth/refresh`,
    maxAge:
      Number(env.REFRESH_TOKEN_EXPIRES_IN) * 1000 || 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
