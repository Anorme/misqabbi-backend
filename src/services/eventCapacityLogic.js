export function assertEventAcceptsRegistrations(event) {
  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status === "cancelled") {
    throw new Error("Cancelled events do not accept registrations");
  }
}

export function hasEventCapacity(
  event,
  additionalCount = 1,
  confirmedCount = 0
) {
  if (!event) return false;

  return Number(confirmedCount) + Number(additionalCount) <= event.maxAttendees;
}

export function getTicketTypeById(event, ticketTypeId) {
  if (!event?.ticketTypes || !ticketTypeId) return null;

  if (typeof event.ticketTypes.id === "function") {
    return event.ticketTypes.id(ticketTypeId);
  }

  return (
    event.ticketTypes.find(
      ticketType => ticketType._id?.toString() === ticketTypeId.toString()
    ) ?? null
  );
}

export function hasTicketCapacity(ticketType, additionalCount = 1) {
  if (!ticketType) return false;

  const remaining =
    Number(ticketType.maxQuantity ?? 0) - Number(ticketType.soldCount ?? 0);

  return remaining >= Number(additionalCount);
}

export function checkCapacity(event, additionalCount = 1, options = {}) {
  assertEventAcceptsRegistrations(event);

  if (!hasEventCapacity(event, additionalCount, options.confirmedCount ?? 0)) {
    return false;
  }

  if (options.ticketTypeId) {
    const ticketType = getTicketTypeById(event, options.ticketTypeId);
    return hasTicketCapacity(ticketType, additionalCount);
  }

  return true;
}
