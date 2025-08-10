import env from "../config/env.js";
import jwt from "jsonwebtoken";

function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: Number(env.JWT_EXPIRES_IN) || 3600,
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export { signToken, verifyToken };
