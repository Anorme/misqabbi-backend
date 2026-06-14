/*eslint-disable no-undef */
import {
  assertEventAcceptsRegistrations,
  getTicketTypeById,
  hasCapacity,
  hasEventCapacity,
  hasTicketCapacity,
} from "../../../src/services/eventCapacityService.js";

describe("eventCapacityService", () => {
  const ticketTypeId = "64a000000000000000000001";
  const event = {
    _id: "64a000000000000000000010",
    status: "published",
    maxAttendees: 10,
    ticketTypes: [
      {
        _id: {
          toString: () => ticketTypeId,
        },
        maxQuantity: 5,
        soldCount: 3,
      },
    ],
  };

  it("checks event-level capacity using confirmed registration count", () => {
    expect(hasEventCapacity(event, 2, 8)).toBe(true);
    expect(hasEventCapacity(event, 3, 8)).toBe(false);
  });

  it("checks ticket-level capacity from max quantity and sold count", () => {
    expect(hasTicketCapacity(event.ticketTypes[0], 2)).toBe(true);
    expect(hasTicketCapacity(event.ticketTypes[0], 3)).toBe(false);
  });

  it("finds ticket types by embedded id", () => {
    expect(getTicketTypeById(event, ticketTypeId)).toBe(event.ticketTypes[0]);
    expect(getTicketTypeById(event, "64a000000000000000000002")).toBeNull();
  });

  it("combines event-level and ticket-level capacity checks", async () => {
    await expect(
      hasCapacity(event, 2, {
        confirmedCount: 8,
        ticketTypeId,
      })
    ).resolves.toBe(true);

    await expect(
      hasCapacity(event, 3, {
        confirmedCount: 7,
        ticketTypeId,
      })
    ).resolves.toBe(false);
  });

  it("blocks cancelled events from accepting registrations", async () => {
    const cancelledEvent = { ...event, status: "cancelled" };

    expect(() => assertEventAcceptsRegistrations(cancelledEvent)).toThrow(
      "Cancelled events do not accept registrations"
    );
    await expect(hasCapacity(cancelledEvent, 1, { confirmedCount: 0 })).rejects.toThrow(
      "Cancelled events do not accept registrations"
    );
  });
});
