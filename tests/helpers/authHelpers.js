import supertest from "supertest";
import app from "../../src/app.js";

const API_PREFIX = process.env.API_PREFIX || "/api/v1";

/**
 * Verify that both auth cookies are present in the Set-Cookie header
 * @param {Array<string>|undefined} cookies - Array of cookie strings from Set-Cookie header
 * @returns {boolean} True if both auth_token and refresh_token are present
 */
function hasAuthCookies(cookies) {
  if (!cookies || !Array.isArray(cookies)) return false;
  const cookieNames = cookies.map(cookie => cookie.split("=")[0].trim());
  return (
    cookieNames.includes("auth_token") && cookieNames.includes("refresh_token")
  );
}

/**
 * @param {Object} userData - User data to use (email, password, displayName)
 * @param {Object} options - Options for authentication
 * @param {boolean} options.useSignup - Force signup (default: true, tries signup first)
 * @returns {Promise<Object>} Object with request agent, user data, and email
 */
export async function createAuthenticatedUser(
  userData = {},
  options = { useSignup: true }
) {
  const request = supertest(app);
  const randomId = Math.random().toString(36).substring(2, 6);

  const defaultUser = {
    email: userData.email || `test_${randomId}@example.com`,
    password: userData.password || "Test123!@#",
    displayName: userData.displayName || `Test User ${randomId}`,
  };

  if (options.useSignup) {
    const signupRes = await request.post(`${API_PREFIX}/auth/signup`).send({
      email: defaultUser.email,
      password: defaultUser.password,
      displayName: defaultUser.displayName,
    });

    // Supertest agent automatically maintains cookies for subsequent requests
    if (
      signupRes.status === 302 &&
      hasAuthCookies(signupRes.headers["set-cookie"])
    ) {
      return {
        request,
        user: defaultUser,
        email: defaultUser.email,
        password: defaultUser.password,
      };
    }

    // If signup failed (not 302 or missing cookies), fall through to login
  }

  const loginRes = await request.post(`${API_PREFIX}/auth/login`).send({
    email: defaultUser.email,
    password: defaultUser.password,
  });

  // Production behavior: login also redirects (302) after setting cookies
  if (loginRes.status !== 302) {
    throw new Error(
      `Failed to authenticate user: Expected 302 redirect, got ${loginRes.status} - ${JSON.stringify(loginRes.body)}`
    );
  }

  // Verify both auth cookies are present
  if (!hasAuthCookies(loginRes.headers["set-cookie"])) {
    throw new Error(
      "Authentication redirect occurred but required cookies (auth_token, refresh_token) were not set"
    );
  }

  // Supertest agent automatically maintains cookies for subsequent requests
  return {
    request,
    user: defaultUser,
    email: defaultUser.email,
    password: defaultUser.password,
  };
}

/**
 * @param {Object} userData - User data to use
 * @returns {Promise<Object>} Object with request agent and admin user
 */
export async function createAuthenticatedAdmin(userData = {}) {
  const { request, user, email, password } =
    await createAuthenticatedUser(userData);

  // Import here to avoid circular dependencies
  const { updateUserRole } = await import("../../src/models/user.model.js");

  // Update user role to admin
  await updateUserRole(user._id || user.id, "admin");

  return {
    request,
    user: { ...user, role: "admin" },
    email,
    password,
  };
}

/**
 * @param {Object} userData - User data to use
 * @returns {Promise<Object>} Object with cookies array and user data
 */
export async function getAuthCookies(userData = {}) {
  const request = supertest(app);

  const randomId = Math.random().toString(36).substring(2, 6);

  const defaultUser = {
    email: userData.email || `test_${randomId}@example.com`,
    password: userData.password || "Test123!@#",
    displayName: userData.displayName || `Test User ${randomId}`,
  };

  const res = await request.post(`${API_PREFIX}/auth/signup`).send(defaultUser);

  // Production behavior: signup redirects (302) after setting cookies
  if (res.status !== 302) {
    const loginRes = await request.post(`${API_PREFIX}/auth/login`).send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    if (loginRes.status !== 302) {
      throw new Error("Failed to authenticate user");
    }

    return {
      cookies: loginRes.headers["set-cookie"] || [],
      user: defaultUser,
    };
  }

  const cookies = res.headers["set-cookie"] || [];

  return {
    cookies,
    user: defaultUser,
  };
}

/**
 * @param {Array<string>} cookies - Array of cookie strings
 * @returns {supertest.SuperTest} Supertest agent with cookies set
 */
export function createRequestWithCookies(cookies) {
  const request = supertest(app);

  cookies.forEach(cookie => {
    const [nameValue] = cookie.split(";");
    const [name, value] = nameValue.split("=");
    if (name && value) {
      request.jar.setCookie(
        `${name.trim()}=${value.trim()}`,
        "http://localhost"
      );
    }
  });

  return request;
}
