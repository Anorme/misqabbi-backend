import { hasEventCapacity } from "./eventCapacityLogic.js";
import { assertEventRegistrationOpen } from "./eventRegistrationWindowLogic.js";
import { isTicketPurchasable } from "./eventTicketLogic.js";

export function calculateTicketPurchaseAmount(ticketType, quantity) {
  return Number(ticketType.pricePesewas) * Number(quantity);
}

export function getPayerEmail(principal, guestInfo = {}) {
  if (principal?.type === "user" && principal.user?.email) {
    return principal.user.email;
  }

  return guestInfo.email;
}

export function buildEventPurchaseData(event, ticketType, quantity) {
  return {
    eventId: event._id,
    ticketTypeId: ticketType._id,
    quantity,
    ticketName: ticketType.name,
    pricePerTicket: ticketType.pricePesewas,
    totalPrice: calculateTicketPurchaseAmount(ticketType, quantity),
  };
}

export function assertEventTicketCheckoutAllowed(
  event,
  ticketType,
  quantity,
  confirmedCount = 0,
  now = new Date()
) {
  if (!event) {
    throw new Error("Event not found");
  }

  if (!ticketType) {
    throw new Error("Ticket type not found");
  }

  assertEventRegistrationOpen(event, now);

  if (!hasEventCapacity(event, quantity, confirmedCount)) {
    throw new Error("Event does not have enough remaining capacity");
  }

  if (!isTicketPurchasable(ticketType, event, quantity, now)) {
    throw new Error("Ticket type is not available for purchase");
  }
}
