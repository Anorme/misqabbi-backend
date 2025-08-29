const allowedOrigins = {
  development: ["http://localhost:3000"],
  staging: ["https://misqabbigh.netlify.app"],
  production: [
    "https://shop.misqabbi.com",
    "https://www.misqabbi.com",
    "https://misqabbigh.netlify.app",
  ],
};

const corsOptions = env => {
  const whitelist = allowedOrigins[env] || [];
  return {
    /**
     * CORS origin function to check if the incoming request's origin is
     * allowed to make requests to the server.
     *
     * @param {string} origin - The origin of the incoming request.
     * @param {Function} callback - Called with either `null` or an `Error`
     *   object indicating whether the request is allowed or not.
     */
    origin: function (origin, callback) {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  };
};

export default corsOptions;
