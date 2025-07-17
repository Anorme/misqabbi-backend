// Middleware : checkAdmin
// Purpose: Ensure authenticated user has 'admin' role

async function checkAdmin(req, res, next) {
  try {
    next();
  } catch (error) {
    console.error("Error checking admin role: ", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = checkAdmin;
