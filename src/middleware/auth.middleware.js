// Middleware: verifyToken
// Purpose:  Authenticate requests using Firebase ID tokens

const { auth } = require("../config/firebase.config");

async function verifyToken(req, res, next) {
  // Expecting Authorization header in format: 'Bearer <idToken>'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided or format is incorrect" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  // Verify token using Firebase Admin SDK and attach identity info
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    // Attach decoded user info to req.user
    req.user = decodedToken; // Includes uid, email, etc.
    next();
  } catch (error) {
    // Handle missing/invalid token and send appropriate response
    console.error("Token verification failed:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

module.exports = verifyToken;
