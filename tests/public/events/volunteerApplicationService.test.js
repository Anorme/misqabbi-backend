/*eslint-disable no-undef */
import {
  assertVolunteerApplicationStatusTransition,
  canTransitionVolunteerApplicationStatus,
} from "../../../src/services/volunteerApplicationLogic.js";

describe("volunteerApplicationLogic", () => {
  it("allows pending applications to be accepted or rejected", () => {
    expect(canTransitionVolunteerApplicationStatus("pending", "accepted")).toBe(
      true
    );
    expect(canTransitionVolunteerApplicationStatus("pending", "rejected")).toBe(
      true
    );
  });

  it("allows reviewed applications to be reclassified", () => {
    expect(
      canTransitionVolunteerApplicationStatus("accepted", "rejected")
    ).toBe(true);
    expect(
      canTransitionVolunteerApplicationStatus("rejected", "accepted")
    ).toBe(true);
  });

  it("throws for invalid volunteer application statuses", () => {
    expect(() =>
      assertVolunteerApplicationStatusTransition("pending", "archived")
    ).toThrow("Invalid volunteer application status");
  });

  it("throws for unsupported transitions", () => {
    expect(() =>
      assertVolunteerApplicationStatusTransition("accepted", "pending")
    ).toThrow("Cannot transition volunteer application from accepted to pending");
  });
});
