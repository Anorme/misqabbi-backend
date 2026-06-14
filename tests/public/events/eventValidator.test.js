/*eslint-disable no-undef */
import {
  eventStatusValidator,
  eventTicketTypeValidator,
  eventValidator,
} from "../../../src/validators/event.validator.js";

describe("eventValidator", () => {
  const validEvent = {
    name: "Summer Pop-up",
    description: "A community event for Misqabbi customers.",
    eventDate: "2026-08-01T18:00:00.000Z",
    type: "free",
    maxAttendees: 50,
    venue: {
      name: "Studio",
      address: "Accra",
      url: "https://example.com/venue",
    },
  };

  it("accepts a valid event creation payload", () => {
    const { error } = eventValidator.validate(validEvent, {
      abortEarly: false,
    });

    expect(error).toBeUndefined();
  });

  it("requires core event fields on creation", () => {
    const { error } = eventValidator.validate({}, { abortEarly: false });

    expect(error.details.map(detail => detail.message)).toEqual(
      expect.arrayContaining([
        "Event name is required",
        "Event description is required",
        "Event date is required",
        "\"type\" is required",
        "Event size is required",
      ])
    );
  });

  it("rejects invalid event types", () => {
    const { error } = eventValidator.validate(
      { ...validEvent, type: "invite-only" },
      { abortEarly: false }
    );

    expect(error.details[0].message).toContain("must be one of");
  });

  it("rejects event sizes below one attendee", () => {
    const { error } = eventValidator.validate(
      { ...validEvent, maxAttendees: 0 },
      { abortEarly: false }
    );

    expect(error.details.map(detail => detail.message)).toContain(
      "Event size must be at least 1"
    );
  });

  it("validates status update payloads", () => {
    expect(eventStatusValidator.validate({ status: "published" }).error).toBe(
      undefined
    );
    expect(
      eventStatusValidator.validate({ status: "archived" }).error
    ).toBeDefined();
  });

  it("validates ticket type creation payloads", () => {
    const { error } = eventTicketTypeValidator.validate({
      name: "Early Bird",
      pricePesewas: 5000,
      maxQuantity: 20,
      expiresAt: "2026-08-02T18:00:00.000Z",
    });

    expect(error).toBeUndefined();
  });

  it("rejects invalid ticket type prices and quantities", () => {
    const { error } = eventTicketTypeValidator.validate(
      {
        name: "Early Bird",
        pricePesewas: 0,
        maxQuantity: 0,
      },
      { abortEarly: false }
    );

    expect(error.details.map(detail => detail.message)).toEqual(
      expect.arrayContaining([
        "Ticket price must be at least 1 pesewa",
        "Ticket max quantity must be at least 1",
      ])
    );
  });
});
