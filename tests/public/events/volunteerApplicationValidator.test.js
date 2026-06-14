/*eslint-disable no-undef */
import { volunteerApplicationStatusValidator } from "../../../src/validators/volunteerApplication.validator.js";

describe("volunteerApplication.validator", () => {
  it("accepts supported volunteer application statuses", () => {
    expect(
      volunteerApplicationStatusValidator.validate({ status: "pending" }).error
    ).toBeUndefined();
    expect(
      volunteerApplicationStatusValidator.validate({ status: "accepted" }).error
    ).toBeUndefined();
    expect(
      volunteerApplicationStatusValidator.validate({ status: "rejected" }).error
    ).toBeUndefined();
  });

  it("rejects unsupported volunteer application statuses", () => {
    expect(
      volunteerApplicationStatusValidator.validate({ status: "archived" }).error
    ).toBeDefined();
  });
});
