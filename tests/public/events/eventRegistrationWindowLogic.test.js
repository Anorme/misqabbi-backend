/*eslint-disable no-undef */
import {
  assertEventRegistrationOpen,
  isEventRegistrationOpen,
  REGISTRATION_CLOSED_MESSAGE,
} from "../../../src/services/eventRegistrationWindowLogic.js";

describe("eventRegistrationWindowLogic", () => {
  const eventDate = "2026-08-01T18:00:00.000Z";
  const event = { eventDate };

  it("is open when now is before eventDate", () => {
    expect(
      isEventRegistrationOpen(event, new Date("2026-08-01T17:59:59.999Z"))
    ).toBe(true);
  });

  it("is closed when now equals eventDate", () => {
    expect(isEventRegistrationOpen(event, new Date(eventDate))).toBe(false);
  });

  it("is closed when now is after eventDate", () => {
    expect(
      isEventRegistrationOpen(event, new Date("2026-08-01T18:00:00.001Z"))
    ).toBe(false);
  });

  it("is closed when eventDate is missing or invalid", () => {
    expect(isEventRegistrationOpen({}, new Date(eventDate))).toBe(false);
    expect(
      isEventRegistrationOpen({ eventDate: "not-a-date" }, new Date(eventDate))
    ).toBe(false);
    expect(isEventRegistrationOpen(null, new Date(eventDate))).toBe(false);
  });

  it("assertEventRegistrationOpen allows open events", () => {
    expect(() =>
      assertEventRegistrationOpen(event, new Date("2026-07-01T00:00:00.000Z"))
    ).not.toThrow();
  });

  it("assertEventRegistrationOpen rejects closed events", () => {
    expect(() =>
      assertEventRegistrationOpen(event, new Date("2026-08-02T00:00:00.000Z"))
    ).toThrow(REGISTRATION_CLOSED_MESSAGE);
  });
});
