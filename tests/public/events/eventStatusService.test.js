/*eslint-disable no-undef */
import {
  assertEventStatusTransition,
  canTransitionEventStatus,
} from "../../../src/services/eventStatusService.js";

describe("eventStatusService", () => {
  it("allows draft events to be published or cancelled", () => {
    expect(canTransitionEventStatus("draft", "published")).toBe(true);
    expect(canTransitionEventStatus("draft", "cancelled")).toBe(true);
  });

  it("allows published events to be cancelled", () => {
    expect(canTransitionEventStatus("published", "cancelled")).toBe(true);
  });

  it("prevents cancelled events from being restored", () => {
    expect(canTransitionEventStatus("cancelled", "draft")).toBe(false);
    expect(canTransitionEventStatus("cancelled", "published")).toBe(false);
  });

  it("throws for invalid lifecycle transitions", () => {
    expect(() =>
      assertEventStatusTransition("published", "draft")
    ).toThrow("Cannot transition event from published to draft");
  });

  it("throws for unsupported statuses", () => {
    expect(() => assertEventStatusTransition("draft", "archived")).toThrow(
      "Invalid event status"
    );
  });
});
