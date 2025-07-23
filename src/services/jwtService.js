import jwt from "jsonwebtoken";

function signToken(payload) {
  console.log("Signing token expires in: ", process.env.JWT_EXPIRES_IN);
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export { signToken, verifyToken };
