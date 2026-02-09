// Allowed origins = CLIENT_URL + CORS_ORIGINS (comma-separated) + Paystack.
// Config is passed from app.js so this file stays testable and has no env dependency.
const PAYSTACK_ORIGINS = [
  "https://checkout.paystack.com",
  "https://api.paystack.co",
];

function parseOrigins(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * @param {{ CLIENT_URL: string, CORS_ORIGINS?: string }} config - Env config from app.
 */
const corsOptions = config => {
  const extra = parseOrigins(config.CORS_ORIGINS);
  const whitelist = [
    ...new Set([config.CLIENT_URL, ...extra, ...PAYSTACK_ORIGINS]),
  ];

  return {
    origin(origin, callback) {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  };
};

export default corsOptions;
