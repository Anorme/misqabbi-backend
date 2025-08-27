const allowedOrigins = {
  development: "http://localhost:3000",
  staging: ["https://misqabbigh.netlify.app"],
  production: [
    "https://shop.misqabbi.com",
    "https://www.misqabbi.com",
    "https://misqabbigh.netlify.app",
  ],
};

/**
 * Generates a CORS configuration object for the given environment (NODE_ENV).
 *
 * @param {string} env - The environment name (NODE_ENV) to generate the CORS
 *     configuration for.
 * @returns {Object} A CORS configuration object with the following properties:
 *     - origin: The value of the Access-Control-Allow-Origin header.
 *     - methods: An array of allowed HTTP request methods.
 */
const corsOptions = env => {
  const origin = allowedOrigins[env] || "*";
  return {
    origin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  };
};

export default corsOptions;
