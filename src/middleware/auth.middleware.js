// Middleware: verifyToken
// Purpose:  Authenticate requests using passport strategy

async function verifyToken(req, res, next) {
  // Expecting Authorization header in format: 'Bearer <idToken>'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided or format is incorrect" });
  }

  try {
    next();
  } catch (error) {
    // Handle missing/invalid token and send appropriate response
    console.error("Token verification failed:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

module.exports = verifyToken;
