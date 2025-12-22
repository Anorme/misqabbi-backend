import supertest from "supertest";
import app from "../../src/app.js";

const API_PREFIX = process.env.API_PREFIX || "/api/v1";

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
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  const defaultUser = {
    email: userData.email || `test_${timestamp}_${randomSuffix}@example.com`,
    password: userData.password || "Test123!@#",
    displayName: userData.displayName || `Test User ${randomSuffix}`,
  };

  if (options.useSignup) {
    const signupRes = await request.post(`${API_PREFIX}/auth/signup`).send({
      email: defaultUser.email,
      password: defaultUser.password,
      displayName: defaultUser.displayName,
    });

    if (signupRes.status === 200 || signupRes.status === 201) {
      return {
        request,
        user: defaultUser,
        email: defaultUser.email,
        password: defaultUser.password,
      };
    }
  }

  const loginRes = await request.post(`${API_PREFIX}/auth/login`).send({
    email: defaultUser.email,
    password: defaultUser.password,
  });

  if (loginRes.status !== 200) {
    throw new Error(
      `Failed to authenticate user: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`
    );
  }

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

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  const defaultUser = {
    email: userData.email || `test_${timestamp}_${randomSuffix}@example.com`,
    password: userData.password || "Test123!@#",
    displayName: userData.displayName || `Test User ${randomSuffix}`,
  };

  const res = await request.post(`${API_PREFIX}/auth/signup`).send(defaultUser);

  if (res.status !== 200 && res.status !== 201) {
    const loginRes = await request.post(`${API_PREFIX}/auth/login`).send({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    if (loginRes.status !== 200) {
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
