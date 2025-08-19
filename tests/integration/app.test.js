/* eslint-disable no-undef */
import supertest from "supertest";
import app from "../../src/app.js";

const request = supertest(app);

describe("Health Check", () => {
  it("should return 200 OK with a welcome message", async () => {
    const res = await request.get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Misqabbi backend is live");
  });
});
