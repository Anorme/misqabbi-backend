/*eslint-disable no-undef */
import {
  assertEventTicketCheckoutAllowed,
  buildEventPurchaseData,
  calculateTicketPurchaseAmount,
  getPayerEmail,
} from "../../../src/services/eventCheckoutService.js";

describe("eventCheckoutService", () => {
  const event = {
    _id: "64a000000000000000000010",
    type: "paid",
    status: "published",
    maxAttendees: 10,
  };
  const ticketType = {
    _id: "64a000000000000000000001",
    name: "Early Bird",
    pricePesewas: 5000,
    maxQuantity: 5,
    soldCount: 2,
    expiresAt: "2026-08-02T18:00:00.000Z",
    isActive: true,
  };

  it("calculates ticket purchase totals in pesewas", () => {
    expect(calculateTicketPurchaseAmount(ticketType, 3)).toBe(15000);
  });

  it("builds a transaction snapshot for event ticket purchases", () => {
    expect(buildEventPurchaseData(event, ticketType, 2)).toEqual({
      eventId: event._id,
      ticketTypeId: ticketType._id,
      quantity: 2,
      ticketName: "Early Bird",
      pricePerTicket: 5000,
      totalPrice: 10000,
    });
  });

  it("prefers authenticated user email and falls back to guest email", () => {
    expect(
      getPayerEmail({
        type: "user",
        user: { email: "owner@example.com" },
      })
    ).toBe("owner@example.com");
    expect(getPayerEmail({ type: "guest" }, { email: "guest@example.com" })).toBe(
      "guest@example.com"
    );
  });

  it("allows checkout when event and ticket capacities are available", () => {
    expect(() =>
      assertEventTicketCheckoutAllowed(event, ticketType, 2, 8)
    ).not.toThrow();
  });

  it("rejects checkout when event capacity is exceeded", () => {
    expect(() =>
      assertEventTicketCheckoutAllowed(event, ticketType, 2, 9)
    ).toThrow("Event does not have enough remaining capacity");
  });

  it("rejects checkout when ticket capacity is exceeded", () => {
    expect(() =>
      assertEventTicketCheckoutAllowed(event, ticketType, 4, 1)
    ).toThrow("Ticket type is not available for purchase");
  });
});
