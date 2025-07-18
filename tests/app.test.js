/* eslint-disable no-undef */
const request = require("supertest");
const app = require("../src/app");

describe("Health Check", () => {
  it("should return 200 OK with a welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Misqabbi backend is live");
  });
});
