/* eslint-disable no-undef */
import { request } from "supertest";
import app from "../src/app.js";

describe("Health Check", () => {
  it("should return 200 OK with a welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Misqabbi backend is live");
  });
});
