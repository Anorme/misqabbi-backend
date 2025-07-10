// Middleware : checkAdmin
// Purpose: Ensure authenticated user has 'admin' role in Firestore before
// accessing protected routes

const { db } = require("../config/firebase.config");

async function checkAdmin(req, res, next) {
  // Ensure decoded UID is present (set by verifyToken middleware)
  const uid = req.user?.uid;

  if (!uid) {
    return res
      .status(401)
      .json({ message: "Missing user information in request" });
  }

  try {
    // retrieve user document from Firestore using UID
    const userDoc = await db.collection("users").doc(uid).get();
    const role = userDoc.data().role;

    // Enfore RBAC: Only 'admin' users may proceed
    if (role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error checking admin role: ", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = checkAdmin;
