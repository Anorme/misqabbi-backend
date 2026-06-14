/*eslint-disable no-undef */
import {
  assertCanDeleteTicketType,
  assertCanUpdateTicketType,
  assertPaidEventCanPublish,
  assertPaidEventSupportsTickets,
  buildTicketTypePayload,
  canDeleteTicketType,
  computeDefaultExpiry,
  isTicketPurchasable,
} from "../../../src/services/eventTicketService.js";

describe("eventTicketService", () => {
  const eventDate = "2026-08-01T18:00:00.000Z";
  const paidPublishedEvent = {
    type: "paid",
    status: "published",
    eventDate,
    ticketTypes: [],
  };

  it("computes the default ticket expiry one day after the event date", () => {
    expect(computeDefaultExpiry(eventDate).toISOString()).toBe(
      "2026-08-02T18:00:00.000Z"
    );
  });

  it("builds ticket payloads with auto expiry when no expiry is provided", () => {
    const payload = buildTicketTypePayload(
      {
        name: "Early Bird",
        pricePesewas: 5000,
        maxQuantity: 20,
      },
      paidPublishedEvent
    );

    expect(payload).toMatchObject({
      name: "Early Bird",
      pricePesewas: 5000,
      maxQuantity: 20,
      soldCount: 0,
      expirySource: "auto",
      isActive: true,
    });
    expect(payload.expiresAt.toISOString()).toBe("2026-08-02T18:00:00.000Z");
  });

  it("marks ticket expiry as manual when an override is provided", () => {
    const payload = buildTicketTypePayload(
      {
        name: "VIP",
        pricePesewas: 15000,
        maxQuantity: 10,
        expiresAt: "2026-07-15T18:00:00.000Z",
      },
      paidPublishedEvent
    );

    expect(payload.expirySource).toBe("manual");
    expect(payload.expiresAt.toISOString()).toBe("2026-07-15T18:00:00.000Z");
  });

  it("only allows deleting ticket types without sold tickets", () => {
    expect(canDeleteTicketType({ soldCount: 0 })).toBe(true);
    expect(canDeleteTicketType({ soldCount: 1 })).toBe(false);
    expect(() => assertCanDeleteTicketType({ soldCount: 1 })).toThrow(
      "Ticket types with purchased tickets cannot be deleted"
    );
  });

  it("prevents reducing max quantity below sold count", () => {
    expect(() =>
      assertCanUpdateTicketType({ soldCount: 5 }, { maxQuantity: 4 })
    ).toThrow("Ticket max quantity cannot be less than tickets sold");
  });

  it("requires ticket types to belong to paid events", () => {
    expect(() => assertPaidEventSupportsTickets({ type: "free" })).toThrow(
      "Ticket types can only be configured for paid events"
    );
  });

  it("requires active ticket types before publishing paid events", () => {
    expect(() =>
      assertPaidEventCanPublish({ type: "paid", ticketTypes: [] })
    ).toThrow("Paid events require at least one active ticket type");

    expect(() =>
      assertPaidEventCanPublish({
        type: "paid",
        ticketTypes: [{ isActive: true }],
      })
    ).not.toThrow();
  });

  it("checks whether a ticket type is purchasable", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");
    const ticketType = {
      isActive: true,
      expiresAt: "2026-08-02T18:00:00.000Z",
      maxQuantity: 10,
      soldCount: 8,
    };

    expect(isTicketPurchasable(ticketType, paidPublishedEvent, 2, now)).toBe(
      true
    );
    expect(isTicketPurchasable(ticketType, paidPublishedEvent, 3, now)).toBe(
      false
    );
  });
});
